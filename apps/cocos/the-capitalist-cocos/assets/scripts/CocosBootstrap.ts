import {
  _decorator,
  Button,
  Color,
  Component,
  EditBox,
  EventHandler,
  Graphics,
  Label,
  Layers,
  Node,
  resources,
  Sprite,
  SpriteFrame,
  UITransform,
} from 'cc'
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

const { ccclass, property } = _decorator

interface VaultView {
  button: Button
  graphics: Graphics
  label: Label
}

@ccclass('CocosBootstrap')
export class CocosBootstrap extends Component {
  // These two fields preserve compatibility with the official starter scene.
  @property({ type: Label })
  stateLabel: Label | null = null

  @property({ type: Label })
  resultLabel: Label | null = null

  private game: GameState = createNewGame()
  private vaultViews: VaultView[] = []
  private stage: Label | null = null
  private ev: Label | null = null
  private offer: Label | null = null
  private quote: Label | null = null
  private settlement: Label | null = null
  private counterInput: EditBox | null = null
  private actionNode: Node | null = null

  start() {
    this.buildInterface()
    this.refresh()
  }

  onVaultClick(_event: unknown, customEventData: string) {
    const boxId = Number(customEventData)
    this.game = this.game.phase === 'selecting'
      ? selectBox(this.game, boxId)
      : openBox(this.game, boxId)
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
    const amount = Number(this.counterInput?.string ?? '')
    if (!Number.isFinite(amount) || amount <= 0) return
    this.game = makeCounterOffer(this.game, amount)
    this.refresh()
  }

  restartGame() {
    this.game = createNewGame()
    if (this.counterInput) this.counterInput.string = ''
    this.refresh()
  }

  private buildInterface() {
    for (const child of [...this.node.children]) {
      if (child.name !== 'Camera') child.destroy()
    }

    const rootTransform = this.node.getComponent(UITransform)
    rootTransform?.setContentSize(960, 640)

    this.makePanel('Background', 0, 0, 960, 640, new Color(8, 10, 10, 255), this.node)
    this.makePanel('Topbar', 0, 286, 960, 68, new Color(14, 17, 16, 255), this.node)
    this.makeText('THE CAPITALIST', -330, 292, 250, 34, 25, new Color(245, 240, 228), this.node)
    this.makeText('VIRTUAL CAP ONLY', 355, 292, 180, 25, 12, new Color(214, 173, 84), this.node)

    this.stage = this.makeText('', -212, 235, 530, 40, 25, new Color(245, 240, 228), this.node)
    this.ev = this.makeText('', -300, 204, 310, 24, 14, new Color(93, 215, 189), this.node)

    for (let index = 0; index < 20; index += 1) {
      const column = index % 5
      const row = Math.floor(index / 5)
      const x = -394 + column * 116
      const y = 135 - row * 88
      this.vaultViews.push(this.makeVault(index + 1, x, y))
    }

    this.makePanel('Desk', 318, -20, 304, 476, new Color(16, 19, 18, 255), this.node)
    const portraitNode = this.makePanel('Portrait', 245, 161, 136, 136, new Color(24, 27, 25), this.node)
    const sprite = portraitNode.addComponent(Sprite)
    sprite.sizeMode = Sprite.SizeMode.CUSTOM
    resources.load('capitalist-portrait/spriteFrame', SpriteFrame, (error, frame) => {
      if (!error && frame?.isValid) sprite.spriteFrame = frame
    })

    this.makeText('THE CAPITALIST / DESK 01', 365, 210, 180, 22, 11, new Color(214, 173, 84), this.node)
    this.offer = this.makeText('NO BID', 318, 119, 270, 44, 29, new Color(240, 210, 138), this.node, Label.HorizontalAlign.CENTER)
    this.quote = this.makeText('', 318, 56, 260, 78, 14, new Color(190, 194, 187), this.node, Label.HorizontalAlign.CENTER)
    this.settlement = this.makeText('', 318, -66, 264, 98, 17, new Color(245, 240, 228), this.node, Label.HorizontalAlign.CENTER)

    this.actionNode = new Node('Actions')
    this.actionNode.layer = Layers.Enum.UI_2D
    this.actionNode.parent = this.node
    this.makeButton('DEAL', 248, -158, 126, 42, 'deal', '', this.actionNode, new Color(214, 173, 84))
    this.makeButton('HOLD', 388, -158, 126, 42, 'hold', '', this.actionNode, new Color(25, 68, 59))
    this.counterInput = this.makeEditBox(248, -211, 126, 38, this.actionNode)
    this.makeButton('COUNTER', 388, -211, 126, 38, 'counter', '', this.actionNode, new Color(31, 35, 32))
    this.makeButton('NEW GAME', 318, -269, 266, 40, 'restartGame', '', this.node, new Color(31, 35, 32))
  }

  private makeVault(boxId: number, x: number, y: number) {
    const node = new Node(`Vault ${boxId}`)
    node.layer = Layers.Enum.UI_2D
    node.parent = this.node
    node.setPosition(x, y)
    node.addComponent(UITransform).setContentSize(106, 76)
    const graphics = node.addComponent(Graphics)
    const button = node.addComponent(Button)
    button.transition = Button.Transition.NONE
    const label = this.makeText('', 0, 0, 98, 66, 13, new Color(245, 240, 228), node, Label.HorizontalAlign.CENTER)
    const event = new EventHandler()
    event.target = this.node
    event.component = 'CocosBootstrap'
    event.handler = 'onVaultClick'
    event.customEventData = String(boxId)
    button.clickEvents.push(event)
    return { button, graphics, label }
  }

  private refresh() {
    const boxesLeft = getBoxesLeftToOpenThisRound(this.game)
    const round = Math.min(this.game.roundIndex + 1, ROUND_OPEN_COUNTS.length)
    if (this.stage) this.stage.string = this.stageText(boxesLeft, round)
    if (this.ev) this.ev.string = `MARKET EV  ${formatCap(calculateEV(this.game))}`

    if (this.offer) {
      this.offer.string = this.game.currentOffer ? formatCap(this.game.currentOffer.amount) : 'NO BID'
    }
    if (this.quote) {
      this.quote.string = this.game.lastCounter?.note ?? this.game.currentOffer?.quote ??
        'Choose one vault, then open rival positions.'
    }
    if (this.settlement) {
      this.settlement.string = this.game.settlement
        ? `${this.game.settlement.ratingEmoji}  ${this.game.settlement.grade}\nPAYOUT  ${formatCap(this.game.settlement.payout)}\nYOUR VAULT  ${formatCap(this.game.settlement.personalBoxReward)}`
        : ''
    }
    if (this.actionNode) this.actionNode.active = this.game.phase === 'offer'

    this.vaultViews.forEach((view, index) => {
      const box = this.game.boxes[index]
      const opened = this.game.openedBoxIds.includes(box.id)
      const chosen = this.game.selectedBoxId === box.id
      const revealed = opened || this.game.phase === 'ended'
      view.label.string = `${String(box.id).padStart(2, '0')}\n${revealed ? formatCap(box.reward) : chosen ? 'YOUR VAULT' : 'SEALED'}`
      view.button.interactable = this.game.phase === 'selecting' ||
        (this.game.phase === 'opening' && !opened && !chosen)
      this.drawVault(view.graphics, opened, chosen)
    })
  }

  private drawVault(graphics: Graphics, opened: boolean, chosen: boolean) {
    graphics.clear()
    graphics.fillColor = opened
      ? new Color(10, 12, 11)
      : chosen
        ? new Color(17, 38, 32)
        : new Color(24, 27, 25)
    graphics.strokeColor = chosen ? new Color(93, 215, 189) : new Color(68, 72, 67)
    graphics.lineWidth = 2
    graphics.rect(-53, -38, 106, 76)
    graphics.fill()
    graphics.stroke()
  }

  private makePanel(name: string, x: number, y: number, width: number, height: number, color: Color, parent: Node) {
    const node = new Node(name)
    node.layer = Layers.Enum.UI_2D
    node.parent = parent
    node.setPosition(x, y)
    node.addComponent(UITransform).setContentSize(width, height)
    const graphics = node.addComponent(Graphics)
    graphics.fillColor = color
    graphics.rect(-width / 2, -height / 2, width, height)
    graphics.fill()
    return node
  }

  private makeText(
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fontSize: number,
    color: Color,
    parent: Node,
    align: Label.HorizontalAlign = Label.HorizontalAlign.LEFT,
  ) {
    const node = new Node('Label')
    node.layer = Layers.Enum.UI_2D
    node.parent = parent
    node.setPosition(x, y)
    node.addComponent(UITransform).setContentSize(width, height)
    const label = node.addComponent(Label)
    label.string = text
    label.fontSize = fontSize
    label.lineHeight = Math.round(fontSize * 1.25)
    label.color = color
    label.horizontalAlign = align
    label.verticalAlign = Label.VerticalAlign.CENTER
    label.overflow = Label.Overflow.SHRINK
    return label
  }

  private makeButton(
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    handler: string,
    data: string,
    parent: Node,
    color: Color,
  ) {
    const node = this.makePanel(text, x, y, width, height, color, parent)
    const button = node.addComponent(Button)
    button.transition = Button.Transition.NONE
    this.makeText(text, 0, 0, width - 8, height - 4, 13, new Color(245, 240, 228), node, Label.HorizontalAlign.CENTER)
    const event = new EventHandler()
    event.target = this.node
    event.component = 'CocosBootstrap'
    event.handler = handler
    event.customEventData = data
    button.clickEvents.push(event)
    return button
  }

  private makeEditBox(x: number, y: number, width: number, height: number, parent: Node) {
    const node = this.makePanel('Counter Input', x, y, width, height, new Color(8, 10, 10), parent)
    const editBox = node.addComponent(EditBox)
    const textLabel = this.makeText('', 0, 0, width - 12, height - 4, 13, new Color(245, 240, 228), node)
    const placeholder = this.makeText('CAP amount', 0, 0, width - 12, height - 4, 12, new Color(115, 120, 114), node)
    editBox.textLabel = textLabel
    editBox.placeholderLabel = placeholder
    editBox.inputMode = EditBox.InputMode.DECIMAL
    return editBox
  }

  private stageText(boxesLeft: number, round: number) {
    if (this.game.phase === 'selecting') return 'CHOOSE YOUR PRIVATE VAULT'
    if (this.game.phase === 'opening') return `ROUND ${round} / OPEN ${boxesLeft}`
    if (this.game.phase === 'offer') return 'THE DESK IS PRICING YOUR POSITION'
    return 'THE MARKET HAS CLOSED'
  }
}
