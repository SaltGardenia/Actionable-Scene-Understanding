import "./App.css";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TABLES_HTML } from "./tables-html";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "abstract", label: "Abstract" },
  { id: "datasets", label: "Datasets & Evaluation" },
  { id: "geometric", label: "Geometric Reconstruction" },
  { id: "semantic", label: "Semantic Understanding" },
  { id: "physical", label: "Physical & Functional" },
  { id: "executable", label: "Executable Manipulation" },
  { id: "future", label: "Conclusion & Future" },
  { id: "citation", label: "Citation" },
];

const BASE = import.meta.env.BASE_URL;
const PAPER_PDF = `${BASE}main.pdf`;
const ARXIV_URL = "https://arxiv.org/abs/0000.00000";
const CODE_URL = "https://github.com/SaltGardenia/Actionable-Scene-Understanding";

const BIBTEX = `@article{li2026actionable,
  title={From Geometric Reconstruction to Actionable Scene Understanding for Embodied Manipulation: A Survey},
  author={Li, Yaze and Xie, Xinyu and Ma, Jiawei and Song, Siying and Xiao, Haihong},
  journal={arXiv preprint},
  year={2026}
}`;

function fig(name) {
  return `${BASE}figures/${name}.png`;
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
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

function ProgressBar() {
  const barRef = useRef(null);
  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const el = barRef.current;
      if (!el) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.transform = `scaleX(${p})`;
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
  return (
    <div className="progress" aria-hidden="true">
      <div className="progress__bar" ref={barRef} />
    </div>
  );
}

function SideToc({ sections, activeId }) {
  return (
    <nav className="toc-side" aria-label="Table of contents">
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={`toc-side__link${activeId === s.id ? " is-active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            scrollToSection(s.id);
          }}
        >
          <span className="toc__dot" />
          {s.label}
        </a>
      ))}
    </nav>
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

function fixDatasetHeader(html) {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const tableEl = doc.querySelector("table");
    const thead = tableEl && tableEl.querySelector("thead");
    const tbody = tableEl && tableEl.querySelector("tbody");
    if (thead && tbody) {
      const firstRow = tbody.querySelector("tr");
      if (firstRow) {
        const subHeader = doc.createElement("tr");
        firstRow.querySelectorAll("td").forEach((td) => {
          if (td.textContent.trim() !== "") subHeader.appendChild(td);
        });
        thead.appendChild(subHeader);
        firstRow.remove();
      }
      return tableEl.outerHTML;
    }
  } catch {
    /* fall back to original markup */
  }
  return html;
}

function HtmlTable({ table }) {
  const bodyRef = useRef(null);
  const tableHtml =
    table.index === 1 ? fixDatasetHeader(table.html) : table.html;

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el || table.index !== 1) return;
    const measure = () => {
      const tr = el.querySelector("thead tr:first-child");
      if (tr) el.style.setProperty("--header-h", `${tr.offsetHeight}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [table.index, tableHtml]);

  return (
    <figure className="paper-table">
      <div className="paper-table__head">Table {table.index}</div>
      <div
        ref={bodyRef}
        className="paper-table__body"
        id={`tbl-${table.index}`}
        dangerouslySetInnerHTML={{ __html: tableHtml }}
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

function TablesForSection({ section }) {
  return TABLES_HTML.filter((t) => t.section === section).map((t) => (
    <HtmlTable key={t.index} table={t} />
  ));
}

function SectionTitle({ id, children }) {
  return (
    <p
      id={id}
      className="title is-3 mt-6 has-text-centered section-title"
    >
      {children}
    </p>
  );
}

function SectionIntro({ children }) {
  return (
    <p className="content has-text-centered is-size-5 section-intro">
      {children}
    </p>
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

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const threshold = window.innerHeight * 0.3;
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
      <ProgressBar />
      <SideToc sections={SECTIONS} activeId={activeId} />
      <BackToTop />
      <section className="section">
        <div className="container has-text-centered">
          <p className="title is-3 paper-title reveal">
            Actionable Scene Understanding for Embodied Manipulation: A Survey
          </p>

          <p className="subtitle is-5 paper-venue reveal d1">Preprint &middot; 2026</p>

          <p className="title is-5 mt-2 authors reveal d2">
            <a href="https://saltgardenia.github.io/" target="_blank" rel="noreferrer">Yaze Li</a>
            <sup>&dagger;</sup>,{" "}
            <a href="mailto:2024218501@mail.hfut.edu.cn" target="_blank" rel="noreferrer">Xinyu Xie</a>
            <sup>&dagger;</sup>,{" "}
            <a href="mailto:2024218545@mail.hfut.edu.cn" target="_blank" rel="noreferrer">Jiawei Ma</a>
            <sup>&dagger;</sup>,{" "}
            <a href="mailto:2024218492@mail.hfut.edu.cn" target="_blank" rel="noreferrer">Siying Song</a>
            <sup>&dagger;</sup>,{" "}
            <a href="mailto:jiananzou@example.com" target="_blank" rel="noreferrer">Jianan Zou</a>,{" "}
            <a href="mailto:haihong@mail.hfut.edu.cn" target="_blank" rel="noreferrer">Haihong Xiao</a>
            <sup>*</sup>,{" "}
            <a href="mailto:weijia@mail.hfut.edu.cn" target="_blank" rel="noreferrer">Wei Jia</a>
          </p>

          <p className="subtitle is-6 affiliation reveal d3">
            School of Computer Science and Information Engineering, Hefei University
            of Technology, Hefei, China
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

        <div className="container is-max-desktop has-text-centered">
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
          <p className="content is-size-6 has-text-left abstract">
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
          <SectionIntro>
            Datasets and evaluation protocols determine not only which capabilities can be
            learned, but also which aspects of scene understanding are considered successful.
            Early indoor scene understanding benchmarks primarily evaluated geometric
            reconstruction and localization, followed by semantic and instance-level
            interpretation. More recent datasets incorporate functional parts, articulated
            structures, interaction affordances, physical properties, temporal states, and
            task-oriented supervision. This evolution reflects a broader shift from static
            scene description toward embodied behavior. However, the capability layers are
            still commonly annotated and evaluated in isolation. A central question for
            actionable scene understanding is therefore not only which datasets or metrics
            are available, but whether their supervision and evaluation preserve the
            information required for downstream action. In this section, we provide a
            comprehensive overview of existing datasets and their commonly adopted evaluation
            protocols. We then discuss emerging evaluation directions and our preliminary
            reflections on designing metrics that better reflect actionability.
          </SectionIntro>
          <TablesForSection section="datasets" />

          <SectionTitle id="geometric">Geometric Reconstruction</SectionTitle>
          <SectionIntro>
            We survey geometric reconstruction methods, covering offline optimization,
            feed-forward prediction, and online mapping, tracing their chronological
            evolution from explicit geometry to continuous, feed-forward scene
            representations.
          </SectionIntro>
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

          <SectionTitle id="semantic">Semantic Understanding</SectionTitle>
          <SectionIntro>
            Reconstructed geometry is progressively transformed into structured semantic
            representations—from object-level perception and relational modeling to
            open-vocabulary understanding and unified geometry–semantic representations.
          </SectionIntro>
          <TablesForSection section="semantic" />
          <PdfFigure
            label="Semantic Evolution"
            src={fig("semantic_evo")}
            ratio={1.5}
            caption={
              <span>
                This four-layer bottom-up framework progressively transforms reconstructed
                3D geometry into structured semantic representations, evolving from
                object-level perception and relational modeling to open-vocabulary semantic
                understanding and unified geometry–semantic representation. It establishes
                the semantic foundation for subsequent physical and functional reasoning,
                thereby bridging geometric scene reconstruction and actionable scene
                understanding for embodied manipulation.
              </span>
            }
            onOpen={openLightbox}
          />

          <SectionTitle id="physical">Physical & Functional Understanding</SectionTitle>
          <SectionIntro>
            Beyond appearance and semantics, agents must reason about physical properties,
            affordances, interaction consequences, and physical consistency to act reliably
            in the real world.
          </SectionIntro>
          <TablesForSection section="physical" />
          <PdfFigure
            label="Pipeline"
            src={fig("fig4b")}
            ratio={1.4}
            caption={
              `Pipeline for generating physically grounded, simulation-ready object
              representations from visual observations.`
            }
            onOpen={openLightbox}
          />
          <PdfFigure
            label="Conceptual Framework"
            src={fig("fig4a")}
            ratio={1.4}
caption={
               `Conceptual framework for physical and functional understanding of indoor
               scenes.`
             }
            onOpen={openLightbox}
          />

          <SectionTitle id="executable">Executable Embodied Manipulation</SectionTitle>
          <SectionIntro>
            The upper layers integrate multimodal reasoning, spatial and task-level decision
            making, action generation, and predictive modeling into unified embodied agents
            that close the perception–action loop.
          </SectionIntro>
          <TablesForSection section="embodied" />
          <PdfFigure
            label="Embodied Intelligence"
            src={fig("fig_embodied_intelligence")}
            ratio={1.5}
caption={
               `Executable embodied manipulation integrates multimodal scene reasoning,
               decision making, action generation, and predictive modeling into a closed
               perception–action loop.`
             }
            onOpen={openLightbox}
          />
          <PdfFigure
            label="Unified Modeling"
            src={fig("embodied_unified_modeling")}
            ratio={1.5}
caption={
               `Unified embodied modeling toward generalist embodied agents that map
               multimodal perception to manipulation.`
             }
            onOpen={openLightbox}
          />

          <SectionTitle id="future">Conclusion & Future Directions</SectionTitle>
          <SectionIntro>
            We highlight four emerging directions toward more capable scene representations:
            inferring invisible states from visual observations, acquiring physical
            knowledge through self-supervision, modeling latent human states, and shifting
            from task completion to human-centered assistance. Collectively, these directions
            point toward scene understanding that is geometrically and semantically grounded,
            physically consistent, context-aware, and adaptive to complex real-world
            environments.
          </SectionIntro>
          <PdfFigure
            label="Future Directions"
            src={fig("fig_future_directions")}
            ratio={1.3}
caption={
               `Four future directions for embodied indoor scene understanding: inferring
               invisible environmental states, learning through physical self-supervision,
               modeling latent human states, and extending embodied intelligence from task
               completion toward human empowerment.`
             }
            onOpen={openLightbox}
          />

          <div className="card mt-6 cite-card" id="citation">
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
      </section>

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