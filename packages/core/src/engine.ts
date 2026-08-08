import { REWARD_LADDER, ROUND_OPEN_COUNTS } from './rewards'
import type {
  CapitalistOffer,
  CounterResolution,
  EndReason,
  GameState,
  PrizeBox,
  Settlement,
} from './types'

const CAPITALIST_QUOTES = {
  low: [
    'Cute opening. The desk can buy your risk cheaply.',
    'This portfolio still looks soft. I am bidding like a predator.',
  ],
  measured: [
    'Fair value is getting interesting. I will pay for certainty.',
    'The board has teeth now. This is a clean mark-to-market bid.',
  ],
  sharp: [
    'You removed dead money. I have to respect the tape.',
    'The market is leaning your way. Do not confuse luck with leverage.',
  ],
  hostile: [
    'That vault is dangerous. I am paying to end the trade.',
    'You have my attention. Take the money before the table turns.',
  ],
} satisfies Record<CapitalistOffer['pressure'], string[]>

export function createNewGame(random: () => number = Math.random): GameState {
  return {
    boxes: shuffle(REWARD_LADDER, random).map((reward, index) => ({
      id: index + 1,
      reward,
    })),
    selectedBoxId: null,
    openedBoxIds: [],
    phase: 'selecting',
    roundIndex: 0,
    currentOffer: null,
    offerHistory: [],
    lastCounter: null,
    settlement: null,
  }
}

export function selectBox(game: GameState, boxId: number): GameState {
  if (game.phase !== 'selecting' || !game.boxes.some((box) => box.id === boxId)) {
    return game
  }

  return {
    ...game,
    selectedBoxId: boxId,
    phase: 'opening',
  }
}

export function openBox(game: GameState, boxId: number): GameState {
  if (
    game.phase !== 'opening' ||
    game.selectedBoxId === null ||
    !game.boxes.some((box) => box.id === boxId) ||
    boxId === game.selectedBoxId ||
    game.openedBoxIds.includes(boxId)
  ) {
    return game
  }

  const openedBoxIds = [...game.openedBoxIds, boxId]
  const nextGame = {
    ...game,
    openedBoxIds,
    lastCounter: null,
  }

  if (getBoxesLeftToOpenThisRound(nextGame) <= 0) {
    const currentOffer = buildOffer(nextGame)

    return {
      ...nextGame,
      phase: 'offer' as const,
      currentOffer,
      offerHistory: [...nextGame.offerHistory, currentOffer],
    }
  }

  return nextGame
}

export function holdOffer(game: GameState): GameState {
  if (game.phase !== 'offer') {
    return game
  }

  const nextRoundIndex = game.roundIndex + 1

  if (nextRoundIndex >= ROUND_OPEN_COUNTS.length) {
    return settleGame(game, 'heldToReveal')
  }

  return {
    ...game,
    phase: 'opening',
    roundIndex: nextRoundIndex,
    currentOffer: null,
    lastCounter: null,
  }
}

export function acceptCurrentOffer(game: GameState): GameState {
  if (game.phase !== 'offer' || !game.currentOffer) {
    return game
  }

  return settleGame(game, 'deal', game.currentOffer.amount)
}

export function makeCounterOffer(game: GameState, playerAsk: number): GameState {
  if (game.phase !== 'offer' || !game.currentOffer || playerAsk <= 0) {
    return game
  }

  const resolution = resolveCounter(game, playerAsk)

  if (resolution.kind === 'accepted') {
    return settleGame(game, 'counterAccepted', resolution.playerAsk)
  }

  if (resolution.kind === 'countered' && resolution.capitalistAmount) {
    return {
      ...game,
      currentOffer: {
        ...game.currentOffer,
        amount: resolution.capitalistAmount,
        quote: resolution.note,
      },
      lastCounter: resolution,
    }
  }

  return {
    ...game,
    lastCounter: resolution,
  }
}

export function getBoxesLeftToOpenThisRound(game: GameState) {
  const openedBeforeRound = ROUND_OPEN_COUNTS.slice(0, game.roundIndex).reduce(
    (total, count) => total + count,
    0,
  )
  const openedThisRound = game.openedBoxIds.length - openedBeforeRound

  return Math.max(ROUND_OPEN_COUNTS[game.roundIndex] - openedThisRound, 0)
}

export function getRemainingBoxes(game: GameState) {
  return game.boxes.filter((box) => !game.openedBoxIds.includes(box.id))
}

export function getOpenableBoxes(game: GameState) {
  return game.boxes.filter(
    (box) => box.id !== game.selectedBoxId && !game.openedBoxIds.includes(box.id),
  )
}

export function calculateEV(game: GameState) {
  const remaining = getRemainingBoxes(game)

  if (remaining.length === 0) {
    return 0
  }

  return remaining.reduce((total, box) => total + box.reward, 0) / remaining.length
}

export function calculateVolatility(boxes: PrizeBox[]) {
  if (boxes.length <= 1) {
    return 0
  }

  const ev = boxes.reduce((total, box) => total + box.reward, 0) / boxes.length
  const variance =
    boxes.reduce((total, box) => total + (box.reward - ev) ** 2, 0) / boxes.length

  return Math.sqrt(variance)
}

function buildOffer(game: GameState): CapitalistOffer {
  const remaining = getRemainingBoxes(game)
  const ev = calculateEV(game)
  const volatility = calculateVolatility(remaining)
  const progress = game.openedBoxIds.length / 18
  const survivalBonus = getHighValueSurvivalRatio(game)
  const volatilityDrag = Math.min(0.18, volatility / Math.max(ev, 1) / 18)
  const multiplier = clamp(
    0.58 + progress * 0.31 + survivalBonus * 0.12 - volatilityDrag,
    0.48,
    0.95,
  )
  const pressure = getPressure(multiplier, ev)
  const quotePool = CAPITALIST_QUOTES[pressure]

  return {
    round: game.roundIndex + 1,
    amount: roundToMarketNumber(ev * multiplier),
    ev,
    multiplier,
    pressure,
    quote: quotePool[game.roundIndex % quotePool.length],
  }
}

function resolveCounter(game: GameState, playerAsk: number): CounterResolution {
  const offer = game.currentOffer

  if (!offer) {
    throw new Error('Cannot resolve a counter without an active offer.')
  }

  const progress = game.openedBoxIds.length / 18
  const remaining = getRemainingBoxes(game)
  const volatility = calculateVolatility(remaining)
  const volatilityRatio = volatility / Math.max(offer.ev, 1)
  const acceptanceLine = offer.ev * (0.64 + progress * 0.28)
  const negotiationCeiling =
    offer.ev * (0.86 + progress * 0.18 - Math.min(0.08, volatilityRatio / 40))

  if (playerAsk <= Math.max(offer.amount, acceptanceLine)) {
    return {
      kind: 'accepted',
      playerAsk: roundToMarketNumber(playerAsk),
      note: 'Accepted. The desk would rather close the position than keep bleeding risk.',
    }
  }

  if (playerAsk <= negotiationCeiling) {
    const capitalistAmount = roundToMarketNumber(
      Math.max(offer.amount * 1.06, playerAsk * 0.62 + offer.amount * 0.38),
    )

    return {
      kind: 'countered',
      playerAsk: roundToMarketNumber(playerAsk),
      capitalistAmount,
      note: 'Countered. I moved, but I am not underwriting your fantasy multiple.',
    }
  }

  return {
    kind: 'rejected',
    playerAsk: roundToMarketNumber(playerAsk),
    note: 'Rejected. That ask is above the risk desk limit.',
  }
}

function settleGame(
  game: GameState,
  endReason: EndReason,
  acceptedAmount?: number,
): GameState {
  const personalBox = game.boxes.find((box) => box.id === game.selectedBoxId)

  if (!personalBox) {
    return game
  }

  const payout = endReason === 'heldToReveal' ? personalBox.reward : (acceptedAmount ?? 0)
  const settlement = buildSettlement(endReason, payout, personalBox.reward)

  return {
    ...game,
    phase: 'ended',
    currentOffer: null,
    lastCounter: null,
    settlement,
  }
}

function buildSettlement(
  endReason: EndReason,
  payout: number,
  personalBoxReward: number,
): Settlement {
  const beatTheBox = payout >= personalBoxReward
  const topQuartile = personalBoxReward >= 250_000

  if (endReason === 'heldToReveal') {
    return {
      endReason,
      payout,
      personalBoxReward,
      ratingEmoji: topQuartile ? '🗿' : '🤡',
      grade: topQuartile ? 'Stone-handed closer' : 'Variance casualty',
      note: topQuartile
        ? 'You held through the noise and owned the upside.'
        : 'You rejected liquidity and discovered gravity.',
    }
  }

  return {
    endReason,
    payout,
    personalBoxReward,
    ratingEmoji: beatTheBox ? '🗿' : '🤡',
    grade: beatTheBox ? 'Capital efficient exit' : 'Sold the vault too early',
    note: beatTheBox
      ? 'You made the Capitalist overpay your hidden box.'
      : 'The briefcase was richer than the buyout.',
  }
}

function getPressure(multiplier: number, ev: number): CapitalistOffer['pressure'] {
  if (multiplier >= 0.88 && ev >= 100_000) return 'hostile'
  if (multiplier >= 0.78) return 'sharp'
  if (multiplier >= 0.66) return 'measured'
  return 'low'
}

function getHighValueSurvivalRatio(game: GameState) {
  const highRewards = REWARD_LADDER.filter((reward) => reward >= 100_000)
  const openedRewards = game.openedBoxIds
    .map((id) => game.boxes.find((box) => box.id === id)?.reward)
    .filter((reward): reward is number => reward !== undefined)
  const highRewardsStillLive = highRewards.filter(
    (reward) => !openedRewards.includes(reward),
  )

  return highRewardsStillLive.length / highRewards.length
}

function roundToMarketNumber(value: number) {
  if (value >= 100_000) return Math.round(value / 5_000) * 5_000
  if (value >= 10_000) return Math.round(value / 1_000) * 1_000
  if (value >= 1_000) return Math.round(value / 250) * 250
  return Math.max(1, Math.round(value / 25) * 25)
}

function shuffle<T>(items: T[], random: () => number) {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }

  return shuffled
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
