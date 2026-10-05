import { useState, useEffect } from 'react'
import {
  useRive,
  useStateMachineInput,
  Layout,
  Fit,
  Alignment,
  EventType,
} from '@rive-app/react-webgl2'

import foxS1 from './assets/stage1/ART_Fox.riv'
import bearS1 from './assets/stage1/ART_Bear.riv'
import dragonS1 from './assets/stage1/ART_Dragon.riv'
import foxS2 from './assets/stage2/ART_Fox_Stage2.riv'
import bearS2 from './assets/stage2/ART_Bear_Stage2.riv'
import dragonS2 from './assets/stage2/ART_Dragon_Stage2.riv'

// One .riv per companion per stage. The state machine schema is identical
// across stages (isTalking · Celebrate · Blink · CompassTapped / MirrorTapped);
// only the file and the artboard name change.
const STAGES = [
  {
    id: 1,
    label: 'Stage 1',
    ready: true,
    characters: [
      { id: 'fox', label: 'Fox', file: 'ART_Fox.riv', src: foxS1, artboard: 'ART_Fox', stateMachine: 'Fox Controller' },
      { id: 'bear', label: 'Bear', file: 'ART_Bear.riv', src: bearS1, artboard: 'ART_Bear', stateMachine: 'Bear Controller' },
      { id: 'dragon', label: 'Dragon', file: 'ART_Dragon.riv', src: dragonS1, artboard: 'ART_Dragon', stateMachine: 'Dragon Controller' },
    ],
  },
  {
    id: 2,
    label: 'Stage 2',
    ready: true,
    characters: [
      { id: 'fox', label: 'Fox', file: 'ART_Fox_Stage2.riv', src: foxS2, artboard: 'STAGE2_ART_Fox', stateMachine: 'Fox Controller' },
      { id: 'bear', label: 'Bear', file: 'ART_Bear_Stage2.riv', src: bearS2, artboard: 'STAGE2_ART_Bear', stateMachine: 'Bear Controller' },
      { id: 'dragon', label: 'Dragon', file: 'ART_Dragon_Stage2.riv', src: dragonS2, artboard: 'STAGE2_ART_Dragon', stateMachine: 'Dragon Controller' },
    ],
  },
  { id: 3, label: 'Stage 3', ready: false, characters: [] },
]

export default function App() {
  const [stageId, setStageId] = useState(2)
  const [characterId, setCharacterId] = useState('fox')
  const stage = STAGES.find((s) => s.id === stageId)
  const character = stage.characters.find((c) => c.id === characterId)

  return (
    <>
      <div className="layout">
        {/* key= forces a clean remount (new Rive instance) per stage + character */}
        <CharacterStage
          key={`${stage.id}-${character.id}`}
          stage={stage}
          character={character}
          stages={STAGES}
          onSelectStage={setStageId}
          onSelectCharacter={setCharacterId}
        />
      </div>

      <div className="docs">
        <div className="docs-shell">
          <DocsNav />
          <div className="docs-body">
            <DocsBody />
          </div>
        </div>
      </div>
    </>
  )
}

function CharacterStage({ stage, character, stages, onSelectStage, onSelectCharacter }) {
  const [artboardMissing, setArtboardMissing] = useState(false)
  const [isTalkingOn, setIsTalkingOn] = useState(false)
  const [eventLog, setEventLog] = useState([])

  const { rive, RiveComponent } = useRive({
    src: character.src,
    artboard: character.artboard,
    stateMachines: character.stateMachine,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onLoadError: () => setArtboardMissing(true),
  })

  const isTalkingInput = useStateMachineInput(rive, character.stateMachine, 'isTalking')
  const celebrateInput = useStateMachineInput(rive, character.stateMachine, 'Celebrate')
  const blinkInput = useStateMachineInput(rive, character.stateMachine, 'Blink')

  // Confirm the requested artboard / state machine really exist in this file.
  useEffect(() => {
    if (!rive) return
    const hasArtboard = rive.artboardNames?.includes(character.artboard) ?? true
    const hasStateMachine = rive.stateMachineNames?.includes(character.stateMachine) ?? true
    if (!hasArtboard || !hasStateMachine) setArtboardMissing(true)
  }, [rive, character])

  useEffect(() => {
    if (!rive) return
    const resize = () => rive.resizeDrawingSurfaceToCanvas()
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [rive])

  // CompassTapped / MirrorTapped — scoped to this character's controller.
  useEffect(() => {
    if (!rive) return
    const onRiveEvent = (riveEvent) => {
      const name = riveEvent?.data?.name ?? 'event'
      setEventLog((log) => [{ name, at: Date.now() }, ...log].slice(0, 6))
    }
    rive.on(EventType.RiveEvent, onRiveEvent)
    return () => rive.off(EventType.RiveEvent, onRiveEvent)
  }, [rive])

  const toggleTalking = () => {
    if (!isTalkingInput) return
    const next = !isTalkingOn
    isTalkingInput.value = next
    setIsTalkingOn(next)
  }

  return (
    <>
      <div className="stage">
        <div className="stage-grid" />

        <div className="stage-tabs" role="tablist">
          {stages.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={s.id === stage.id}
              className={`stage-tab${s.id === stage.id ? ' active' : ''}`}
              disabled={!s.ready}
              title={s.ready ? undefined : 'Milestone 2'}
              onClick={() => onSelectStage(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="canvas-wrap">
          {artboardMissing ? (
            <div className="missing-artboard">
              <div className="missing-artboard-title">Artboard mismatch</div>
              <p>
                <code>{character.artboard}</code> / <code>{character.stateMachine}</code> wasn't
                found in <code>{character.file}</code>. Re-export that file and drop it into{' '}
                <code>src/assets/stage{stage.id}/</code> — no code changes needed.
              </p>
            </div>
          ) : (
            <RiveComponent />
          )}
        </div>

        <div className="stage-hex">#5D18FF</div>
      </div>

      <div className="panel">
        <div className="top-tag">
          <span className="pulse" />
          Live State Machine
          <span className="update-pill">Companion · {stage.label}</span>
        </div>
        <h1>Companion Stages</h1>
        <p className="sub">
          Pick a stage and a companion, then drive its controller live — <code>isTalking</code>,{' '}
          <code>Celebrate</code> and <code>Blink</code> are the same inputs in every stage.
        </p>

        <div className="group-label">Companion</div>
        <div className="chip-row" style={{ marginBottom: 24 }}>
          {stage.characters.map((c) => (
            <button
              key={c.id}
              className={`chip-btn${c.id === character.id ? ' on' : ''}`}
              onClick={() => onSelectCharacter(c.id)}
            >
              <span className="chip-dot" />
              {c.label}
            </button>
          ))}
        </div>

        <div className="group-label">
          State <span className="live-tag">isTalking · boolean</span>
        </div>
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="row toggle-row">
            <div className="label">isTalking</div>
            <button
              className={`toggle-switch${isTalkingOn ? ' on' : ''}`}
              onClick={toggleTalking}
              disabled={!isTalkingInput}
              aria-pressed={isTalkingOn}
              aria-label="isTalking"
            >
              <span className="toggle-knob" />
            </button>
          </div>
        </div>

        <div className="group-label">Actions</div>
        <div className="chip-row" style={{ marginBottom: 24 }}>
          <button className="chip-btn" onClick={() => celebrateInput?.fire()} disabled={!celebrateInput}>
            <span className="chip-dot" />
            Celebrate
          </button>
          <button className="chip-btn" onClick={() => blinkInput?.fire()} disabled={!blinkInput}>
            <span className="chip-dot" />
            Blink
          </button>
        </div>

        <div className="group-label">Accessory events</div>
        <div className="card" style={{ padding: 16, marginBottom: 24 }}>
          {eventLog.length === 0 ? (
            <div className="live-feed">
              <span className="live-feed-dot" />
              <span className="live-feed-label">Listening</span>
              <span className="live-feed-value">tap Compass / Mirror on the stage…</span>
            </div>
          ) : (
            eventLog.map((e, i) => (
              <div className="live-feed" key={`${e.at}-${i}`} style={{ marginBottom: 8 }}>
                <span className="live-feed-dot" />
                <span className="live-feed-label">{e.name}</span>
                <span className="live-feed-value">
                  {character.label} · {stage.label} · {new Date(e.at).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="state-readout">
          <span className="live-dot" />
          file: <b>{character.file}</b> · artboard: <b>{character.artboard}</b> · state machine:{' '}
          <b>{character.stateMachine}</b>
        </div>

        <a className="scroll-cue" href="#overview">
          <span>Integration docs</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </>
  )
}

function DocsNav() {
  const items = [
    ['overview', 'Overview'],
    ['files', 'Files'],
    ['inputs', 'Inputs'],
    ['events', 'Events'],
    ['js', 'JavaScript'],
    ['rn', 'React Native'],
    ['checklist', 'Checklist'],
  ]
  return (
    <nav className="docs-nav">
      <div className="docs-nav-label">Contents</div>
      {items.map(([id, label]) => (
        <a key={id} href={`#${id}`}>{label}</a>
      ))}
    </nav>
  )
}

function DocsBody() {
  return (
    <>
      <DocSection id="overview" eyebrow="Overview" title="Three companions, one schema, every stage">
        <p>
          Fox, Bear and Dragon each ship as their own <code>.riv</code> per stage. Stage 2 reuses
          the approved Stage 1 state machine exactly: same inputs, same animations (Idle, Talking,
          Celebrating, Blink) and same item interaction targets (Compass, Mirror). Only the
          artwork and the artboard name change, so switching stage in the app means swapping the{' '}
          <code>src</code> and <code>artboard</code> and keeping all input code as is.
        </p>
        <div className="update-grid">
          <div className="update-card system-a">
            <div className="update-card-title">Stage 1</div>
            <ul>
              <li>Artboards <code>ART_Fox</code>, <code>ART_Bear</code>, <code>ART_Dragon</code></li>
              <li>Files in <code>src/assets/stage1/</code></li>
            </ul>
          </div>
          <div className="update-card">
            <div className="update-card-title">Stage 2</div>
            <ul>
              <li>Artboards <code>STAGE2_ART_Fox</code>, <code>STAGE2_ART_Bear</code>, <code>STAGE2_ART_Dragon</code></li>
              <li>Files in <code>src/assets/stage2/</code></li>
            </ul>
          </div>
        </div>
      </DocSection>

      <DocSection id="files" eyebrow="Files" title="Where the files live">
        <table className="stage-table">
          <thead>
            <tr><th>Stage</th><th>File</th><th>Artboard</th><th>State machine</th></tr>
          </thead>
          <tbody>
            {STAGES.filter((s) => s.ready).flatMap((s) =>
              s.characters.map((c) => (
                <tr key={`${s.id}-${c.id}`}>
                  <td>{s.id}</td>
                  <td><code>{c.file}</code></td>
                  <td><code>{c.artboard}</code></td>
                  <td><code>{c.stateMachine}</code></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <p>
          Stage 3 follows the same pattern (<code>STAGE3_ART_*</code>) and will be added with
          Milestone 2.
        </p>
      </DocSection>

      <DocSection id="inputs" eyebrow="Reference" title="Inputs">
        <div className="inputs-grid">
          <InputCard kind="Boolean" name="isTalking" desc="true → Talking loop, false → back to Idle." />
          <InputCard kind="Trigger" name="Celebrate" desc="Fires the one-shot Celebrating clip, then returns to Idle." />
          <InputCard kind="Trigger" name="Blink" desc="One-shot Blink on its own layer, works in Idle and Talking." />
          <InputCard kind="Rive Event" name="CompassTapped" desc="Pointer down on the Compass item." />
          <InputCard kind="Rive Event" name="MirrorTapped" desc="Pointer down on the Mirror item." />
        </div>
      </DocSection>

      <DocSection id="events" eyebrow="Per character" title="Events are scoped, not shared">
        <p>
          Each event belongs to its character's controller. Fox's <code>CompassTapped</code> is a
          different event from Bear's or Dragon's even though the name is the same, so listen on
          the Rive instance of the character currently on screen, as the demo does.
        </p>
      </DocSection>

      <DocSection id="js" eyebrow="JavaScript" title="Web integration example">
        <CodeBlock code={JS_EXAMPLE} />
      </DocSection>

      <DocSection id="rn" eyebrow="React Native" title="React Native example">
        <CodeBlock code={RN_EXAMPLE} />
      </DocSection>

      <DocSection id="checklist" eyebrow="Integration checklist" title="Ship it">
        <ul className="check-list boxes">
          <li>Pick the file, artboard and state machine for the stage + companion from the table above</li>
          <li>Bind <code>isTalking</code> to your speaking state</li>
          <li>Fire <code>Celebrate</code> on success moments, <code>Blink</code> on a timer</li>
          <li>Listen for <code>CompassTapped</code> / <code>MirrorTapped</code> on that companion's instance</li>
          <li>Keep the canvas size and alignment the same across stages: the artwork is positioned to match</li>
        </ul>
      </DocSection>

      <footer className="docs-footer">Companion Stages · Rive integration docs</footer>
    </>
  )
}

function DocSection({ id, eyebrow, title, children }) {
  return (
    <section id={id} className="doc-section">
      <div className="doc-eyebrow">{eyebrow}</div>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function InputCard({ kind, name, desc }) {
  return (
    <div className="input-card">
      <div className="input-kind">{kind}</div>
      <code>{name}</code>
      <p>{desc}</p>
    </div>
  )
}

function CodeBlock({ code }) {
  return (
    <pre className="code-block">
      <code>{code}</code>
    </pre>
  )
}

const JS_EXAMPLE = `import { Rive, Fit, Alignment, Layout, EventType } from '@rive-app/canvas'

// Stage 2 Fox. For Stage 1 use 'ART_Fox.riv' + artboard 'ART_Fox'.
const r = new Rive({
  src: '/ART_Fox_Stage2.riv',
  canvas: document.getElementById('fox-canvas'),
  artboard: 'STAGE2_ART_Fox',
  stateMachines: 'Fox Controller',
  autoplay: true,
  layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  onLoad: () => {
    const inputs = r.stateMachineInputs('Fox Controller')
    const isTalking = inputs.find((i) => i.name === 'isTalking')
    const celebrate = inputs.find((i) => i.name === 'Celebrate')
    const blink = inputs.find((i) => i.name === 'Blink')

    isTalking.value = true   // Talking loop
    celebrate.fire()         // one-shot Celebrating
    blink.fire()             // one-shot Blink

    r.on(EventType.RiveEvent, (e) => {
      if (e.data.name === 'CompassTapped') { /* ... */ }
      if (e.data.name === 'MirrorTapped') { /* ... */ }
    })
  },
})`

const RN_EXAMPLE = `import Rive from 'rive-react-native'

const COMPANIONS = {
  1: {
    fox:    { resourceName: 'art_fox',          artboard: 'ART_Fox',          stateMachine: 'Fox Controller' },
    bear:   { resourceName: 'art_bear',         artboard: 'ART_Bear',         stateMachine: 'Bear Controller' },
    dragon: { resourceName: 'art_dragon',       artboard: 'ART_Dragon',       stateMachine: 'Dragon Controller' },
  },
  2: {
    fox:    { resourceName: 'art_fox_stage2',    artboard: 'STAGE2_ART_Fox',    stateMachine: 'Fox Controller' },
    bear:   { resourceName: 'art_bear_stage2',   artboard: 'STAGE2_ART_Bear',   stateMachine: 'Bear Controller' },
    dragon: { resourceName: 'art_dragon_stage2', artboard: 'STAGE2_ART_Dragon', stateMachine: 'Dragon Controller' },
  },
}

export function CompanionCharacter({ stage, name }) {
  const c = COMPANIONS[stage][name]
  const riveRef = useRef(null)

  const setTalking = (on) => riveRef.current?.setInputState(c.stateMachine, 'isTalking', on)
  const celebrate = () => riveRef.current?.fireState(c.stateMachine, 'Celebrate')
  const blink = () => riveRef.current?.fireState(c.stateMachine, 'Blink')

  return (
    <Rive
      ref={riveRef}
      resourceName={c.resourceName}
      artboardName={c.artboard}
      stateMachineName={c.stateMachine}
      autoplay
      style={{ width: '100%', height: 320 }}
    />
  )
}`
