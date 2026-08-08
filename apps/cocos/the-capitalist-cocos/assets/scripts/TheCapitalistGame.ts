import { _decorator, Button, Component, EditBox, EventHandler, Label } from 'cc'
import {
  acceptCurrentOffer,
  calculateEV,
  createNewGame,
  formatCap,
  getBoxesLeftToOpenThisRound,
  holdOffer,
  makeCounterOffer,
  openBox,
  ROUND_OPEN_COUNTS,
  selectBox,
  type GameState,
} from './core'
import { VaultButton } from './VaultButton'

const { ccclass, property } = _decorator

@ccclass('TheCapitalistGame')
export class TheCapitalistGame extends Component {
  @property({ type: [VaultButton] })
  vaultButtons: VaultButton[] = []

  @property({ type: Label })
  stageLabel: Label | null = null

  @property({ type: Label })
  evLabel: Label | null = null

  @property({ type: Label })
  offerLabel: Label | null = null

  @property({ type: Label })
  quoteLabel: Label | null = null

  @property({ type: Label })
  settlementLabel: Label | null = null

  @property({ type: EditBox })
  counterInput: EditBox | null = null

  @property({ type: Button })
  dealButton: Button | null = null

  @property({ type: Button })
  counterButton: Button | null = null

  @property({ type: Button })
  holdButton: Button | null = null

  private game: GameState = createNewGame()

  start() {
    this.bindButtons()
    this.refresh()
  }

  restartGame() {
    this.game = createNewGame()
    if (this.counterInput) {
      this.counterInput.string = ''
    }
    this.refresh()
  }

  deal() {
    this.game = acceptCurrentOffer(this.game)
    this.refresh()
  }

  hold() {
    this.game = holdOffer(this.game)
    this.refresh()
  }

  counter() {
    const ask = Number(this.counterInput?.string ?? '')
    if (!Number.isFinite(ask) || ask <= 0) {
      return
    }

    this.game = makeCounterOffer(this.game, ask)
    this.refresh()
  }

  private bindButtons() {
    this.vaultButtons.forEach((vaultButton, index) => {
      const boxId = index + 1
      const clickEventHandler = new EventHandler()
      clickEventHandler.target = this.node
      clickEventHandler.component = 'TheCapitalistGame'
      clickEventHandler.handler = 'onVaultClicked'
      clickEventHandler.customEventData = String(boxId)
      vaultButton.button?.clickEvents.splice(0)
      vaultButton.button?.clickEvents.push(clickEventHandler)
    })
  }

  onVaultClicked(_event: unknown, customEventData: string) {
    const boxId = Number(customEventData)

    if (this.game.phase === 'selecting') {
      this.game = selectBox(this.game, boxId)
    } else if (this.game.phase === 'opening') {
      this.game = openBox(this.game, boxId)
    }

    this.refresh()
  }

  private refresh() {
    this.refreshLabels()
    this.refreshVaults()
    this.refreshActionButtons()
  }

  private refreshLabels() {
    const ev = calculateEV(this.game)
    const boxesLeft = getBoxesLeftToOpenThisRound(this.game)
    const round = Math.min(this.game.roundIndex + 1, ROUND_OPEN_COUNTS.length)

    if (this.stageLabel) {
      this.stageLabel.string = this.getStageText(boxesLeft, round)
    }

    if (this.evLabel) {
      this.evLabel.string = `EV ${formatCap(ev)}`
    }

    if (this.offerLabel) {
      this.offerLabel.string = this.game.currentOffer
        ? formatCap(this.game.currentOffer.amount)
        : 'NO BID'
    }

    if (this.quoteLabel) {
      this.quoteLabel.string =
        this.game.lastCounter?.note ??
        this.game.currentOffer?.quote ??
        'Pick a vault, open rivals, then negotiate.'
    }

    if (this.settlementLabel) {
      this.settlementLabel.string = this.game.settlement
        ? `${this.game.settlement.ratingEmoji} ${this.game.settlement.grade}\nPayout ${formatCap(this.game.settlement.payout)}`
        : ''
    }
  }

  private refreshVaults() {
    this.vaultButtons.forEach((vaultButton, index) => {
      const box = this.game.boxes[index]
      if (!box) {
        return
      }

      const opened = this.game.openedBoxIds.includes(box.id)
      const chosen = this.game.selectedBoxId === box.id
      const label =
        opened || this.game.phase === 'ended'
          ? formatCap(box.reward)
          : chosen
            ? 'YOUR VAULT'
            : 'SEALED'
      const interactable =
        this.game.phase === 'selecting' ||
        (this.game.phase === 'opening' && !opened && !chosen)

      vaultButton.bind(box.id, label, interactable)
    })
  }

  private refreshActionButtons() {
    const canNegotiate = this.game.phase === 'offer'

    if (this.dealButton) {
      this.dealButton.interactable = canNegotiate
    }

    if (this.counterButton) {
      this.counterButton.interactable = canNegotiate
    }

    if (this.holdButton) {
      this.holdButton.interactable = canNegotiate
    }
  }

  private getStageText(boxesLeft: number, round: number) {
    if (this.game.phase === 'selecting') {
      return 'SELECT YOUR PRIVATE VAULT'
    }

    if (this.game.phase === 'opening') {
      return `ROUND ${round}: OPEN ${boxesLeft}`
    }

    if (this.game.phase === 'offer') {
      return 'THE CAPITALIST IS BIDDING'
    }

    return 'SETTLED'
  }
}
