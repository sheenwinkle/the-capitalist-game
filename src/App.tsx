import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Crown,
  Landmark,
  PhoneCall,
  RotateCcw,
  Shield,
  Sparkles,
  TrendingUp,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react'
import './App.css'
import capitalistPortrait from './assets/capitalist-portrait.jpg'
import showStage from './assets/show-stage.jpg'
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

type ShowView = 'lobby' | 'stage' | 'offer' | 'settlement'

interface RevealState {
  boxId: number
  reward: number
}

interface StageBannerState {
  kicker: string
  title: string
  detail: string
}

function App() {
  const [game, setGame] = useState<GameState>(() => createNewGame())
  const [view, setView] = useState<ShowView>('lobby')
  const [reveal, setReveal] = useState<RevealState | null>(null)
  const [counterAsk, setCounterAsk] = useState('')
  const [counterError, setCounterError] = useState('')
  const [offerReady, setOfferReady] = useState(false)
  const [stageBanner, setStageBanner] = useState<StageBannerState | null>(null)
  const revealTimer = useRef<number | null>(null)
  const offerTimer = useRef<number | null>(null)
  const bannerTimer = useRef<number | null>(null)
  const { muted, play, setMuted } = useGameAudio()
  const ev = useMemo(() => calculateEV(game), [game])
  const boxesLeft = getBoxesLeftToOpenThisRound(game)
  const round = Math.min(game.roundIndex + 1, ROUND_OPEN_COUNTS.length)

  useEffect(() => {
    return () => {
      if (revealTimer.current) window.clearTimeout(revealTimer.current)
      if (offerTimer.current) window.clearTimeout(offerTimer.current)
      if (bannerTimer.current) window.clearTimeout(bannerTimer.current)
    }
  }, [])

  function showStageBanner(banner: StageBannerState) {
    if (bannerTimer.current) window.clearTimeout(bannerTimer.current)
    setStageBanner(banner)
    bannerTimer.current = window.setTimeout(() => setStageBanner(null), 1250)
  }

  function startShow() {
    setGame(createNewGame())
    setCounterAsk('')
    setCounterError('')
    setReveal(null)
    setOfferReady(false)
    setView('stage')
    showStageBanner({
      kicker: 'OPENING DECISION',
      title: 'CHOOSE YOUR CASE',
      detail: 'ONE CASE STAYS WITH YOU UNTIL THE FINAL DECISION',
    })
    play('intro')
  }

  function restartToLobby() {
    if (revealTimer.current) window.clearTimeout(revealTimer.current)
    if (offerTimer.current) window.clearTimeout(offerTimer.current)
    if (bannerTimer.current) window.clearTimeout(bannerTimer.current)
    setGame(createNewGame())
    setCounterAsk('')
    setCounterError('')
    setReveal(null)
    setOfferReady(false)
    setStageBanner(null)
    setView('lobby')
  }

  function chooseBox(boxId: number) {
    const next = selectBox(game, boxId)
    if (next === game) return
    setGame(next)
    play('select')
  }

  function revealBox(boxId: number) {
    if (reveal) return
    const box = game.boxes.find((candidate) => candidate.id === boxId)
    const next = openBox(game, boxId)
    if (!box || next === game) return

    setGame(next)
    setReveal({ boxId, reward: box.reward })
    play('reveal')
    revealTimer.current = window.setTimeout(() => {
      setReveal(null)
      if (next.phase === 'offer') {
        setOfferReady(false)
        setView('offer')
        play('ring')
        if (offerTimer.current) window.clearTimeout(offerTimer.current)
        offerTimer.current = window.setTimeout(() => {
          setOfferReady(true)
          play('counter')
        }, 1650)
      }
    }, 1450)
  }

  function deal() {
    if (!offerReady) return
    const next = acceptCurrentOffer(game)
    setGame(next)
    setCounterAsk('')
    setView('settlement')
    play(next.settlement?.ratingEmoji === '🗿' ? 'win' : 'deal')
  }

  function hold() {
    if (!offerReady) return
    const next = holdOffer(game)
    setGame(next)
    setCounterAsk('')
    setCounterError('')
    if (next.phase === 'ended') {
      setView('settlement')
      play(next.settlement?.ratingEmoji === '🗿' ? 'win' : 'lose')
    } else {
      setOfferReady(false)
      setView('stage')
      showStageBanner({
        kicker: `ROUND ${next.roundIndex + 1}`,
        title: `OPEN ${getBoxesLeftToOpenThisRound(next)} CASES`,
        detail: 'EVERY REVEAL CHANGES THE BANK OFFER',
      })
      play('hold')
    }
  }

  function submitCounter() {
    if (!offerReady) return
    const amount = Number(counterAsk)
    if (!Number.isFinite(amount) || amount <= 0) {
      setCounterError('Enter a valid CAP amount.')
      return
    }

    const next = makeCounterOffer(game, amount)
    setGame(next)
    setCounterError('')
    if (next.phase === 'ended') {
      setView('settlement')
      play(next.settlement?.ratingEmoji === '🗿' ? 'win' : 'deal')
    } else if (next.lastCounter?.kind === 'rejected') {
      play('reject')
    } else {
      play('counter')
    }
  }

  function seedCounter() {
    if (!offerReady) return
    if (!game.currentOffer) return
    const ask = game.currentOffer.amount +
      (game.currentOffer.ev - game.currentOffer.amount) * 0.55
    setCounterAsk(String(Math.max(1, Math.round(ask))))
    setCounterError('')
    play('select')
  }

  if (view === 'lobby') {
    return (
      <Lobby
        muted={muted}
        onToggleSound={() => setMuted(!muted)}
        onStart={startShow}
      />
    )
  }

  return (
    <main className={`show-app view-${view}`}>
      <ShowChrome
        game={game}
        ev={ev}
        round={round}
        muted={muted}
        onToggleSound={() => setMuted(!muted)}
        onExit={restartToLobby}
      />

      <div className="scene-transition" key={view}>
        {view === 'stage' ? (
          <StageScene
            game={game}
            boxesLeft={boxesLeft}
            revealLocked={reveal !== null}
            onChoose={chooseBox}
            onReveal={revealBox}
          />
        ) : null}

        {view === 'offer' ? (
          <OfferScene
            game={game}
            ready={offerReady}
            counterAsk={counterAsk}
            counterError={counterError}
            onCounterAskChange={(value) => {
              setCounterAsk(value)
              setCounterError('')
            }}
            onDeal={deal}
            onHold={hold}
            onCounter={submitCounter}
            onMark={seedCounter}
          />
        ) : null}

        {view === 'settlement' ? (
          <SettlementScene game={game} onRestart={startShow} />
        ) : null}
      </div>

      {reveal ? <RevealOverlay reveal={reveal} /> : null}
      {stageBanner ? <StageBannerOverlay banner={stageBanner} /> : null}
    </main>
  )
}

function Lobby({
  muted,
  onToggleSound,
  onStart,
}: {
  muted: boolean
  onToggleSound: () => void
  onStart: () => void
}) {
  return (
    <main className="lobby-screen">
      <img className="lobby-backdrop" src={showStage} alt="The Capitalist game show stage" />
      <div className="lobby-shade" />
      <div className="marquee-wall" aria-hidden="true" />
      <div className="audience-silhouette" aria-hidden="true" />
      <button
        className="lobby-sound icon-button"
        type="button"
        onClick={onToggleSound}
        aria-label={muted ? 'Turn sound on' : 'Mute sound'}
      >
        {muted ? <VolumeX size={21} /> : <Volume2 size={21} />}
      </button>

      <section className="lobby-copy">
        <p>WELCOME TO</p>
        <div className="show-logo-lockup">
          <img className="lobby-mark" src="/capitalist-mark.svg" alt="" />
          <h1><span>THE</span> CAPITALIST</h1>
          <b>THE ULTIMATE NEGOTIATION SHOW</b>
        </div>
        <span>Twenty cases. One personal case. Every decision has a price.</span>
        <button className="enter-show" type="button" onClick={onStart}>
          <Sparkles size={20} /> TAP TO PLAY <ChevronRight size={20} />
        </button>
        <small>VIRTUAL CAP ONLY / NO CASH-OUT / NO TRADABLE REWARDS</small>
      </section>
    </main>
  )
}

function ShowChrome({
  game,
  ev,
  round,
  muted,
  onToggleSound,
  onExit,
}: {
  game: GameState
  ev: number
  round: number
  muted: boolean
  onToggleSound: () => void
  onExit: () => void
}) {
  return (
    <header className="show-chrome">
      <div className="chrome-brand">
        <img src="/capitalist-mark.svg" alt="" />
        <strong>THE CAPITALIST</strong>
      </div>
      <div className="chrome-stats">
        <span><small>ROUND</small>{round}/{ROUND_OPEN_COUNTS.length}</span>
        <span><small>MARKET EV</small>{formatCap(ev)}</span>
        <span><small>LIVE</small>{game.boxes.length - game.openedBoxIds.length}</span>
      </div>
      <div className="chrome-actions">
        <button className="icon-button" type="button" onClick={onToggleSound} aria-label={muted ? 'Turn sound on' : 'Mute sound'}>
          {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
        </button>
        <button className="icon-button" type="button" onClick={onExit} aria-label="Exit show">
          <RotateCcw size={19} />
        </button>
      </div>
    </header>
  )
}

function StageScene({
  game,
  boxesLeft,
  revealLocked,
  onChoose,
  onReveal,
}: {
  game: GameState
  boxesLeft: number
  revealLocked: boolean
  onChoose: (boxId: number) => void
  onReveal: (boxId: number) => void
}) {
  return (
    <section className="stage-screen">
      <div className="marquee-wall" aria-hidden="true" />
      <div className="stage-lights" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
      <div className="audience-silhouette" aria-hidden="true" />
      <PrizeTower game={game} side="low" />

      <div className="vault-stage">
        <div className="stage-callout">
          <p>{game.phase === 'selecting' ? 'CHOOSE YOUR PERSONAL CASE' : `ROUND ${game.roundIndex + 1}`}</p>
          <h2>
            {game.phase === 'selecting'
              ? 'This will be your case.'
              : `Open ${boxesLeft} case${boxesLeft === 1 ? '' : 's'}.`}
          </h2>
          <span>
            {game.phase === 'selecting'
              ? 'Its value stays hidden until you make a deal or reach the final reveal.'
              : 'Each reveal removes a possible reward and reprices the offer.'}
          </span>
        </div>

        <div className="vault-grid" aria-label="Vault stage">
          {game.boxes.map((box) => (
            <VaultButton
              key={box.id}
              box={box}
              status={getBoxStatus(game, box.id)}
              phase={game.phase}
              revealLocked={revealLocked}
              onSelect={onChoose}
              onOpen={onReveal}
            />
          ))}
        </div>

        <div className={`private-podium ${game.selectedBoxId ? 'is-set' : ''}`}>
          <span><Crown size={18} /> YOUR PERSONAL CASE</span>
          <strong>{game.selectedBoxId ? `#${String(game.selectedBoxId).padStart(2, '0')}` : 'NOT SELECTED'}</strong>
        </div>
      </div>

      <PrizeTower game={game} side="high" />
    </section>
  )
}

function PrizeTower({ game, side }: { game: GameState; side: 'low' | 'high' }) {
  const ordered = game.boxes.map((box) => box.reward).sort((a, b) => a - b)
  const values = side === 'low' ? ordered.slice(0, 10).reverse() : ordered.slice(10).reverse()
  const openedRewards = new Set(
    game.openedBoxIds
      .map((id) => game.boxes.find((box) => box.id === id)?.reward)
      .filter((reward): reward is number => reward !== undefined),
  )

  return (
    <aside className={`prize-tower prize-${side}`} aria-label={`${side} reward values`}>
      <div className="tower-title"><Landmark size={15} /> {side === 'low' ? 'BASE' : 'PREMIUM'}</div>
      {values.map((value) => (
        <span className={`${openedRewards.has(value) ? 'removed' : ''} tier-${getRewardTier(value)}`} key={value}>
          {formatCap(value).replace(' CAP', '')}
        </span>
      ))}
    </aside>
  )
}

function OfferScene({
  game,
  ready,
  counterAsk,
  counterError,
  onCounterAskChange,
  onDeal,
  onHold,
  onCounter,
  onMark,
}: {
  game: GameState
  ready: boolean
  counterAsk: string
  counterError: string
  onCounterAskChange: (value: string) => void
  onDeal: () => void
  onHold: () => void
  onCounter: () => void
  onMark: () => void
}) {
  const offer = game.currentOffer
  if (!offer) return null

  return (
    <section className="offer-screen">
      <div className={`offer-stage-panel ${ready ? 'offer-ready' : 'offer-ringing'}`}>
        <div className="marquee-wall" aria-hidden="true" />
        <div className="audience-silhouette" aria-hidden="true" />

        <div className="bank-offer-board">
          <span>{ready ? 'BANK OFFER' : 'INCOMING CALL'}</span>
          <strong>{ready ? formatCap(offer.amount) : 'CALCULATING...'}</strong>
        </div>

        <div className="bank-phone" aria-hidden="true">
          <span className="phone-handset"><PhoneCall size={86} strokeWidth={1.5} /></span>
          <span className="phone-dial"><i /><i /><i /><i /><i /><i /></span>
        </div>

      <div className="offer-portrait-wrap">
        <img src={capitalistPortrait} alt="The Capitalist" />
        <div className="portrait-scan" />
        <span><i /> RISK DESK · LIVE</span>
      </div>

        <div className="personal-case-chip">
          <BriefcaseBusiness size={22} />
          <span><small>PERSONAL CASE</small>#{String(game.selectedBoxId ?? 0).padStart(2, '0')}</span>
        </div>

        <PrizeTower game={game} side="high" />
      </div>

      <div className="offer-console">
        <div className="incoming-call"><PhoneCall size={20} /> {ready ? 'OFFER RECEIVED' : 'CONNECTING'} / ROUND {offer.round}</div>
        <p>{ready ? 'THE CAPITALIST IS WAITING FOR YOUR DECISION' : 'THE BANK IS PRICING YOUR CASE'}</p>
        <h2>{ready ? 'YOUR MOVE' : 'STAND BY'}</h2>
        <div className={`call-progress ${ready ? 'is-ready' : ''}`} aria-hidden="true"><span /></div>
        <div className="offer-metrics">
          <span><small>EXPECTED VALUE</small>{formatCap(offer.ev)}</span>
          <span><small>OFFER / EV</small>{Math.round(offer.multiplier * 100)}%</span>
          <span><small>PRESSURE</small>{offer.pressure.toUpperCase()}</span>
        </div>
        <blockquote>"{offer.quote}"</blockquote>

        {game.lastCounter ? (
          <div className={`counter-response ${game.lastCounter.kind}`}>
            <strong>{game.lastCounter.kind.toUpperCase()}</strong>
            <span>{game.lastCounter.note}</span>
          </div>
        ) : null}

        <div className="decision-row">
          <button className="deal-action" type="button" onClick={onDeal} disabled={!ready}>
            <Check size={22} />
            <span><small>LOCK THE PRICE</small>DEAL</span>
          </button>
          <button className="hold-action" type="button" onClick={onHold} disabled={!ready}>
            <Shield size={22} />
            <span><small>RETURN TO THE STAGE</small>HOLD</span>
          </button>
        </div>

        <div className="counter-console">
          <label htmlFor="counter-offer">COUNTER THE DESK</label>
          <div>
            <input
              id="counter-offer"
              min="1"
              inputMode="numeric"
              type="number"
              disabled={!ready}
              value={counterAsk}
              onChange={(event) => onCounterAskChange(event.target.value)}
              placeholder="Enter CAP amount"
            />
            <button type="button" onClick={onMark} disabled={!ready}>MARK</button>
            <button type="button" onClick={onCounter} disabled={!ready}><TrendingUp size={17} /> SEND</button>
          </div>
          {counterError ? <span className="input-error">{counterError}</span> : null}
        </div>

        <OfferTape game={game} />
      </div>
    </section>
  )
}

function OfferTape({ game }: { game: GameState }) {
  if (game.offerHistory.length === 0) return null
  return (
    <div className="offer-tape" aria-label="Offer history">
      <span>OFFER HISTORY</span>
      {game.offerHistory.map((offer, index) => (
        <b key={`${offer.round}-${index}`}>R{offer.round} · {formatCap(offer.amount)}</b>
      ))}
    </div>
  )
}

function SettlementScene({ game, onRestart }: { game: GameState; onRestart: () => void }) {
  const settlement = game.settlement
  if (!settlement) return null
  const edge = settlement.payout - settlement.personalBoxReward

  return (
    <section className={`settlement-screen result-${settlement.ratingEmoji === '🗿' ? 'win' : 'loss'}`}>
      <div className="settlement-beams" aria-hidden="true"><i /><i /><i /></div>
      <div className="result-icon">{settlement.ratingEmoji}</div>
      <p>FINAL SETTLEMENT</p>
      <h2>{settlement.grade}</h2>
      <span className="result-note">{settlement.note}</span>

      <div className="result-comparison">
        <div>
          <small>YOUR PAYOUT</small>
          <strong>{formatCap(settlement.payout)}</strong>
        </div>
        <div className="versus">VS</div>
        <div>
          <small>PRIVATE VAULT</small>
          <strong>{formatCap(settlement.personalBoxReward)}</strong>
        </div>
      </div>

      <div className={`decision-edge ${edge >= 0 ? 'positive' : 'negative'}`}>
        <Trophy size={19} /> DECISION EDGE&nbsp;
        <strong>{edge >= 0 ? '+' : ''}{formatCap(edge)}</strong>
      </div>

      <button className="play-again" type="button" onClick={onRestart}>
        <RotateCcw size={20} /> PLAY ANOTHER SHOW
      </button>
    </section>
  )
}

function StageBannerOverlay({ banner }: { banner: StageBannerState }) {
  return (
    <div className="stage-banner-overlay" role="status" aria-live="polite">
      <div className="banner-light-wall" aria-hidden="true" />
      <div className="stage-banner-copy">
        <BriefcaseBusiness size={34} strokeWidth={1.5} />
        <p>{banner.kicker}</p>
        <strong>{banner.title}</strong>
        <span>{banner.detail}</span>
      </div>
    </div>
  )
}

function RevealOverlay({ reveal }: { reveal: RevealState }) {
  return (
    <div className="reveal-overlay" role="status" aria-live="assertive">
      <div className="reveal-spotlight" />
      <div className="opening-vault">
        <div className="vault-lid"><BriefcaseBusiness size={38} /></div>
        <div className="vault-body"><span>{String(reveal.boxId).padStart(2, '0')}</span></div>
      </div>
      <p>VAULT {String(reveal.boxId).padStart(2, '0')} CONTAINED</p>
      <strong className={`tier-${getRewardTier(reveal.reward)}`}>{formatCap(reveal.reward)}</strong>
      <span>REMOVED FROM THE BOARD</span>
    </div>
  )
}

interface VaultButtonProps {
  box: PrizeBox
  status: BoxStatus
  phase: GameState['phase']
  revealLocked: boolean
  onSelect: (boxId: number) => void
  onOpen: (boxId: number) => void
}

function VaultButton({
  box,
  status,
  phase,
  revealLocked,
  onSelect,
  onOpen,
}: VaultButtonProps) {
  const opened = status === 'opened'
  const disabled = revealLocked || opened || phase === 'offer' ||
    (phase === 'opening' && status === 'chosen')

  function handleClick() {
    if (phase === 'selecting') onSelect(box.id)
    else if (phase === 'opening') onOpen(box.id)
  }

  return (
    <button
      className={`show-vault ${status} ${opened ? `tier-${getRewardTier(box.reward)}` : ''}`}
      type="button"
      disabled={disabled}
      onClick={handleClick}
      aria-label={`Vault ${box.id}${status === 'chosen' ? ', your private vault' : ''}`}
    >
      <span className="case-handle" />
      <span className="case-face">
        <b>{String(box.id).padStart(2, '0')}</b>
        <BriefcaseBusiness size={18} strokeWidth={1.7} />
      </span>
      <span className="case-value">
        {opened ? formatCap(box.reward) : status === 'chosen' ? 'YOURS' : 'SEALED'}
      </span>
    </button>
  )
}

function getBoxStatus(game: GameState, boxId: number): BoxStatus {
  if (game.openedBoxIds.includes(boxId)) return 'opened'
  if (game.selectedBoxId === boxId) return 'chosen'
  return 'available'
}

export default App
