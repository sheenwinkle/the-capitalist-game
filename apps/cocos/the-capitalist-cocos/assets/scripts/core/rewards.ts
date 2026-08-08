export const REWARD_LADDER = [
  1, 5, 10, 25, 50, 100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000,
  50_000, 75_000, 100_000, 250_000, 500_000, 750_000, 1_000_000,
]

export const ROUND_OPEN_COUNTS = [5, 4, 3, 3, 2, 1]

export function formatCap(value: number) {
  return `${Math.round(value).toLocaleString('en-US')} CAP`
}

export function getRewardTier(value: number) {
  const ordered = [...REWARD_LADDER].sort((a, b) => a - b)
  const index = ordered.findIndex((reward) => reward === value)

  if (index >= 16) {
    return 'platinum'
  }

  if (index >= 11) {
    return 'gold'
  }

  if (index >= 6) {
    return 'silver'
  }

  return 'paper'
}
