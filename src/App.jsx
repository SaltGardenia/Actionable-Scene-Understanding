import "./App.css";
import { Fragment, useEffect, useRef, useState } from "react";
import { TABLES_HTML } from "./tables-html";
import { CONTENT } from "./content";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "abstract", label: "Abstract" },
  { id: "datasets", label: "Datasets & Evaluation", group: "Part I · Foundations" },
  { id: "geometric", label: "Geometric Reconstruction", group: "Part II · Scene Understanding" },
  { id: "semantic", label: "Semantic Understanding", group: "Part II · Scene Understanding" },
  { id: "physical", label: "Physical & Functional", group: "Part II · Scene Understanding" },
  { id: "executable", label: "Executable Manipulation", group: "Part III · Embodiment" },
  { id: "future", label: "Conclusion & Future", group: "Closing" },
  { id: "citation", label: "Citation", group: "Closing" },
];

const BASE = import.meta.env.BASE_URL;
const PAPER_PDF = `${BASE}main.pdf`;
const ARXIV_URL = "https://arxiv.org/abs/0000.00000";
const CODE_URL = "https://github.com/SaltGardenia/Actionable-Scene-Understanding";

const BIBTEX = `@article{li2026actionable,
  title={Actionable Scene Understanding for Indoor Embodied Manipulation: A Survey},
  author={Li, Yaze and Xie, Xinyu and Ma, Jiawei and Song, Siying and Zou, Jianan and Xiao, Haihong and Jia, Wei},
  journal={arXiv preprint},
  year={2026}
}`;

function fig(name) {
  return `${BASE}figures/${name}.png`;
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const targetTop = () =>
    el.getBoundingClientRect().top + window.scrollY - 12;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, targetTop());
    return;
  }
  const startY = window.scrollY;
  const endY = targetTop();
  const dist = endY - startY;
  if (Math.abs(dist) < 2) return;
  const duration = Math.min(900, Math.max(350, Math.abs(dist) * 0.35));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  let start;
  let cancelled = false;
  const cancel = () => {
    cancelled = true;
  };
  // the gesture always wins: any user input hands control back immediately
  window.addEventListener("wheel", cancel, { once: true, passive: true });
  window.addEventListener("touchstart", cancel, { once: true, passive: true });
  window.addEventListener("keydown", cancel, { once: true });
  const step = (ts) => {
    if (cancelled) return;
    if (start === undefined) start = ts;
    const t = Math.min(1, (ts - start) / duration);
    window.scrollTo({ top: startY + dist * easeOut(t), behavior: "instant" });
    if (t < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button className="copy-btn" onClick={onCopy} type="button">
      <ion-icon name={copied ? "checkmark-outline" : "copy-outline"}></ion-icon>
      {copied ? " Copied" : " Copy"}
    </button>
  );
}

// flowing "silk" waves behind the hero — pure SVG, theme-adaptive via CSS vars
// one-point-perspective wireframe scene + point cloud — a nod to the survey's
// subject (3D scene reconstruction -> embodied manipulation), pure SVG
function HeroArt() {
  // [x, y, r, opacity] -- scene points, denser toward the floor
  const dots = [
    [180, 540, 3, 0.5], [320, 610, 4, 0.7], [460, 700, 5, 0.8], [620, 760, 3, 0.6],
    [760, 820, 5, 0.85], [900, 780, 4, 0.7], [1050, 720, 3, 0.6], [1180, 650, 4, 0.75],
    [1320, 590, 3, 0.55], [1450, 540, 2.5, 0.45], [250, 470, 2.5, 0.4], [520, 540, 3, 0.5],
    [700, 590, 2.5, 0.45], [860, 560, 3, 0.5], [990, 610, 3, 0.6], [1240, 760, 4, 0.7],
    [1380, 810, 3, 0.6], [1520, 700, 3, 0.5], [90, 760, 4, 0.65], [390, 830, 5, 0.8],
    [560, 860, 4, 0.7], [1100, 850, 5, 0.8], [1420, 860, 4, 0.7], [640, 500, 2, 0.35],
    [740, 470, 2, 0.3], [930, 480, 2, 0.35], [1060, 520, 2.5, 0.4], [200, 380, 2, 0.3],
    [1400, 420, 2, 0.3], [820, 430, 1.8, 0.25], [300, 560, 2.5, 0.45], [1150, 560, 2.5, 0.45],
    [480, 800, 3, 0.6], [960, 870, 3, 0.6], [1280, 470, 2, 0.3], [100, 600, 2.5, 0.4],
    [1500, 620, 2.5, 0.4], [700, 880, 3, 0.55], [60, 480, 2, 0.3], [1560, 500, 2, 0.3],
  ];
  // accent (semantic / action) points
  const accents = [
    [420, 640, 4, 0.9], [880, 700, 5, 0.9], [1180, 780, 4, 0.85], [260, 720, 3, 0.8],
    [1300, 660, 3, 0.8], [760, 540, 3, 0.7], [1020, 640, 3, 0.7], [540, 470, 2.5, 0.6],
    [940, 430, 2.5, 0.5], [660, 860, 4, 0.85],
  ];
  // floor grid: converging rays + depth-scaled horizontals toward VP (800, 320)
  const rays = [
    [-500, 0.25], [-250, 0.32], [0, 0.4], [250, 0.47], [500, 0.55], [750, 0.6],
    [850, 0.6], [1100, 0.55], [1350, 0.47], [1600, 0.4], [1850, 0.32], [2100, 0.25],
  ];
  const horizontals = [
    [880, 0.966, 0.65], [820, 0.862, 0.58], [765, 0.767, 0.52], [715, 0.681, 0.47],
    [670, 0.603, 0.42], [630, 0.534, 0.37], [595, 0.474, 0.32], [565, 0.422, 0.27],
    [540, 0.379, 0.23], [520, 0.345, 0.19], [505, 0.319, 0.16], [492, 0.297, 0.14],
    [480, 0.276, 0.12], [470, 0.259, 0.11],
  ];
  const ceilings = [
    [20, 0.14, 0.517], [90, 0.19, 0.397], [150, 0.24, 0.293], [200, 0.29, 0.207],
    [240, 0.34, 0.138], [272, 0.39, 0.083], [296, 0.44, 0.041],
  ];
  const VP = 800;
  const HY = 320;
  const W = 1300;
  return (
    <div className="hero-art" aria-hidden="true">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="scene-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>
        <g stroke="var(--scene-line)" strokeWidth="1.8" fill="none" strokeLinecap="round">
          {rays.map(([x, o], i) => (
            <line key={"r" + i} x1={x} y1={900} x2={VP} y2={HY} opacity={o} />
          ))}
          {horizontals.map(([y, s, o], i) => (
            <line key={"h" + i} x1={VP - W * s} y1={y} x2={VP + W * s} y2={y} opacity={o} />
          ))}
          {ceilings.map(([y, o, s], i) => (
            <line key={"c" + i} x1={VP - W * s} y1={y} x2={VP + W * s} y2={y} opacity={o} />
          ))}
          {/* two wireframe volumes resting on the floor */}
          <g opacity={0.7}>
            <path d="M 430 600 L 560 600 L 560 720 L 430 720 Z" />
            <path d="M 470 555 L 600 555 L 600 675 L 470 675 Z" />
            <path d="M 430 600 L 470 555 M 560 600 L 600 555 M 560 720 L 600 675 M 430 720 L 470 675" />
          </g>
          <g opacity={0.65}>
            <path d="M 1050 640 L 1140 640 L 1140 730 L 1050 730 Z" />
            <path d="M 1078 610 L 1168 610 L 1168 700 L 1078 700 Z" />
            <path d="M 1050 640 L 1078 610 M 1140 640 L 1168 610 M 1140 730 L 1168 700 M 1050 730 L 1078 700" />
          </g>
        </g>
        <g fill="var(--scene-dot)">
          {dots.map(([x, y, r, o], i) => (
            <circle key={"d" + i} cx={x} cy={y} r={r} opacity={o} />
          ))}
        </g>
        <g fill="var(--accent)">
          {accents.map(([x, y, r, o], i) => (
            <circle key={"a" + i} cx={x} cy={y} r={r} opacity={o} filter="url(#scene-soft)" />
          ))}
        </g>
      </svg>
    </div>
  );
}

function SideToc({ sections, activeId, entered }) {
  const listRef = useRef(null);
  const [indicator, setIndicator] = useState({ y: 0, h: 0 });

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector(`[data-id="${activeId}"]`);
    if (active) setIndicator({ y: active.offsetTop, h: active.offsetHeight });
  }, [activeId]);

  return (
    <aside
      className={`toc-rail${entered ? " is-entered" : ""}`}
      aria-label="Table of contents"
      aria-hidden={!entered}
    >
      <div className="toc-rail__inner" ref={listRef}>
        <span
          className="toc-rail__indicator"
          style={{
            transform: `translateY(${indicator.y}px)`,
            height: `${indicator.h}px`,
          }}
          aria-hidden="true"
        />
        {sections.map((s, i) => (
          <Fragment key={s.id}>
            {s.group && sections[i - 1]?.group !== s.group && (
              <p className="toc-rail__group">{s.group}</p>
            )}
            <a
              href={`#${s.id}`}
              data-id={s.id}
              className={`toc-rail__link${activeId === s.id ? " is-active" : ""}`}
              tabIndex={entered ? 0 : -1}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(s.id);
              }}
            >
              <span className="toc__dot" />
              {s.label}
            </a>
          </Fragment>
        ))}
      </div>
    </aside>
  );
}

function Lightbox({ src, caption, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    const onScroll = () => onClose();
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [onClose]);

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Figure preview"
      onClick={onClose}
    >
      <button
        type="button"
        className="lightbox__close"
        aria-label="Close"
        onClick={onClose}
      >
        <ion-icon name="close-outline"></ion-icon>
      </button>
      <img
        className="lightbox__img"
        src={src}
        alt={typeof caption === "string" ? caption : "figure"}
        onClick={(e) => e.stopPropagation()}
      />
      {caption && <figcaption className="lightbox__caption">{caption}</figcaption>}
    </div>
  );
}

function PdfFigure({ src, caption, onOpen }) {
  const clickable = !!onOpen;
  const open = () => onOpen && onOpen(src, caption);
  return (
    <figure
      data-reveal
      className={`pdf-figure${clickable ? " is-clickable" : ""}`}
      onClick={clickable ? open : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open();
              }
            }
          : undefined
      }
    >
      <div className="pdf-frame">
        <img src={src} alt={caption || "figure"} loading="lazy" />
        {clickable && (
          <span className="pdf-figure__zoom" aria-hidden="true">
            <ion-icon name="expand-outline"></ion-icon>
          </span>
        )}
      </div>
      {caption && (
        <figcaption className="pdf-figure__caption content is-size-6 has-text-left">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function HtmlTable({ table }) {
  return (
    <figure data-reveal className="paper-table">
      <div className="paper-table__head">Table {table.index}</div>
      <div
        className="paper-table__body"
        id={`tbl-${table.index}`}
        dangerouslySetInnerHTML={{ __html: table.html }}
      />
      {table.caption && (
        <figcaption
          className="paper-table__caption content is-size-6 has-text-left"
          dangerouslySetInnerHTML={{ __html: table.caption }}
        />
      )}
      {table.index === 1 && (
        <div className="paper-table__legend content is-size-7 has-text-left">
          <span className="legend-item">
            <span className="legend-mark yes">✓</span> Supported
          </span>
          <span className="legend-item">
            <span className="legend-mark no">✗</span> Not supported
          </span>
        </div>
      )}
    </figure>
  );
}

// single extracted table by its number
function Table({ n }) {
  return TABLES_HTML.filter((t) => t.index === n).map((t) => (
    <HtmlTable key={t.index} table={t} />
  ));
}

function SectionTitle({ id, children }) {
  return (
    <p
      id={id}
      data-reveal
      className="title is-3 mt-6 section-title"
    >
      {children}
    </p>
  );
}

function ProseBlock({ block }) {
  if (block.kind === "p") {
    return (
      <p
        data-reveal
        className="prose-p"
        dangerouslySetInnerHTML={{ __html: block.html }}
      />
    );
  }
  const Tag = block.kind;
  return (
    <Tag data-reveal className={`prose-${block.kind}`}>
      {block.text}
    </Tag>
  );
}

// renders the extracted prose of a section with media interleaved at
// positions in the flow: media = [{ after: <block index>, node: <jsx> }]
function SectionBody({ id, media = [] }) {
  const blocks = CONTENT[id]?.blocks ?? [];
  const at = {};
  media.forEach((m, j) => {
    const idx = Math.min(Math.max(m.after, 0), blocks.length - 1);
    (at[idx] = at[idx] || []).push(<Fragment key={"m" + j}>{m.node}</Fragment>);
  });
  return (
    <>
      {blocks.map((b, i) => (
        <Fragment key={i}>
          <ProseBlock block={b} />
          {at[i]}
        </Fragment>
      ))}
    </>
  );
}

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      type="button"
      className={`back-to-top${show ? " is-visible" : ""}`}
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ion-icon name="arrow-up-outline"></ion-icon>
    </button>
  );
}

export default function App() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const [lightbox, setLightbox] = useState(null);
  const [tocEntered, setTocEntered] = useState(false);
  const bodyRef = useRef(null);
  const heroRef = useRef(null);

  // gentle reveal-on-scroll for article blocks (the hero -> reading transition)
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-revealed");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.04 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const threshold = window.innerHeight * 0.3;
      const bodyEl = bodyRef.current;
      if (bodyEl) {
        const top = bodyEl.getBoundingClientRect().top;
        setTocEntered(top <= 80);
        // rail chrome follows the scroll 1:1: the tint and divider of the
        // reading layout emerge vertically while the body scrolls into view
        const vh = window.innerHeight;
        const p = Math.min(1, Math.max(0, (vh * 0.25 - top) / (vh * 0.25)));
        document.documentElement.style.setProperty("--rail-chrome", p.toFixed(3));
      }
      // scroll-linked hero fade: tracks the scroll position 1:1, fully
      // reversible, and hands control back to the user at any instant
      const heroEl = heroRef.current;
      if (heroEl) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const y = window.scrollY;
        const range = window.innerHeight * 0.55;
        const p = Math.min(1, Math.max(0, y / range));
        if (reduce) {
          heroEl.style.opacity = p >= 1 ? "0" : "1";
          heroEl.style.transform = "none";
        } else {
          heroEl.style.opacity = String(1 - p);
          heroEl.style.transform = `translateY(${y * -0.08}px) scale(${1 - p * 0.05})`;
        }
        heroEl.style.pointerEvents = p >= 1 ? "none" : "";
      }
      const scrolledToBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      let current = SECTIONS[0].id;
      if (scrolledToBottom) {
        current = SECTIONS[SECTIONS.length - 1].id;
      } else {
        for (const s of SECTIONS) {
          const el = document.getElementById(s.id);
          if (el && el.getBoundingClientRect().top - threshold <= 0) {
            current = s.id;
          } else {
            break;
          }
        }
      }
      setActiveId(current);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const openLightbox = (src, caption) => setLightbox({ src, caption });

  return (
    <>
      <BackToTop />
      <section className="section hero-section">
        <HeroArt />
        <div className="hero-scrim" aria-hidden="true" />
        <div className="container has-text-centered hero-fade" ref={heroRef}>
          <p className="title is-3 paper-title reveal">
            Actionable Scene Understanding for Indoor
            <br className="hero-title-br" />
            {" "}Embodied Manipulation: A Survey
          </p>

          <p className="subtitle is-5 paper-venue reveal d1">Preprint &middot; 2026</p>

          <p className="title is-5 mt-2 authors reveal d2">
            <a href="https://saltgardenia.github.io/" target="_blank" rel="noreferrer">Yaze Li</a>
            <sup>1,&dagger;</sup>,{" "}
            <a href="mailto:2024218501@mail.hfut.edu.cn" target="_blank" rel="noreferrer">Xinyu Xie</a>
            <sup>1,&dagger;</sup>,{" "}
            <a href="mailto:jiawei@hfut.edu.cn" target="_blank" rel="noreferrer">Jiawei Ma</a>
            <sup>1,&dagger;</sup>,{" "}
            <a href="mailto:2024218492@mail.hfut.edu.cn" target="_blank" rel="noreferrer">Siying Song</a>
            <sup>1,&dagger;</sup>,{" "}
            <a href="mailto:aujazou@mail.scut.edu.cn" target="_blank" rel="noreferrer">Jianan Zou</a>
            <sup>2</sup>,{" "}
            <a href="mailto:haihong@mail.hfut.edu.cn" target="_blank" rel="noreferrer">Haihong Xiao</a>
            <sup>1,*</sup>,{" "}
            <a href="mailto:weijia@mail.hfut.edu.cn" target="_blank" rel="noreferrer">Wei Jia</a>
            <sup>1</sup>
          </p>

          <p className="subtitle is-6 affiliation reveal d3">
            <sup>1</sup> School of Computer Science and Information Engineering,
            Hefei University of Technology, Hefei, China
            <br />
            <sup>2</sup> School of Automation Science and Engineering, South
            China University of Technology, Guangzhou, China
            <br />
            <span className="muted">
              <sup>&dagger;</sup> Equal contribution &nbsp;&middot;&nbsp;{" "}
              <sup>*</sup> Corresponding author
            </span>
          </p>

          <div className="is-flex is-justify-content-center is-flex-wrap-wrap link-row reveal d4">
            <span className="icon-text mx-1">
              <a className="button is-dark" href={PAPER_PDF} target="_blank" rel="noreferrer">
                <span className="icon">
                  <ion-icon name="document-outline"></ion-icon>
                </span>
                <span> Paper </span>
              </a>
            </span>
            <span className="icon-text mx-1">
              <a className="button is-dark" href={ARXIV_URL} target="_blank" rel="noreferrer">
                <span className="icon">
                  <ion-icon name="library-outline"></ion-icon>
                </span>
                <span> arXiv </span>
              </a>
            </span>
            <span className="icon-text mx-1">
              <a className="button is-dark" href={CODE_URL} target="_blank" rel="noreferrer">
                <span className="icon">
                  <ion-icon name="logo-github"></ion-icon>
                </span>
                <span> Code </span>
              </a>
            </span>
            <span className="icon-text mx-1">
              <a className="button is-dark" href="#citation" rel="noreferrer">
                <span className="icon">
                  <ion-icon name="copy-outline"></ion-icon>
                </span>
                <span> Cite </span>
              </a>
            </span>
          </div>
        </div>
      </section>

      <div className="body-layout" ref={bodyRef}>
        <SideToc sections={SECTIONS} activeId={activeId} entered={tocEntered} />
        <main className="body-main">
          <div className="body-main__inner">
            <div id="overview" className="anchor-section">
              <PdfFigure
                label="Unified Framework"
                src={fig("fig_framework")}
                ratio={1.55}
                caption={
                  <span>
                    <b>
                      A comprehensive view of actionable scene understanding for embodied manipulation.
                      We organize existing research around a shared foundation of datasets and simulation
                      environments and four complementary aspects of scene understanding: geometric
                      reconstruction establishes spatial structure and answers where; semantic
                      understanding identifies objects, attributes, and relations and answers what;
                      functional and physical understanding characterizes object functions, affordances,
                      and physical constraints and addresses how; and task-oriented action connects
                      scene understanding to task-relevant navigation and manipulation, addressing where
                      to go and what to do. Together, these aspects extend scene understanding from
                      describing the environment to supporting task-relevant actions in embodied
                      settings.
                    </b>{" "}
                  </span>
                }
                onOpen={openLightbox}
              />
            </div>

            <SectionTitle id="abstract">Abstract</SectionTitle>
            <p className="content has-text-left abstract" data-reveal>
            Scene understanding for embodied manipulation must extend beyond describing
            what exists in an environment to representing what can be acted upon, under
            which physical constraints, and with what consequences. Existing surveys have
            largely examined geometric reconstruction, semantic understanding, functional
            reasoning, or embodied intelligence as separate research directions, leaving their
            roles in task-oriented behavior insufficiently characterized. This survey presents
            a unified perspective on actionable scene understanding for embodied manipulation,
            where scene knowledge is organized according to its utility for task-conditioned
            perception, physical reasoning, prediction, and action. We distinguish conventional
            scene understanding, which primarily recovers geometric and semantic structure,
            from actionable scene understanding, which additionally incorporates functional
            affordances, physical properties and constraints, causal relations, and state
            evolution. From this perspective, we review datasets and evaluation protocols,
            geometric reconstruction, semantic understanding, physical and functional
            understanding, and embodied scene modeling, while examining the gap between
            perceptual fidelity and executable behavior. We further identify emerging directions
            toward latent physical-state inference, interaction-driven scene updating, persistent
            predictive scene modeling, and human-aware embodied understanding. By connecting
            scene representation with action-conditioned prediction and closed-loop behavior,
            this survey aims to provide a systematic view of how 3D scene understanding can
            evolve from descriptive reconstruction toward executable scene knowledge.
          </p>

            <SectionTitle id="datasets">Datasets & Evaluation Metrics</SectionTitle>
            <SectionBody
              id="datasets"
              media={[
                { after: 0, node: <Table n={1} /> },
                { after: 10, node: <Table n={2} /> },
                { after: 13, node: <Table n={3} /> },
              ]}
            />

            <SectionTitle id="geometric">Geometric Reconstruction</SectionTitle>
            <SectionBody
              id="geometric"
              media={[
                {
                  after: 1,
                  node: (
                    <PdfFigure
                      label="Taxonomy & Evolution"
                      src={fig("fig2")}
                      ratio={1.5}
                      caption={
                        `Taxonomy and chronological evolution of indoor scene reconstruction. Offline
                        reconstruction, feed-forward reconstruction, and online reconstruction are
                        organized as the three major paradigms, with representative methods arranged
                        chronologically within their corresponding technical families.`
                      }
                      onOpen={openLightbox}
                    />
                  ),
                },
                {
                  after: 3,
                  node: (
                    <PdfFigure
                      label="Representative Results"
                      src={fig("fig3v12")}
                      ratio={1.5}
                      caption={
                        `Representative examples of offline, feed-forward, and online 3D reconstruction
                        paradigms.`
                      }
                      onOpen={openLightbox}
                    />
                  ),
                },
              ]}
            />

            <SectionTitle id="semantic">Semantic Understanding</SectionTitle>
            <SectionBody
              id="semantic"
              media={[
                {
                  after: 1,
                  node: (
                    <PdfFigure
                      label="Semantic Evolution"
                      src={fig("semantic_evo")}
                      ratio={1.5}
                      caption={
                        <span>
                          The four-layer bottom-up framework progressively transforms
                          reconstructed 3D geometry into structured semantic
                          representations, evolving from object-level perception and
                          relational modeling to open-vocabulary semantic understanding
                          and unified geometry&ndash;semantic representation. It
                          establishes the semantic foundation for subsequent physical and
                          functional reasoning, thereby bridging geometric scene
                          reconstruction and actionable scene understanding for embodied
                          manipulation.
                        </span>
                      }
                      onOpen={openLightbox}
                    />
                  ),
                },
                { after: 7, node: <Table n={4} /> },
              ]}
            />

            <SectionTitle id="physical">Physical & Functional Understanding</SectionTitle>
            <SectionBody
              id="physical"
              media={[
                {
                  after: 1,
                  node: (
                    <PdfFigure
                      label="Physical & Functional Taxonomy"
                      src={fig("fig4b")}
                      ratio={1.4}
                      caption={
                        `Taxonomy of physical and functional understanding. Existing studies
                        can be broadly organized into physical property estimation,
                        affordance reasoning, physical causal reasoning, and physical
                        consistency verification. Physical property estimation focuses on
                        object attributes such as material, mass, rigidity, and
                        deformability. Affordance reasoning identifies feasible
                        interaction regions and action modes. Physical causal reasoning
                        predicts action-induced changes, temporal dynamics, and
                        counterfactual outcomes. Physical consistency verification
                        evaluates whether reconstructed or generated states satisfy
                        physical constraints and can support executable simulation.
                        Representative studies include PhysX-3D, Where2Act, CLEVRER and
                        CausalVQA, and PhyGenBench. The figure is a conceptual synthesis
                        of these research directions.`
                      }
                      onOpen={openLightbox}
                    />
                  ),
                },
                {
                  after: 8,
                  node: (
                    <PdfFigure
                      label="Observation to Manipulation"
                      src={fig("fig4a")}
                      ratio={1.4}
                      caption={
                        `From multimodal scene observation to physically grounded robot
                        manipulation. Multimodal observations provide visual, geometric,
                        and linguistic information, which is organized into object-centric
                        representations containing geometry, semantics, and physical cues.
                        Physical understanding estimates properties such as appearance,
                        material, mass, and dynamics, while manipulation affordance
                        associates these properties with feasible actions including
                        grasping, pushing, pulling, lifting, and placing. The resulting
                        actionable representation combines geometry, semantics, physical
                        properties, and affordance modes for downstream robot
                        manipulation. Representative formulations are discussed in
                        PhysX-3D, Where2Act, RoboPoint, and PhysX-Anything. The figure is
                        a conceptual synthesis of these research directions.`
                      }
                      onOpen={openLightbox}
                    />
                  ),
                },
                { after: 22, node: <Table n={5} /> },
              ]}
            />

            <SectionTitle id="executable">Executable Embodied Manipulation</SectionTitle>
            <SectionBody
              id="executable"
              media={[
                {
                  after: 2,
                  node: (
                    <PdfFigure
                      label="Embodied Intelligence"
                      src={fig("fig_embodied_intelligence")}
                      ratio={1.5}
                      caption={
                        `Taxonomy of representative paradigms in embodied intelligence.
                        Existing approaches span vision-language understanding,
                        language-guided navigation, vision-language-action execution,
                        predictive world modeling, and unified embodied intelligence,
                        providing complementary capabilities for semantic understanding,
                        spatial reasoning, action generation, prediction, and physical
                        interaction.`
                      }
                      onOpen={openLightbox}
                    />
                  ),
                },
                { after: 12, node: <Table n={6} /> },
                {
                  after: 26,
                  node: (
                    <PdfFigure
                      label="Unified Modeling"
                      src={fig("embodied_unified_modeling")}
                      ratio={1.5}
                      caption={
                        `Overview of representative paradigms toward unified embodied
                        intelligence. VLMs provide visual-language understanding, VLNs
                        enable language-guided navigation, VLAs connect multimodal
                        observations with executable actions, and world-action models
                        introduce predictive modeling capabilities. These paradigms
                        progressively converge toward unified embodied foundation models
                        that integrate perception, reasoning, prediction, and action
                        generation in closed-loop interaction.`
                      }
                      onOpen={openLightbox}
                    />
                  ),
                },
              ]}
            />

            <SectionTitle id="future">Conclusion & Future Directions</SectionTitle>
            <SectionBody
              id="future"
              media={[
                {
                  after: 5,
                  node: (
                    <PdfFigure
                      label="Future Directions"
                      src={fig("fig_future_directions")}
                      ratio={1.3}
                      caption={
                        `Four future directions for embodied indoor scene understanding:
                        (a) from visible reconstruction to inference of latent
                        environmental states; (b) from passive perception to physically
                        grounded self-supervision; (c) from environment-centric modeling
                        to human-state-aware scene understanding; and (d) from
                        task-oriented execution to human-centered embodied intelligence.
                        Together, these directions shift indoor scene modeling toward
                        dynamic, physically grounded, and human-centered representations
                        that support reliable embodied behavior.`
                      }
                      onOpen={openLightbox}
                    />
                  ),
                },
              ]}
            />

            <div className="card mt-6 cite-card" id="citation" data-reveal>
            <header className="card-header">
              <p className="card-header-title">Citation</p>
              <CopyButton text={BIBTEX} />
            </header>
            <div className="card-content has-text-left">
              <pre className="bibtex">
                <code>{BIBTEX}</code>
              </pre>
            </div>
          </div>

          <p className="footer-note mt-6">
            &copy; 2026 Survey Project Page &middot; Built with React & Bulma,
            inspired by the DreamGaussian project page.
          </p>
          </div>
        </main>
      </div>

      {lightbox && (
        <Lightbox
          src={lightbox.src}
          caption={lightbox.caption}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}