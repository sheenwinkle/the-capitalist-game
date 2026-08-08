import { describe, expect, it } from 'vitest'
import {
  acceptCurrentOffer,
  calculateEV,
  createNewGame,
  getBoxesLeftToOpenThisRound,
  holdOffer,
  makeCounterOffer,
  openBox,
  REWARD_LADDER,
  ROUND_OPEN_COUNTS,
  selectBox,
} from './index'

function openCurrentRound(game: ReturnType<typeof createNewGame>) {
  let next = game
  const count = getBoxesLeftToOpenThisRound(next)
  const targets = next.boxes
    .filter((box) => box.id !== next.selectedBoxId && !next.openedBoxIds.includes(box.id))
    .slice(0, count)

  for (const target of targets) {
    next = openBox(next, target.id)
  }

  return next
}

describe('THE CAPITALIST engine', () => {
  it('creates 20 unique boxes from the configured reward ladder', () => {
    const game = createNewGame(() => 0.42)

    expect(game.boxes).toHaveLength(20)
    expect(game.boxes.map((box) => box.reward).sort((a, b) => a - b)).toEqual(
      [...REWARD_LADDER].sort((a, b) => a - b),
    )
    expect(new Set(game.boxes.map((box) => box.id)).size).toBe(20)
  })

  it('protects the selected box and produces an offer after round one', () => {
    let game = selectBox(createNewGame(() => 0.31), 3)
    const selectedReward = game.boxes.find((box) => box.id === 3)?.reward

    game = openBox(game, 3)
    expect(game.openedBoxIds).toHaveLength(0)

    game = openCurrentRound(game)
    expect(game.phase).toBe('offer')
    expect(game.openedBoxIds).toHaveLength(ROUND_OPEN_COUNTS[0])
    expect(game.currentOffer?.amount).toBeGreaterThan(0)
    expect(game.offerHistory).toHaveLength(1)
    expect(game.boxes.find((box) => box.id === 3)?.reward).toBe(selectedReward)
  })

  it('calculates EV from every unopened box', () => {
    let game = selectBox(createNewGame(() => 0), 1)
    game = openBox(game, 2)

    const remaining = game.boxes.filter((box) => box.id !== 2)
    const expected = remaining.reduce((sum, box) => sum + box.reward, 0) / remaining.length
    expect(calculateEV(game)).toBe(expected)
  })

  it('supports deal, counter, and hold paths', () => {
    const offered = openCurrentRound(selectBox(createNewGame(() => 0.71), 1))
    const dealt = acceptCurrentOffer(offered)
    expect(dealt.phase).toBe('ended')
    expect(dealt.settlement?.endReason).toBe('deal')

    const acceptedCounter = makeCounterOffer(offered, offered.currentOffer!.amount)
    expect(acceptedCounter.phase).toBe('ended')
    expect(acceptedCounter.settlement?.endReason).toBe('counterAccepted')

    const held = holdOffer(offered)
    expect(held.phase).toBe('opening')
    expect(held.roundIndex).toBe(1)
  })

  it('reveals the private box after holding through every round', () => {
    let game = selectBox(createNewGame(() => 0.18), 20)

    for (let round = 0; round < ROUND_OPEN_COUNTS.length; round += 1) {
      game = openCurrentRound(game)
      expect(game.phase).toBe('offer')
      game = holdOffer(game)
    }

    const privateReward = game.boxes.find((box) => box.id === 20)?.reward
    expect(game.phase).toBe('ended')
    expect(game.settlement?.endReason).toBe('heldToReveal')
    expect(game.settlement?.payout).toBe(privateReward)
  })

  it('ignores unknown box ids instead of mutating the state', () => {
    const game = createNewGame(() => 0.5)
    expect(selectBox(game, 99)).toBe(game)

    const selected = selectBox(game, 1)
    expect(openBox(selected, 99)).toBe(selected)
  })
})
