import { _decorator, Button, Component, Label } from 'cc'

const { ccclass, property } = _decorator

@ccclass('VaultButton')
export class VaultButton extends Component {
  @property({ type: Label })
  numberLabel: Label | null = null

  @property({ type: Label })
  valueLabel: Label | null = null

  @property({ type: Button })
  button: Button | null = null

  boxId = 0

  bind(boxId: number, label: string, interactable: boolean) {
    this.boxId = boxId

    if (this.numberLabel) {
      this.numberLabel.string = String(boxId).padStart(2, '0')
    }

    if (this.valueLabel) {
      this.valueLabel.string = label
    }

    if (this.button) {
      this.button.interactable = interactable
    }
  }
}
