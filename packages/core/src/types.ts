export type GamePhase = 'selecting' | 'opening' | 'offer' | 'ended'

export type BoxStatus = 'available' | 'chosen' | 'opened'

export type EndReason = 'deal' | 'counterAccepted' | 'heldToReveal'

export interface PrizeBox {
  id: number
  reward: number
}

export interface CapitalistOffer {
  round: number
  amount: number
  ev: number
  multiplier: number
  pressure: 'low' | 'measured' | 'sharp' | 'hostile'
  quote: string
}

export interface CounterResolution {
  kind: 'accepted' | 'countered' | 'rejected'
  playerAsk: number
  capitalistAmount?: number
  note: string
}

export interface Settlement {
  endReason: EndReason
  payout: number
  personalBoxReward: number
  ratingEmoji: '🤡' | '🗿'
  grade: string
  note: string
}

export interface GameState {
  boxes: PrizeBox[]
  selectedBoxId: number | null
  openedBoxIds: number[]
  phase: GamePhase
  roundIndex: number
  currentOffer: CapitalistOffer | null
  offerHistory: CapitalistOffer[]
  lastCounter: CounterResolution | null
  settlement: Settlement | null
}
