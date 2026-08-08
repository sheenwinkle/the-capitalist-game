import type { TheCapitalistPorts } from './ports'

export const localOnlyPorts: TheCapitalistPorts = {
  account: {
    async getAnonymousPlayerId() {
      return 'local-player'
    },
    async linkExternalAccount() {
      return undefined
    },
  },
  shareCards: {
    async createShareCard() {
      return 'local-share-card-placeholder'
    },
  },
  skins: {
    async getActiveTheme() {
      return 'black-gold'
    },
    async equipSkin() {
      return undefined
    },
  },
  wallet: {
    async getVirtualBalance() {
      return 0
    },
    async creditVirtualBalance() {
      return undefined
    },
  },
}
