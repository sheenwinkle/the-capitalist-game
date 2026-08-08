import { useMemo, useState } from 'react'
import {
  BriefcaseBusiness,
  Check,
  ChevronRight,
  LockKeyhole,
  RotateCcw,
  Shield,
  TrendingUp,
  UnlockKeyhole,
  Volume2,
  VolumeX,
} from 'lucide-react'
import './App.css'
import capitalistPortrait from './assets/capitalist-portrait.jpg'
import { useGameAudio } from './useGameAudio'
import {
  acceptCurrentOffer,
  calculateEV,
  createNewGame,
  formatCap,
  getBoxesLeftToOpenThisRound,
  getRewardTier,
  holdOffer,
  makeCounterOffer,
  openBox,
  ROUND_OPEN_COUNTS,
  selectBox,
} from '@the-capitalist/core'
import type { BoxStatus, GameState, PrizeBox } from '@the-capitalist/core'

function App() {
  const [game, setGame] = useState<GameState>(() => createNewGame())
  const [counterAsk, setCounterAsk] = useState('')
  const [counterError, setCounterError] = useState('')
  const [lastRevealId, setLastRevealId] = useState<number | null>(null)
  const { muted, play, setMuted } = useGameAudio()
  const ev = useMemo(() => calculateEV(game), [game])
  const boxesLeftThisRound = getBoxesLeftToOpenThisRound(game)
  const roundNumber = Math.min(game.roundIndex + 1, ROUND_OPEN_COUNTS.length)
  const totalToOpen = ROUND_OPEN_COUNTS.reduce((sum, count) => sum + count, 0)
  const progress = (game.openedBoxIds.length / totalToOpen) * 100
  const lastReveal = game.boxes.find((box) => box.id === lastRevealId)

  function restart() {
    setGame(createNewGame())
    setCounterAsk('')
    setCounterError('')
    setLastRevealId(null)
    play('select')
  }

  function chooseBox(boxId: number) {
    setGame((current) => selectBox(current, boxId))
    play('select')
  }

  function revealBox(boxId: number) {
    setGame((current) => {
      const next = openBox(current, boxId)
      if (next !== current) {
        setLastRevealId(boxId)
        play(next.phase === 'offer' ? 'offer' : 'open')
      }
      return next
    })
  }

  function deal() {
    setGame((current) => acceptCurrentOffer(current))
    setCounterAsk('')
    play('deal')
  }

  function hold() {
    setGame((current) => holdOffer(current))
    setCounterAsk('')
    setCounterError('')
    setLastRevealId(null)
    play('hold')
  }

  function submitCounter() {
    const amount = Number(counterAsk)

    if (!Number.isFinite(amount) || amount <= 0) {
      setCounterError('Enter a valid CAP amount.')
      return
    }

    setGame((current) => {
      const next = makeCounterOffer(current, amount)
      if (next.phase === 'ended') play('deal')
      else if (next.lastCounter?.kind === 'rejected') play('reject')
      else play('offer')
      return next
    })
    setCounterError('')
  }

  function seedCounter() {
    if (!game.currentOffer) return

    const suggestedAsk =
      game.currentOffer.amount + (game.currentOffer.ev - game.currentOffer.amount) * 0.55
    setCounterAsk(String(Math.max(1, Math.round(suggestedAsk))))
    setCounterError('')
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#game" aria-label="THE CAPITALIST">
          <img src="/capitalist-mark.svg" alt="" />
          <span>
            <strong>THE CAPITALIST</strong>
            <small>RISK. PRICE. DECISION.</small>
          </span>
        </a>

        <div className="topbar-actions">
          <span className="virtual-only">VIRTUAL CAP ONLY</span>
          <button
            className="icon-button"
            type="button"
            onClick={() => setMuted(!muted)}
            aria-label={muted ? 'Turn sound on' : 'Mute sound'}
            title={muted ? 'Turn sound on' : 'Mute sound'}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={restart}
            aria-label="New game"
            title="New game"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      <section className="market-strip" aria-label="Game status">
        <div>
          <span>MARKET EV</span>
          <strong>{formatCap(ev)}</strong>
        </div>
        <div>
          <span>ROUND</span>
          <strong>{roundNumber} / {ROUND_OPEN_COUNTS.length}</strong>
        </div>
        <div>
          <span>LIVE VAULTS</span>
          <strong>{game.boxes.length - game.openedBoxIds.length}</strong>
        </div>
        <div>
          <span>PRIVATE VAULT</span>
          <strong>{game.selectedBoxId ? `#${String(game.selectedBoxId).padStart(2, '0')}` : 'UNSET'}</strong>
        </div>
      </section>

      <div className="round-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <section className="game-layout" id="game">
        <section className="board-area" aria-labelledby="board-title">
          <div className="section-heading">
            <div>
              <p className="section-kicker">VAULT FLOOR / 20 POSITIONS</p>
              <h1 id="board-title">{getStageTitle(game, boxesLeftThisRound)}</h1>
            </div>
            <div className={`phase-badge phase-${game.phase}`}>
              <span />
              {getPhaseLabel(game, boxesLeftThisRound)}
            </div>
          </div>

          {lastReveal && game.phase !== 'ended' ? (
            <div className={`reveal-tape tier-${getRewardTier(lastReveal.reward)}`}>
              <span>VAULT {String(lastReveal.id).padStart(2, '0')} REMOVED</span>
              <strong>{formatCap(lastReveal.reward)}</strong>
            </div>
          ) : null}

          <div className="vault-grid">
            {game.boxes.map((box) => (
              <VaultButton
                key={box.id}
                box={box}
                status={getBoxStatus(game, box.id)}
                phase={game.phase}
                onSelect={chooseBox}
                onOpen={revealBox}
              />
            ))}
          </div>

          <OfferHistory game={game} />
        </section>

        <aside className="desk-column" aria-label="Capitalist desk">
          <CapitalistPanel
            game={game}
            counterAsk={counterAsk}
            counterError={counterError}
            onCounterAskChange={(value) => {
              setCounterAsk(value)
              setCounterError('')
            }}
            onDeal={deal}
            onHold={hold}
            onCounter={submitCounter}
            onSeedCounter={seedCounter}
            onRestart={restart}
          />
          <PrizeLedger game={game} />
        </aside>
      </section>

      <footer>
        <span>THE CAPITALIST MVP</span>
        <span>Probability decision game. No real money, cash-out, or tradable rewards.</span>
      </footer>
    </main>
  )
}

interface CapitalistPanelProps {
  game: GameState
  counterAsk: string
  counterError: string
  onCounterAskChange: (value: string) => void
  onDeal: () => void
  onHold: () => void
  onCounter: () => void
  onSeedCounter: () => void
  onRestart: () => void
}

function CapitalistPanel({
  game,
  counterAsk,
  counterError,
  onCounterAskChange,
  onDeal,
  onHold,
  onCounter,
  onSeedCounter,
  onRestart,
}: CapitalistPanelProps) {
  return (
    <section className={`capitalist-card ${game.phase === 'offer' ? 'is-offer' : ''}`}>
      <div className="capitalist-header">
        <img src={capitalistPortrait} alt="The Capitalist" />
        <div>
          <p className="section-kicker">THE CAPITALIST / DESK 01</p>
          <strong>{game.phase === 'offer' ? 'LIVE NEGOTIATION' : 'RISK DESK'}</strong>
          <span className="desk-status"><i /> ONLINE</span>
        </div>
      </div>

      {game.phase === 'ended' && game.settlement ? (
        <SettlementPanel game={game} onRestart={onRestart} />
      ) : game.phase === 'offer' && game.currentOffer ? (
        <div className="offer-body">
          <p className="offer-label">FINAL BID / ROUND {game.currentOffer.round}</p>
          <div className="offer-amount">{formatCap(game.currentOffer.amount)}</div>
          <div className="offer-metrics">
            <span><small>EV</small>{formatCap(game.currentOffer.ev)}</span>
            <span><small>BID / EV</small>{Math.round(game.currentOffer.multiplier * 100)}%</span>
          </div>
          <blockquote>“{game.currentOffer.quote}”</blockquote>

          {game.lastCounter ? (
            <div className={`counter-note ${game.lastCounter.kind}`}>
              {game.lastCounter.note}
            </div>
          ) : null}

          <div className="primary-actions">
            <button className="deal-button" type="button" onClick={onDeal}>
              <Check size={18} /> DEAL
            </button>
            <button className="hold-button" type="button" onClick={onHold}>
              <Shield size={18} /> HOLD
            </button>
          </div>

          <div className="counter-box">
            <label htmlFor="counter-offer">YOUR COUNTER OFFER</label>
            <div className="counter-input-row">
              <input
                id="counter-offer"
                min="1"
                inputMode="numeric"
                type="number"
                value={counterAsk}
                onChange={(event) => onCounterAskChange(event.target.value)}
                placeholder="CAP amount"
                aria-describedby={counterError ? 'counter-error' : undefined}
              />
              <button type="button" onClick={onSeedCounter} title="Use a suggested mark">
                MARK
              </button>
              <button className="counter-button" type="button" onClick={onCounter}>
                <TrendingUp size={17} /> COUNTER
              </button>
            </div>
            {counterError ? <span className="input-error" id="counter-error">{counterError}</span> : null}
          </div>
        </div>
      ) : (
        <div className="desk-message">
          <span className="message-index">0{game.phase === 'selecting' ? '1' : '2'}</span>
          <h2>{game.phase === 'selecting' ? 'Choose the one vault you own.' : 'Open rival vaults. Reprice the risk.'}</h2>
          <p>
            {game.phase === 'selecting'
              ? 'Your choice stays sealed while the other rewards leave the market.'
              : 'Complete the round and the desk will make a fresh offer based on remaining EV.'}
          </p>
          <div className="next-step">
            <ChevronRight size={18} />
            {game.phase === 'selecting' ? 'Tap any sealed vault' : 'Tap a rival vault to reveal it'}
          </div>
        </div>
      )}
    </section>
  )
}

function SettlementPanel({ game, onRestart }: { game: GameState; onRestart: () => void }) {
  const settlement = game.settlement
  if (!settlement) return null
  const edge = settlement.payout - settlement.personalBoxReward

  return (
    <div className="settlement-body">
      <div className="rating-emoji" aria-hidden="true">{settlement.ratingEmoji}</div>
      <p className="offer-label">TRADE SETTLED</p>
      <h2>{settlement.grade}</h2>
      <p className="settlement-note">{settlement.note}</p>
      <div className="settlement-grid">
        <span><small>PAYOUT</small>{formatCap(settlement.payout)}</span>
        <span><small>YOUR VAULT</small>{formatCap(settlement.personalBoxReward)}</span>
        <span className={edge >= 0 ? 'positive' : 'negative'}>
          <small>DECISION EDGE</small>{edge >= 0 ? '+' : ''}{formatCap(edge)}
        </span>
      </div>
      <button className="new-game-button" type="button" onClick={onRestart}>
        <RotateCcw size={18} /> NEW GAME
      </button>
    </div>
  )
}

interface VaultButtonProps {
  box: PrizeBox
  status: BoxStatus
  phase: GameState['phase']
  onSelect: (boxId: number) => void
  onOpen: (boxId: number) => void
}

function VaultButton({ box, status, phase, onSelect, onOpen }: VaultButtonProps) {
  const isRevealed = status === 'opened' || phase === 'ended'
  const isDisabled =
    phase === 'ended' || status === 'opened' || phase === 'offer' ||
    (phase === 'opening' && status === 'chosen')

  function handleClick() {
    if (phase === 'selecting') onSelect(box.id)
    else if (phase === 'opening') onOpen(box.id)
  }

  return (
    <button
      className={`vault ${status} ${isRevealed ? `tier-${getRewardTier(box.reward)}` : ''}`}
      type="button"
      disabled={isDisabled}
      onClick={handleClick}
      aria-label={`Vault ${box.id}${status === 'chosen' ? ', your private vault' : ''}`}
    >
      <span className="vault-topline">
        <b>{String(box.id).padStart(2, '0')}</b>
        {isRevealed ? <UnlockKeyhole size={15} /> : <LockKeyhole size={15} />}
      </span>
      <BriefcaseBusiness className="vault-icon" size={25} strokeWidth={1.6} />
      <span className="vault-value">
        {isRevealed ? formatCap(box.reward) : status === 'chosen' ? 'YOUR VAULT' : 'SEALED'}
      </span>
    </button>
  )
}

function PrizeLedger({ game }: { game: GameState }) {
  const openedRewards = new Set(
    game.openedBoxIds
      .map((id) => game.boxes.find((box) => box.id === id)?.reward)
      .filter((reward): reward is number => reward !== undefined),
  )
  const rewards = [...game.boxes].sort((a, b) => b.reward - a.reward)

  return (
    <section className="ledger">
      <div className="ledger-heading">
        <div>
          <p className="section-kicker">REWARD LADDER</p>
          <h2>LIVE CAPITAL</h2>
        </div>
        <span>{rewards.length - openedRewards.size} LEFT</span>
      </div>
      <div className="reward-list">
        {rewards.map((box) => {
          const removed = openedRewards.has(box.reward)
          const owned = game.selectedBoxId === box.id && game.phase !== 'ended'

          return (
            <span
              className={`reward-pill tier-${getRewardTier(box.reward)} ${removed ? 'removed' : ''} ${owned ? 'owned' : ''}`}
              key={box.reward}
            >
              {formatCap(box.reward).replace(' CAP', '')}
            </span>
          )
        })}
      </div>
    </section>
  )
}

function OfferHistory({ game }: { game: GameState }) {
  if (game.offerHistory.length === 0) return null

  return (
    <section className="offer-history" aria-label="Offer history">
      <span>OFFER TAPE</span>
      {game.offerHistory.map((offer, index) => (
        <div key={`${offer.round}-${index}`}>
          <small>R{offer.round}</small>
          <strong>{formatCap(offer.amount)}</strong>
        </div>
      ))}
    </section>
  )
}

function getBoxStatus(game: GameState, boxId: number): BoxStatus {
  if (game.openedBoxIds.includes(boxId)) return 'opened'
  if (game.selectedBoxId === boxId) return 'chosen'
  return 'available'
}

function getStageTitle(game: GameState, boxesLeftThisRound: number) {
  if (game.phase === 'selecting') return 'Choose your private vault.'
  if (game.phase === 'opening') return `Open ${boxesLeftThisRound} rival vault${boxesLeftThisRound === 1 ? '' : 's'}.`
  if (game.phase === 'offer') return 'The desk is pricing your position.'
  return 'The market has closed.'
}

function getPhaseLabel(game: GameState, boxesLeft: number) {
  if (game.phase === 'selecting') return 'SELECT 1'
  if (game.phase === 'opening') return `${boxesLeft} TO OPEN`
  if (game.phase === 'offer') return 'DECISION LIVE'
  return 'SETTLED'
}

export default App
