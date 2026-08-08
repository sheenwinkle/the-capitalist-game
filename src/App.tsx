import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Crown,
  PhoneCall,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import './App.css'
import castSprite from './assets/cast-sprite-v1.png'
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
  openBox,
  REWARD_LADDER,
  ROUND_OPEN_COUNTS,
  selectBox,
} from '@the-capitalist/core'
import type { GameState } from '@the-capitalist/core'

type ShowScene =
  | 'lobby'
  | 'round-intro'
  | 'board'
  | 'hostess-reveal'
  | 'elimination'
  | 'offer'
  | 'final-reveal'
  | 'result'

interface PendingReveal {
  boxId: number
  reward: number
  roundIndex: number
}

interface RoundCard {
  kicker: string
  title: string
  detail: string
}

const CAPITALISTS = [
  { name: 'MARCUS KANE', title: 'THE OLD GUARD' },
  { name: 'VICTORIA LIM', title: 'THE DEAL ARCHITECT' },
  { name: 'ADRIAN PARK', title: 'THE QUANT' },
  { name: 'RAFAEL TAN', title: 'THE RAIDER' },
  { name: 'EVELYN CHO', title: 'THE CLOSER' },
  { name: 'KENJI MORI', title: 'THE LAST WORD' },
]

function App() {
  const [game, setGame] = useState<GameState>(() => createNewGame())
  const [scene, setScene] = useState<ShowScene>('lobby')
  const [pendingReveal, setPendingReveal] = useState<PendingReveal | null>(null)
  const [roundCard, setRoundCard] = useState<RoundCard | null>(null)
  const [amountVisible, setAmountVisible] = useState(false)
  const [dockMotion, setDockMotion] = useState(false)
  const timers = useRef<number[]>([])
  const { muted, play, setMuted } = useGameAudio()

  const ev = useMemo(() => calculateEV(game), [game])

  useEffect(() => () => clearTimers(), [])

  function schedule(action: () => void, delay: number) {
    const timer = window.setTimeout(() => {
      timers.current = timers.current.filter((item) => item !== timer)
      action()
    }, delay)
    timers.current.push(timer)
  }

  function clearTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
  }

  function startShow() {
    clearTimers()
    const next = createNewGame()
    setGame(next)
    setPendingReveal(null)
    setAmountVisible(false)
    setRoundCard({
      kicker: 'OPENING DECISION',
      title: 'CHOOSE YOUR CASE',
      detail: 'ONE CASE WILL STAND ALONE AS YOUR PERSONAL CASE',
    })
    setScene('round-intro')
    play('transition')
    schedule(() => {
      setScene('board')
      play('round')
    }, 1700)
  }

  function exitShow() {
    clearTimers()
    setGame(createNewGame())
    setPendingReveal(null)
    setAmountVisible(false)
    setRoundCard(null)
    setScene('lobby')
  }

  function choosePersonalCase(boxId: number) {
    const next = selectBox(game, boxId)
    if (next === game) return
    setGame(next)
    setDockMotion(true)
    play('select')
    schedule(() => setDockMotion(false), 850)
    schedule(() => play('round'), 420)
  }

  function chooseCaseToOpen(boxId: number) {
    const box = game.boxes.find((candidate) => candidate.id === boxId)
    const next = openBox(game, boxId)
    if (!box || next === game) return

    clearTimers()
    const reveal = { boxId, reward: box.reward, roundIndex: game.roundIndex }
    setGame(next)
    setPendingReveal(reveal)
    setAmountVisible(false)
    setScene('hostess-reveal')
    play('transition')

    schedule(() => {
      setAmountVisible(true)
      play('reveal')
    }, 1050)

    schedule(() => {
      setScene('elimination')
      play('eliminate')
    }, 3000)

    schedule(() => {
      if (next.phase === 'offer') {
        setScene('offer')
        play('offerPrompt')
      } else {
        setScene('board')
        play('transition')
      }
    }, 5400)
  }

  function acceptDeal() {
    clearTimers()
    const next = acceptCurrentOffer(game)
    if (next === game) return
    setGame(next)
    play('deal')
    beginFinalReveal(next)
  }

  function rejectDeal() {
    clearTimers()
    const next = holdOffer(game)
    if (next === game) return
    setGame(next)
    play('noDeal')

    if (next.phase === 'ended') {
      beginFinalReveal(next)
      return
    }

    setRoundCard({
      kicker: `ROUND ${next.roundIndex + 1}`,
      title: `OPEN ${getBoxesLeftToOpenThisRound(next)} CASES`,
      detail: 'EVERY CASE CHANGES THE NEXT CAPITALIST OFFER',
    })
    setScene('round-intro')
    schedule(() => {
      setScene('board')
      play('round')
    }, 1750)
  }

  function beginFinalReveal(next: GameState) {
    setAmountVisible(false)
    setScene('final-reveal')
    play('transition')

    schedule(() => {
      setAmountVisible(true)
      play('finalReveal')
    }, 1250)

    schedule(() => {
      setScene('result')
      play(didBeatLastOffer(next) ? 'champion' : 'clown')
    }, 3900)
  }

  if (scene === 'lobby') {
    return (
      <Lobby
        muted={muted}
        onToggleSound={() => setMuted(!muted)}
        onStart={startShow}
      />
    )
  }

  return (
    <main className="show-shell">
      <ShowHeader
        scene={scene}
        muted={muted}
        onToggleSound={() => setMuted(!muted)}
        onExit={exitShow}
      />

      <div className={`scene scene-${scene}`} key={scene}>
        {scene === 'round-intro' && roundCard ? <RoundIntro card={roundCard} /> : null}
        {scene === 'board' ? (
          <BoardScene
            game={game}
            ev={ev}
            dockMotion={dockMotion}
            onChoosePersonal={choosePersonalCase}
            onChooseCase={chooseCaseToOpen}
          />
        ) : null}
        {scene === 'hostess-reveal' && pendingReveal ? (
          <HostessReveal reveal={pendingReveal} amountVisible={amountVisible} />
        ) : null}
        {scene === 'elimination' && pendingReveal ? (
          <EliminationScene game={game} reveal={pendingReveal} />
        ) : null}
        {scene === 'offer' ? (
          <OfferScene game={game} onDeal={acceptDeal} onNoDeal={rejectDeal} />
        ) : null}
        {scene === 'final-reveal' ? (
          <FinalReveal game={game} amountVisible={amountVisible} />
        ) : null}
        {scene === 'result' ? <ResultScene game={game} onRestart={startShow} /> : null}
      </div>
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
    <main className="lobby">
      <img src={showStage} alt="THE CAPITALIST illuminated game show stage" />
      <div className="lobby-overlay" />
      <div className="light-wall" aria-hidden="true" />
      <div className="crowd" aria-hidden="true" />
      <button
        className="icon-button lobby-volume"
        type="button"
        onClick={onToggleSound}
        aria-label={muted ? 'Turn sound on' : 'Mute sound'}
      >
        {muted ? <VolumeX size={22} /> : <Volume2 size={22} />}
      </button>
      <section className="lobby-content">
        <p>WELCOME TO</p>
        <div className="brand-plaque">
          <img src="/capitalist-mark.svg" alt="" />
          <h1><span>THE</span> CAPITALIST</h1>
          <b>EVERY DECISION HAS A PRICE</b>
        </div>
        <button className="primary-cta" type="button" onClick={onStart}>
          <Sparkles size={21} /> TAP TO PLAY <ChevronRight size={21} />
        </button>
        <small>VIRTUAL CAP ONLY / NO CASH-OUT / NO TRADABLE REWARDS</small>
      </section>
    </main>
  )
}

function ShowHeader({
  scene,
  muted,
  onToggleSound,
  onExit,
}: {
  scene: ShowScene
  muted: boolean
  onToggleSound: () => void
  onExit: () => void
}) {
  const label = scene.replaceAll('-', ' ').toUpperCase()
  return (
    <header className="show-header">
      <div className="header-brand">
        <img src="/capitalist-mark.svg" alt="" />
        <strong>THE CAPITALIST</strong>
      </div>
      <span>{label}</span>
      <div className="header-actions">
        <button className="icon-button" type="button" onClick={onToggleSound} aria-label={muted ? 'Turn sound on' : 'Mute sound'}>
          {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
        </button>
        <button className="icon-button" type="button" onClick={onExit} aria-label="Restart show">
          <RotateCcw size={19} />
        </button>
      </div>
    </header>
  )
}

function RoundIntro({ card }: { card: RoundCard }) {
  return (
    <section className="round-intro full-scene">
      <div className="light-wall" aria-hidden="true" />
      <div className="crowd" aria-hidden="true" />
      <div className="round-card">
        <BriefcaseBusiness size={38} strokeWidth={1.5} />
        <p>{card.kicker}</p>
        <h2>{card.title}</h2>
        <span>{card.detail}</span>
      </div>
    </section>
  )
}

function BoardScene({
  game,
  ev,
  dockMotion,
  onChoosePersonal,
  onChooseCase,
}: {
  game: GameState
  ev: number
  dockMotion: boolean
  onChoosePersonal: (boxId: number) => void
  onChooseCase: (boxId: number) => void
}) {
  const choosingPersonal = game.phase === 'selecting'
  const boxesLeft = getBoxesLeftToOpenThisRound(game)
  const liveCases = game.boxes.filter(
    (box) => box.id !== game.selectedBoxId && !game.openedBoxIds.includes(box.id),
  )

  return (
    <section className="board-scene full-scene">
      <div className="light-wall" aria-hidden="true" />
      <div className="crowd" aria-hidden="true" />

      {game.selectedBoxId ? (
        <div className={`personal-case-dock ${dockMotion ? 'dock-motion' : ''}`}>
          <Crown size={18} />
          <span><small>YOUR CASE</small>#{String(game.selectedBoxId).padStart(2, '0')}</span>
          <CaseGraphic boxId={game.selectedBoxId} compact />
        </div>
      ) : null}

      <div className="board-copy">
        <p>{choosingPersonal ? 'FIRST DECISION' : `ROUND ${game.roundIndex + 1} / ${ROUND_OPEN_COUNTS.length}`}</p>
        <h1>{choosingPersonal ? 'CHOOSE YOUR PERSONAL CASE' : `CHOOSE ${boxesLeft} CASE${boxesLeft === 1 ? '' : 'S'} TO OPEN`}</h1>
        <span>{choosingPersonal ? 'Your case will move above the board and remain sealed.' : `LIVE MARKET EV ${formatCap(ev)}`}</span>
      </div>

      <div className={`case-grid ${choosingPersonal ? 'grid-twenty' : ''}`}>
        {(choosingPersonal ? game.boxes : liveCases).map((box) => (
          <button
            className="case-choice"
            type="button"
            key={box.id}
            onClick={() => choosingPersonal ? onChoosePersonal(box.id) : onChooseCase(box.id)}
            aria-label={`${choosingPersonal ? 'Choose' : 'Open'} case ${box.id}`}
          >
            <CaseGraphic boxId={box.id} />
          </button>
        ))}
      </div>

      {!choosingPersonal ? (
        <div className="round-meter" aria-label={`${boxesLeft} cases left to open this round`}>
          <span>{boxesLeft}</span> CASES LEFT THIS ROUND
        </div>
      ) : null}
    </section>
  )
}

function HostessReveal({
  reveal,
  amountVisible,
}: {
  reveal: PendingReveal
  amountVisible: boolean
}) {
  return (
    <section className="hostess-scene full-scene">
      <div className="light-wall" aria-hidden="true" />
      <div className="crowd" aria-hidden="true" />
      <div className="hostess-copy">
        <p>LIVE CASE OPENING</p>
        <h1>CASE #{String(reveal.boxId).padStart(2, '0')}</h1>
      </div>
      <CastSprite kind="hostess" index={reveal.roundIndex} />
      <div className={`reveal-case ${amountVisible ? 'is-open' : ''}`}>
        <span className="reveal-case-lid"><BriefcaseBusiness size={42} /></span>
        <span className="reveal-case-body">
          {amountVisible ? formatCap(reveal.reward) : 'SEALED'}
        </span>
      </div>
      <div className={`amount-flash ${amountVisible ? 'is-visible' : ''}`}>
        <small>CASE CONTAINED</small>
        <strong className={`tier-${getRewardTier(reveal.reward)}`}>{formatCap(reveal.reward)}</strong>
      </div>
    </section>
  )
}

function EliminationScene({ game, reveal }: { game: GameState; reveal: PendingReveal }) {
  const removedRewards = new Set(
    game.openedBoxIds
      .map((id) => game.boxes.find((box) => box.id === id)?.reward)
      .filter((reward): reward is number => reward !== undefined),
  )

  return (
    <section className="elimination-scene full-scene">
      <div className="elimination-title">
        <X size={34} />
        <p>REMOVED FROM THE GAME</p>
        <h1>{formatCap(reveal.reward)}</h1>
      </div>
      <RewardBoard removedRewards={removedRewards} justRemoved={reveal.reward} />
      <div className="elimination-stamp">ELIMINATED</div>
    </section>
  )
}

function OfferScene({
  game,
  onDeal,
  onNoDeal,
}: {
  game: GameState
  onDeal: () => void
  onNoDeal: () => void
}) {
  const offer = game.currentOffer
  if (!offer) return null
  const capitalist = CAPITALISTS[Math.min(game.roundIndex, CAPITALISTS.length - 1)]

  return (
    <section className="capitalist-scene full-scene">
      <div className="capitalist-backdrop" aria-hidden="true" />
      <div className="capitalist-profile">
        <CastSprite kind="capitalist" index={game.roundIndex} />
        <span>CAPITALIST {game.roundIndex + 1} / {CAPITALISTS.length}</span>
      </div>
      <div className="offer-panel">
        <div className="offer-live"><i /> LIVE OFFER</div>
        <p>{capitalist.title}</p>
        <h1>{capitalist.name}</h1>
        <blockquote>"{offer.quote}"</blockquote>
        <div className="offer-amount">
          <small>THE OFFER IS</small>
          <strong>{formatCap(offer.amount)}</strong>
          <span>{Math.round(offer.multiplier * 100)}% OF MARKET EV</span>
        </div>
        <div className="deal-question"><PhoneCall size={24} /> DEAL OR NO DEAL?</div>
        <div className="deal-actions">
          <button className="deal-button" type="button" onClick={onDeal}>
            <Check size={25} /> <span><small>TAKE THE MONEY</small>DEAL</span>
          </button>
          <button className="no-deal-button" type="button" onClick={onNoDeal}>
            <X size={25} /> <span><small>PLAY THE NEXT ROUND</small>NO DEAL</span>
          </button>
        </div>
      </div>
    </section>
  )
}

function FinalReveal({ game, amountVisible }: { game: GameState; amountVisible: boolean }) {
  const personalBox = game.boxes.find((box) => box.id === game.selectedBoxId)
  if (!personalBox || !game.settlement) return null

  return (
    <section className="final-reveal-scene full-scene">
      <div className="light-wall" aria-hidden="true" />
      <div className="final-copy">
        <p>FINAL REVEAL</p>
        <h1>YOUR PERSONAL CASE</h1>
        <span>#{String(personalBox.id).padStart(2, '0')}</span>
      </div>
      <div className={`final-case ${amountVisible ? 'is-open' : ''}`}>
        <span className="final-case-lid"><Crown size={38} /></span>
        <span className="final-case-body">
          {amountVisible ? formatCap(personalBox.reward) : 'OPENING...'}
        </span>
      </div>
      {amountVisible ? (
        <div className="final-comparison">
          <span><small>YOUR PAYOUT</small>{formatCap(game.settlement.payout)}</span>
          <b>VS</b>
          <span><small>CASE VALUE</small>{formatCap(personalBox.reward)}</span>
        </div>
      ) : null}
    </section>
  )
}

function ResultScene({ game, onRestart }: { game: GameState; onRestart: () => void }) {
  const settlement = game.settlement
  if (!settlement) return null
  const lastOffer = game.offerHistory.at(-1)?.amount ?? 0
  const champion = didBeatLastOffer(game)

  return (
    <section className={`result-scene full-scene ${champion ? 'is-champion' : 'is-clown'}`}>
      {champion ? <ChampionPerformance /> : <ClownPerformance />}
      <p>{champion ? 'YOU BEAT THE CAPITALIST' : 'THE CAPITALIST HAD THE BETTER DEAL'}</p>
      <h1>{champion ? 'YOU ARE THE CHAMPION' : 'YOU LEFT MONEY ON THE TABLE'}</h1>
      <div className="result-ledger">
        <span><small>YOU RECEIVED</small>{formatCap(settlement.payout)}</span>
        <span><small>LAST OFFER</small>{formatCap(lastOffer)}</span>
        <span className={settlement.payout - lastOffer >= 0 ? 'positive' : 'negative'}>
          <small>DECISION EDGE</small>
          {settlement.payout - lastOffer >= 0 ? '+' : ''}{formatCap(settlement.payout - lastOffer)}
        </span>
      </div>
      <button className="play-again" type="button" onClick={onRestart}>
        <RotateCcw size={20} /> PLAY ANOTHER SHOW
      </button>
    </section>
  )
}

function ChampionPerformance() {
  return (
    <div className="champion-performance" aria-label="Victory celebration">
      <span className="confetti c1" /><span className="confetti c2" />
      <span className="confetti c3" /><span className="confetti c4" />
      <span className="confetti c5" /><span className="confetti c6" />
      <Trophy size={92} strokeWidth={1.25} />
      <strong>CHAMPION</strong>
    </div>
  )
}

function ClownPerformance() {
  return (
    <div className="clown-performance" aria-label="Clown pinching its nose">
      <span className="clown-face">🤡</span>
      <span className="pinch-hand">🤏</span>
      <span className="comic-pop">HONK!</span>
    </div>
  )
}

function RewardBoard({
  removedRewards,
  justRemoved,
}: {
  removedRewards: Set<number>
  justRemoved?: number
}) {
  return (
    <div className="reward-board">
      {REWARD_LADDER.map((reward) => (
        <span
          className={`${removedRewards.has(reward) ? 'removed' : ''} ${reward === justRemoved ? 'just-removed' : ''} tier-${getRewardTier(reward)}`}
          key={reward}
        >
          {formatCap(reward)}
        </span>
      ))}
    </div>
  )
}

function CaseGraphic({ boxId, compact = false }: { boxId: number; compact?: boolean }) {
  return (
    <span className={`case-graphic ${compact ? 'compact' : ''}`}>
      <i className="case-handle" />
      <b>{String(boxId).padStart(2, '0')}</b>
    </span>
  )
}

function CastSprite({ kind, index }: { kind: 'hostess' | 'capitalist'; index: number }) {
  const safeIndex = Math.min(Math.max(index, 0), 5)
  return (
    <div
      className={`cast-sprite cast-${kind}`}
      style={{
        backgroundImage: `url(${castSprite})`,
        backgroundPosition: `${safeIndex * 20}% ${kind === 'hostess' ? '0%' : '100%'}`,
      }}
      role="img"
      aria-label={kind === 'hostess' ? `Round ${safeIndex + 1} case presenter` : CAPITALISTS[safeIndex].name}
    />
  )
}

function didBeatLastOffer(game: GameState) {
  const payout = game.settlement?.payout ?? 0
  const lastOffer = game.offerHistory.at(-1)?.amount ?? 0
  return payout >= lastOffer
}

export default App
