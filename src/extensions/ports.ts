import type { Settlement } from '@the-capitalist/core'

export interface ShareCardPayload {
  gameId: string
  payout: number
  personalBoxReward: number
  ratingEmoji: Settlement['ratingEmoji']
  grade: string
}

export interface ShareCardPort {
  createShareCard(payload: ShareCardPayload): Promise<string>
}

export interface AccountPort {
  getAnonymousPlayerId(): Promise<string>
  linkExternalAccount(provider: 'wechat' | 'kakao' | 'line'): Promise<void>
}

export interface SkinPort {
  getActiveTheme(): Promise<'black-gold' | string>
  equipSkin(skinId: string): Promise<void>
}

export interface WalletPort {
  getVirtualBalance(playerId: string): Promise<number>
  creditVirtualBalance(playerId: string, amount: number): Promise<void>
}

export interface TheCapitalistPorts {
  account: AccountPort
  shareCards: ShareCardPort
  skins: SkinPort
  wallet: WalletPort
}
