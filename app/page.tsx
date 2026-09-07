'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  Box,
  Layers3,
  RotateCcw,
  Plus,
  Minus,
  Maximize,
  Move3d,
  MousePointer2,
  Scan,
  Cpu,
  CircuitBoard,
  HardDrive,
  Fan,
  Cable,
  Square,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Info,
  Hand,
  Mouse,
  Rotate3d,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { parts, type PartId, type ViewMode } from './components/parts';
import type { MacScene } from './components/mac-scene';

const partIcons = [Box, Cable, Cpu, HardDrive, Fan, CircuitBoard];
export default function Home() {
  const hostRef = useRef<HTMLDivElement>(null),
    sceneRef = useRef<MacScene | null>(null);
  const labelRefs = useRef<Partial<Record<PartId, HTMLButtonElement | null>>>(
    {},
  );
  const [explosion, setExplosion] = useState(0),
    [selected, setSelected] = useState<PartId>('enclosure');
  const [autoRotate, setAutoRotate] = useState(false),
    [labels, setLabels] = useState(true);
  const [ready, setReady] = useState(false),
    [error, setError] = useState('');
  const [view, setView] = useState<ViewMode>('perspective');
  const [playing, setPlaying] = useState(false),
    [speaking, setSpeaking] = useState(false),
    [notice, setNotice] = useState('');
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const current = parts.findIndex((p) => p.id === selected),
    part = parts[current];
  const latest = useRef({ explosion, selected, autoRotate, labels });
  latest.current = { explosion, selected, autoRotate, labels };
  const pick = useCallback((id: PartId) => {
    setSelected(id);
    setPlaying(false);
    if (id !== 'enclosure') setExplosion(100);
  }, []);
  const pickRef = useRef(pick);
  pickRef.current = pick;
  useEffect(() => {
    let canceled = false,
      instance: MacScene | null = null;
    const host = hostRef.current!;
    const contextLost = (e: Event) => {
      e.preventDefault();
      setError('3D 显示暂时中断，请刷新页面恢复。');
    };
    import('./components/mac-scene')
      .then(({ createMacScene }) => {
        if (canceled) return;
        try {
          instance = createMacScene(
            host,
            (id) => pickRef.current(id),
            (points) =>
              points.forEach((p) => {
                const el = labelRefs.current[p.id];
                if (el) {
                  el.style.transform = `translate(${p.x}px, ${p.y}px)`;
                  el.style.opacity = p.visible ? '1' : '0';
                  el.style.pointerEvents = p.visible ? 'auto' : 'none';
                  el.style.visibility = p.visible ? 'visible' : 'hidden';
                }
              }),
          );
          sceneRef.current = instance;
          instance.setState(latest.current);
          host
            .querySelector('canvas')
            ?.addEventListener('webglcontextlost', contextLost);
          setReady(true);
        } catch (e) {
          console.error('Mac mini renderer:', e);
          setError(
            '当前浏览器无法启动 3D 显示。请使用支持 WebGL 2 的 Safari、Chrome 或 Edge，并开启图形加速。',
          );
        }
      })
      .catch(() => setError('3D 模型加载失败，请刷新页面重试。'));
    setVoiceAvailable('speechSynthesis' in window);
    return () => {
      canceled = true;
      host
        .querySelector('canvas')
        ?.removeEventListener('webglcontextlost', contextLost);
      instance?.dispose();
      sceneRef.current = null;
    };
  }, []);
  useEffect(() => {
    sceneRef.current?.setState({ explosion, selected, autoRotate, labels });
  }, [explosion, selected, autoRotate, labels]);
  useEffect(() => {
    type Tool = {
      name: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean };
      execute: (input: unknown) => unknown;
    };
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: Tool,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tools: Tool[] = [
      {
        name: 'get_mac_mini_state',
        description: '读取 Mac mini 当前拆解程度、选中部件和讲解内容。',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: () => ({
          ...latest.current,
          explanation: parts.find((p) => p.id === latest.current.selected)
            ?.description,
        }),
      },
      {
        name: 'configure_mac_mini',
        description:
          '选择 Mac mini 部件并配置拆解程度，更新模型与可见的中文讲解。',
        inputSchema: {
          type: 'object',
          properties: {
            part: { type: 'string', enum: parts.map((p) => p.id) },
            explosion: { type: 'integer', minimum: 0, maximum: 100 },
          },
          required: ['part', 'explosion'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: (input: unknown) => {
          if (!input || typeof input !== 'object')
            throw new Error('请提供部件和拆解程度。');
          const value = input as { part: PartId; explosion: number };
          if (
            !parts.some((p) => p.id === value.part) ||
            !Number.isInteger(value.explosion) ||
            value.explosion < 0 ||
            value.explosion > 100 ||
            Object.keys(value).some((k) => !['part', 'explosion'].includes(k))
          )
            throw new Error('部件必须有效，拆解程度必须是 0 至 100 的整数。');
          flushSync(() => {
            setPlaying(false);
            setSelected(value.part);
            setExplosion(value.explosion);
          });
          return {
            selected: value.part,
            explosion: value.explosion,
            explanation: parts.find((p) => p.id === value.part)!.description,
          };
        },
      },
    ];
    tools.forEach((tool) => {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {
        /* Optional browser capability. */
      }
    });
    return () => lifecycle.abort();
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (current === parts.length - 1) {
        setPlaying(false);
        return;
      }
      setSelected(parts[current + 1].id);
    }, 10500);
    return () => window.clearTimeout(timer);
  }, [playing, current]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [selected]);
  useEffect(
    () => () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    },
    [],
  );
  function speak() {
    setPlaying(false);
    if (!voiceAvailable) {
      setNotice('此浏览器不支持语音朗读，仍可阅读全部图文讲解。');
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(
      `${part.name}。${part.description}。${part.detail}`,
    );
    utterance.lang = 'zh-CN';
    utterance.rate = 0.95;
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang === 'zh-CN');
    if (voice) utterance.voice = voice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = (event) => {
      setSpeaking(false);
      if (event.error !== 'interrupted' && event.error !== 'canceled')
        setNotice('语音暂不可用，请阅读当前部件的图文讲解。');
    };
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }
  function changeView(next: ViewMode) {
    setView(next);
    sceneRef.current?.setView(next);
  }
  function reset() {
    setExplosion(0);
    setSelected('enclosure');
    setPlaying(false);
    setAutoRotate(false);
    setView('perspective');
    sceneRef.current?.setState({
      ...latest.current,
      explosion: 0,
      selected: 'enclosure',
      autoRotate: false,
    });
    sceneRef.current?.reset();
  }
  function toggleExplosion() {
    setPlaying(false);
    setExplosion(explosion > 50 ? 0 : 100);
    if (explosion > 50) setSelected('enclosure');
  }
  function step(direction: number) {
    setPlaying(false);
    setExplosion(100);
    setSelected(
      parts[Math.max(0, Math.min(parts.length - 1, current + direction))].id,
    );
  }
  function guide() {
    if (playing) {
      setPlaying(false);
      return;
    }
    setExplosion(100);
    setAutoRotate(false);
    if (current === parts.length - 1) setSelected('enclosure');
    setPlaying(true);
  }
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">
            <Layers3 strokeWidth={1.5} />
          </span>
          <span className="brand-name">
            inside<span className="brand-slash">/</span>
            <span className="brand-sub">看见设计的内在</span>
          </span>
        </div>
        <div className="top-meta">
          <span className="local-status">
            <i />
            本地交互体验
          </span>
          <span className="edition">EXPLORATION 001</span>
        </div>
      </header>
      <div className="workspace">
        <section className="explorer" aria-label="三维模型探索">
          <div className="explorer-heading">
            <div>
              <p className="eyebrow">Small footprint. A whole world inside.</p>
              <div className="heading-line">
                <h1>Mac mini</h1>
                <span className="chip-tag">M4</span>
              </div>
              <p className="subhead">2024 · 银色 · 交互式结构探索</p>
            </div>
            <div className="mode-toggle" aria-label="模型状态">
              <button
                aria-pressed={explosion === 0}
                onClick={() => {
                  setExplosion(0);
                  setSelected('enclosure');
                  setPlaying(false);
                }}
              >
                <Box />
                完整外观
              </button>
              <button
                aria-pressed={explosion > 0}
                onClick={() => {
                  setExplosion(100);
                  setPlaying(false);
                }}
              >
                <Layers3 />
                拆解视图
              </button>
            </div>
          </div>
          <div className="stage">
            <div
              className="canvas-host"
              ref={hostRef}
              tabIndex={0}
              role="img"
              aria-label="Mac mini 交互式三维模型。拖动旋转，滚轮缩放。也可使用右侧视角按钮和部件列表。"
              onKeyDown={(e) => {
                if (e.key === '+' || e.key === '=') {
                  e.preventDefault();
                  sceneRef.current?.zoom(1);
                }
                if (e.key === '-') {
                  e.preventDefault();
                  sceneRef.current?.zoom(-1);
                }
                if (e.key === 'Home') {
                  e.preventDefault();
                  reset();
                }
              }}
            />
            {!ready && !error && (
              <div className="loading-state">
                <div className="spinner" />
                <span>正在准备你的 Mac mini…</span>
              </div>
            )}
            {error && (
              <div className="scene-error" role="alert">
                <strong>3D 显示暂不可用</strong>
                <p>{error}</p>
                <p>右侧仍可查看所有部件说明。</p>
                <button
                  className="guide-play"
                  onClick={() => window.location.reload()}
                >
                  重新加载
                </button>
              </div>
            )}
            {parts.map((p) => (
              <button
                key={p.id}
                ref={(el) => {
                  labelRefs.current[p.id] = el;
                }}
                className={`scene-label ${selected === p.id ? 'selected' : ''}`}
                style={{ top: 0, left: 0, opacity: 0, visibility: 'hidden' }}
                onClick={() => pick(p.id)}
              >
                <span />
                {p.name}
              </button>
            ))}
            <div className="view-toolbar" aria-label="视角控制">
              <button
                className={`tool-button ${view === 'perspective' ? 'active' : ''}`}
                title="透视视角"
                aria-label="透视视角"
                onClick={() => changeView('perspective')}
              >
                <Box />
              </button>
              <button
                className={`tool-button ${view === 'front' ? 'active' : ''}`}
                title="前视图"
                aria-label="前视图"
                onClick={() => changeView('front')}
              >
                <Square />
              </button>
              <button
                className={`tool-button ${view === 'back' ? 'active' : ''}`}
                title="后视图"
                aria-label="后视图"
                onClick={() => changeView('back')}
              >
                <Rotate3d />
              </button>
              <button
                className={`tool-button ${view === 'top' ? 'active' : ''}`}
                title="俯视图"
                aria-label="俯视图"
                onClick={() => changeView('top')}
              >
                <Scan />
              </button>
              <span className="toolbar-divider" />
              <button
                className="tool-button"
                title="放大"
                aria-label="放大模型"
                onClick={() => sceneRef.current?.zoom(1)}
              >
                <Plus />
              </button>
              <button
                className="tool-button"
                title="缩小"
                aria-label="缩小模型"
                onClick={() => sceneRef.current?.zoom(-1)}
              >
                <Minus />
              </button>
              <button
                className="tool-button"
                title="视角复位"
                aria-label="视角复位"
                onClick={() => {
                  setView('perspective');
                  sceneRef.current?.reset();
                }}
              >
                <Maximize />
              </button>
            </div>
            <div className="stage-corner">
              <span>APPLE MAC MINI / 2024</span>
              <span>{explosion > 0 ? 'EXPLODED VIEW' : 'ASSEMBLED VIEW'}</span>
            </div>
            <div className="axis" aria-hidden="true">
              <span>x</span>
              <span>y</span>
              <span>z</span>
              <Move3d size={23} strokeWidth={1} />
            </div>
          </div>
          <div className="interact-hint">
            <span>
              <Hand />
              拖拽旋转
            </span>
            <span>
              <Mouse />
              滚轮缩放
            </span>
            <span>
              <MousePointer2 />
              点击部件查看讲解
            </span>
          </div>
          <div className="control-deck">
            <div className="control-top">
              <button className="explode-button" onClick={toggleExplosion}>
                {explosion > 50 ? <Box /> : <Layers3 />}
                {explosion > 50 ? '组装还原' : '一键拆解'}
              </button>
              <div className="slider-group">
                <div className="slider-title">
                  <span id="explosion-label">拆解程度</span>
                  <output>{String(explosion).padStart(3, '0')} %</output>
                </div>
                <Slider
                  className="explosion-slider"
                  aria-labelledby="explosion-label"
                  value={[explosion]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => {
                    setExplosion(Array.isArray(value) ? value[0] : value);
                    setPlaying(false);
                  }}
                />
              </div>
              <button
                className="reset"
                title="全部重置"
                aria-label="全部重置"
                onClick={reset}
              >
                <RotateCcw size={17} />
              </button>
            </div>
            <div className="control-bottom">
              <div className="switches">
                <label className="switch-item">
                  <Switch
                    checked={autoRotate}
                    onCheckedChange={setAutoRotate}
                    size="sm"
                    aria-label="自动旋转"
                  />
                  自动旋转
                </label>
                <label className="switch-item">
                  <Switch
                    checked={labels}
                    onCheckedChange={setLabels}
                    size="sm"
                    aria-label="部件标注"
                  />
                  部件标注
                </label>
              </div>
              <span className="deck-help">从外观，到内部</span>
            </div>
          </div>
          <footer className="explorer-footer">
            <span>结构教学示意 · 非工程图纸或维修指南</span>
            <a
              href="https://support.apple.com/zh-cn/121555"
              target="_blank"
              rel="noreferrer"
            >
              2024 款官方技术规格 ↗
            </a>
          </footer>
        </section>
        <aside className="detail-sidebar" aria-label="拆解讲解">
          <div className="sidebar-heading">
            <h2>探索每一层</h2>
            <span>06 COMPONENTS</span>
          </div>
          <nav className="part-list" aria-label="选择部件">
            {parts.map((p, i) => {
              const Icon = partIcons[i];
              return (
                <button
                  className={`part-row ${selected === p.id ? 'selected' : ''}`}
                  key={p.id}
                  onClick={() => pick(p.id)}
                  aria-pressed={selected === p.id}
                >
                  <span className="part-icon">
                    <Icon strokeWidth={1.5} />
                  </span>
                  <span>
                    <span className="part-name">{p.name}</span>
                    <span className="part-en">{p.en}</span>
                  </span>
                  <span className="part-num">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </button>
              );
            })}
          </nav>
          <article
            className="part-detail"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="detail-category">
              <span>
                <i style={{ background: part.color }} />
                {part.category}
              </span>
              <button
                className={`voice-button ${speaking ? 'active' : ''}`}
                aria-label={speaking ? '停止朗读' : '朗读当前部件讲解'}
                title={speaking ? '停止朗读' : '朗读讲解'}
                onClick={speak}
              >
                {speaking ? <VolumeX /> : <Volume2 />}
              </button>
            </div>
            <h3 className="detail-title">{part.title}</h3>
            <p className="detail-copy">{part.description}</p>
            <dl className="fact-grid">
              {part.facts.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <details className="detail-more" key={selected}>
              <summary>再了解一点</summary>
              <p>{part.detail}</p>
              <p>{part.note}</p>
            </details>
          </article>
          <div className="guide-card">
            <div className="guide-box">
              <div className="guide-head">
                <span>
                  <Play size={14} />
                  逐层讲解
                </span>
                <small>{String(current + 1).padStart(2, '0')} / 06</small>
              </div>
              <div className="guide-dots" aria-hidden="true">
                {parts.map((p, i) => (
                  <span key={p.id} className={i <= current ? 'done' : ''} />
                ))}
              </div>
              <div className="guide-controls">
                <button
                  className="guide-arrow"
                  disabled={current === 0}
                  aria-label="上一个部件"
                  onClick={() => step(-1)}
                >
                  <ChevronLeft />
                </button>
                <button className="guide-play" onClick={guide}>
                  {playing ? <Pause /> : <Play />}
                  {playing
                    ? '暂停导览'
                    : current === 5
                      ? '重新播放导览'
                      : '自动播放导览'}
                </button>
                <button
                  className="guide-arrow"
                  disabled={current === 5}
                  aria-label="下一个部件"
                  onClick={() => step(1)}
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
            <p className="sidebar-note">
              <Info />
              按功能分层展示，部分布局与比例已简化。
            </p>
          </div>
        </aside>
      </div>
      {notice && (
        <div className="toast-status" role="status">
          {notice}
        </div>
      )}
    </main>
  );
}
