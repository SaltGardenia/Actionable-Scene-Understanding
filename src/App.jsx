import "./App.css";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CATEGORIES, REFS } from "./refs";
import { FIG_DIMS } from "./fig-dimensions";
import { TABLES_HTML } from "./tables-html";
import { linkifyTableHtml } from "./table-links";

const BASE = import.meta.env.BASE_URL;
const ARXIV_URL = "https://arxiv.org/abs/0000.00000";
const CODE_URL = "https://github.com/SaltGardenia/Actionable-Scene-Understanding";

const BIBTEX = `@article{li2026actionable,
  title={Actionable Scene Understanding for Indoor Embodied Manipulation: A Survey},
  author={Li, Yaze and Xie, Xinyu and Ma, Jiawei and Song, Siying and Zou, Jianan and Xiao, Haihong and Jia, Wei},
  journal={arXiv preprint},
  year={2026}
}`;

// tabs: overview -> five capability-layer figure/table pages -> references
const TABS = [
  { id: "overview", label: "Overview" },
  ...CATEGORIES.map((c) => ({ id: c.id, label: c.label.split(" ")[0] })),
  { id: "references", label: "References" },
];

const fig = (name) => `${BASE}figures/${name}.png`;

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    el.scrollIntoView({ block: "start" });
    return;
  }
  el.scrollIntoView({ behavior: "smooth", block: "start" });
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

function Blobs() {
  return (
    <div className="hero-blobs" aria-hidden="true">
      <span className="blob blob-a" />
      <span className="blob blob-b" />
      <span className="blob blob-c" />
    </div>
  );
}

function Navbar({ tab, onTabClick, query, onQuery, theme, onThemeToggle }) {
  const navRef = useRef(null);
  const indicatorRef = useRef(null);

  function updateIndicator() {
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    if (!nav || !indicator) return;
    const active = nav.querySelector("a.active");
    if (!active) {
      indicator.style.opacity = "0";
      return;
    }
    indicator.style.width = active.offsetWidth + "px";
    indicator.style.height = active.offsetHeight + "px";
    indicator.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
    indicator.style.opacity = "1";
  }

  useEffect(() => {
    updateIndicator();
    const onResize = () => updateIndicator();
    window.addEventListener("resize", onResize);
    const raf = requestAnimationFrame(updateIndicator);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [tab]);

  return (
    <header className="top-nav" aria-label="Main navigation">
      <nav ref={navRef} className="top-nav-inner nav-pill">
        <span ref={indicatorRef} className="nav-indicator" aria-hidden="true" />
        {TABS.map((t) => (
          <a
            key={t.id}
            href={"#tab-" + t.id}
            className={`nav-link${tab === t.id ? " active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              onTabClick(t.id);
            }}
          >
            {t.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

function ThemeFab({ theme, onToggle }) {
  return (
    <button
      type="button"
      className="theme-fab"
      onClick={onToggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <ion-icon name={theme === "dark" ? "sunny-outline" : "moon-outline"}></ion-icon>
    </button>
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

function PdfFigure({ src, caption }) {
  const file = src.split("/").pop();
  const dim = FIG_DIMS[file];
  return (
    <figure className="pdf-figure">
      <div className="pdf-frame">
        <img
          src={src}
          alt={typeof caption === "string" ? caption : "figure"}
          width={dim?.w}
          height={dim?.h}
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="pdf-figure__caption">{caption}</figcaption>
      )}
    </figure>
  );
}

function HtmlTable({ table }) {
  return (
    <figure className="paper-table">
      <div className="paper-table__head">Table {table.index}</div>
      <div
        className="paper-table__body"
        id={`tbl-${table.index}`}
        dangerouslySetInnerHTML={{ __html: linkifyTableHtml(table.html, table.index) }}
      />
      {table.caption && (
        <figcaption
          className="paper-table__caption"
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

function Table({ n }) {
  return TABLES_HTML.filter((t) => t.index === n).map((t) => (
    <HtmlTable key={t.index} table={t} />
  ));
}

function CiteCard() {
  return (
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
  );
}

export default function App() {
  const [tab, setTab] = useState("overview");
  const [refCat, setRefCat] = useState("all");
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const pendingScrollRef = useRef(false);
  const pendingCiteRef = useRef(false);

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const nav = document.querySelector(".top-nav");
    const navH = nav ? nav.offsetHeight : 0;
    const top = el.getBoundingClientRect().top + window.scrollY - navH - 12;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
  };

  const scrollToContentLanding = (smooth = true) => {
    // land exactly where the sticky nav pins to the viewport top — identical
    // for every tab. The sticky nav's rect.top is 0 while pinned, so measure
    // the in-flow #content section instead: its document offset never
    // depends on scrollY.
    const content = document.getElementById("content");
    const nav = document.querySelector(".top-nav");
    if (!content || !nav) return;
    const navTop =
      content.getBoundingClientRect().top + window.scrollY - nav.offsetHeight;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: Math.max(0, navTop),
      behavior: smooth && !reduce ? "smooth" : "auto",
    });
  };

  // Commit the landing scroll inside the same layout pass as the tab swap, so
  // the browser's clamped intermediate scroll position is never painted.
  useLayoutEffect(() => {
    if (pendingCiteRef.current) {
      pendingCiteRef.current = false;
      scrollToId("citation");
      return;
    }
    if (!pendingScrollRef.current) return;
    pendingScrollRef.current = false;
    scrollToContentLanding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleTabClick = (id) => {
    if (id === tab) {
      scrollToContentLanding();
      return;
    }
    pendingScrollRef.current = true;
    setTab(id);
  };

  // The hero Cite button jumps to the citation block at the bottom of the
  // Overview page, switching to that tab first when needed.
  const handleCiteClick = () => {
    if (tab === "overview") {
      scrollToId("citation");
      return;
    }
    pendingCiteRef.current = true;
    setTab("overview");
  };

  const q = query.trim().toLowerCase();
  const filtered = REFS.filter(
    (r) =>
      (refCat === "all" || r.category === refCat) &&
      (!q || `${r.title} ${r.authors} ${r.venue} ${r.year}`.toLowerCase().includes(q))
  );
  const groups = CATEGORIES.map((c) => ({
    ...c,
    items: filtered.filter((r) => r.category === c.id),
  })).filter((g) => g.items.length > 0);
  const countByCat = Object.fromEntries(
    CATEGORIES.map((c) => [c.id, REFS.filter((r) => r.category === c.id).length])
  );

  return (
    <>
      <BackToTop />
      <ThemeFab theme={theme} onToggle={toggleTheme} />
      <section className="section hero-section" id="top">
        <Blobs />
        <div className="hero-scrim" aria-hidden="true" />
        <div className="hero-fadeout" aria-hidden="true" />
        <div className="container has-text-centered hero-panel">
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
              <a className="button is-dark" href="/main.pdf" target="_blank" rel="noreferrer">
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
              <a className="button is-dark" href="#citation" rel="noreferrer" onClick={(e) => {
                e.preventDefault();
                handleCiteClick();
              }}>
                <span className="icon">
                  <ion-icon name="copy-outline"></ion-icon>
                </span>
                <span> Cite </span>
              </a>
            </span>
          </div>
        </div>
      </section>

      <Navbar tab={tab} onTabClick={handleTabClick} />

      <section className="section content-section" id="content">
        <div className="content-container" key={tab}>
          {tab === "overview" && (
            <div className="tab-page">
              <PdfFigure
                src={fig("fig_framework")}
                caption={
                  <span>
                    <b>
                      A comprehensive view of actionable scene understanding for embodied manipulation.
                    </b>{" "}
                    We organize existing research around a shared foundation of datasets and
                    simulation environments and four complementary aspects of scene understanding:
                    geometric reconstruction establishes spatial structure and answers where; semantic
                    understanding identifies objects, attributes, and relations and answers what;
                    functional and physical understanding characterizes object functions,
                    affordances, and physical constraints and addresses how; and task-oriented action
                    connects scene understanding to task-relevant navigation and manipulation,
                    addressing where to go and what to do.
                  </span>
                }
              />
              <PdfFigure
                src={fig("fig_future_directions")}
                caption={
                  `Four future directions for embodied indoor scene understanding:
                  (a) from visible reconstruction to inference of latent environmental states;
                  (b) from passive perception to physically grounded self-supervision;
                  (c) from environment-centric modeling to human-state-aware scene understanding;
                  and (d) from task-oriented execution to human-centered embodied intelligence.`
                }
              />
              <CiteCard />
            </div>
          )}

          {tab === "datasets" && (
            <div className="tab-page">
              <Table n={1} />
              <Table n={2} />
              <Table n={3} />
            </div>
          )}

          {tab === "geometric" && (
            <div className="tab-page">
              <PdfFigure
                src={fig("fig2")}
                caption={`Taxonomy and chronological evolution of indoor scene reconstruction. Offline
                reconstruction, feed-forward reconstruction, and online reconstruction are organized
                as the three major paradigms, with representative methods arranged chronologically
                within their corresponding technical families.`}
              />
              <PdfFigure
                src={fig("fig3v12")}
                caption={`Representative examples of offline, feed-forward, and online 3D reconstruction
                paradigms.`}
              />
            </div>
          )}

          {tab === "semantic" && (
            <div className="tab-page">
              <PdfFigure
                src={fig("semantic_evo")}
                caption={
                  <span>
                    The four-layer bottom-up framework progressively transforms
                    reconstructed 3D geometry into structured semantic representations,
                    evolving from object-level perception and relational modeling to
                    open-vocabulary semantic understanding and unified geometry&ndash;semantic
                    representation.
                  </span>
                }
              />
              <Table n={4} />
            </div>
          )}

          {tab === "physical" && (
            <div className="tab-page">
              <PdfFigure
                src={fig("fig4b")}
                caption={`Taxonomy of physical and functional understanding. Existing studies can be
                broadly organized into physical property estimation, affordance reasoning, physical
                causal reasoning, and physical consistency verification.`}
              />
              <Table n={5} />
              <PdfFigure
                src={fig("fig4a")}
                caption={`From multimodal scene observation to physically grounded robot manipulation.
                Multimodal observations provide visual, geometric, and linguistic information, which
                is organized into object-centric representations containing geometry, semantics, and
                physical cues.`}
              />
            </div>
          )}

          {tab === "embodied" && (
            <div className="tab-page">
              <PdfFigure
                src={fig("fig_embodied_intelligence")}
                caption={`Taxonomy of representative paradigms in embodied intelligence. Existing
                approaches span vision-language understanding, language-guided navigation,
                vision-language-action execution, predictive world modeling, and unified embodied
                intelligence.`}
              />
              <Table n={6} />
              <PdfFigure
                src={fig("embodied_unified_modeling")}
                caption={`Overview of representative paradigms toward unified embodied intelligence.
                VLMs provide visual-language understanding, VLNs enable language-guided navigation,
                VLAs connect multimodal observations with executable actions, and world-action models
                introduce predictive modeling capabilities.`}
              />
            </div>
          )}

          {tab === "references" && (
            <div className="tab-page refs-page">
              <header className="refs-header">
                <p className="refs-eyebrow">Curated Bibliography</p>
                <h2 className="refs-title">References</h2>
                <p className="refs-subtitle">
                  {REFS.length} papers organized along the capability layers of the
                  survey &mdash; each with a{" "}
                  <ion-icon name="document-text-outline"></ion-icon>{" "}
                  <span className="ref-legend-text">Paper</span> link and{" "}
                  <ion-icon name="logo-github"></ion-icon>{" "}
                  <span className="ref-legend-text">Code</span> /{" "}
                  <ion-icon name="link-outline"></ion-icon>{" "}
                  <span className="ref-legend-text">Page</span> wherever available.
                </p>
              </header>

              <div className="refs-toolbar">
                <div className="ref-chips" role="tablist" aria-label="Filter by topic">
                  <button
                    type="button"
                    className={`ref-chip${refCat === "all" ? " is-active" : ""}`}
                    onClick={() => setRefCat("all")}
                  >
                    All <span className="ref-chip__count">{REFS.length}</span>
                  </button>
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`ref-chip${refCat === c.id ? " is-active" : ""}`}
                      onClick={() => setRefCat(c.id)}
                    >
                      {c.label}{" "}
                      <span className="ref-chip__count">{countByCat[c.id]}</span>
                    </button>
                  ))}
                </div>
                <label className="ref-search" aria-label="Search references">
                  <ion-icon name="search-outline"></ion-icon>
                  <input
                    type="search"
                    placeholder="Search title, author, venue…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              </div>

              {groups.length === 0 ? (
                <p className="refs-empty">No references match &ldquo;{query}&rdquo;.</p>
              ) : (
                <div className="refs-list" key={`${refCat}-${q}`}>
                  {groups.map((g) => (
                    <section key={g.id} className="ref-group" aria-label={g.label}>
                      <h3 className="ref-group__title">
                        {g.label}
                        <span className="ref-group__count">{g.items.length}</span>
                      </h3>
                      <div className="ref-group__list">
                        {g.items.map((r) => (
                          <article key={r.key} className="ref-row">
                            <div className="ref-info">
                              <a
                                className="ref-title"
                                href={r.paper}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {r.title}
                              </a>
                              <span className="ref-meta">
                                {r.authors} &middot; {r.venue} {r.year}
                              </span>
                            </div>
                            <div className="ref-actions">
                              {r.code && (
                                <a
                                  className="ref-btn ref-btn--code"
                                  href={r.code}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`Open the code of ${r.title}`}
                                >
                                  <ion-icon name="logo-github"></ion-icon>
                                  Code
                                </a>
                              )}
                              {r.page && (
                                <a
                                  className="ref-btn ref-btn--page"
                                  href={r.page}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`Open the project page of ${r.title}`}
                                >
                                  <ion-icon name="link-outline"></ion-icon>
                                  Page
                                </a>
                              )}
                              <a
                                className="ref-btn ref-btn--pdf"
                                href={r.paper}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Open the paper of ${r.title}`}
                              >
                                <ion-icon name="document-text-outline"></ion-icon>
                                Paper
                              </a>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}

              <CiteCard />
            </div>
          )}
        </div>
      </section>

      <p className="footer-note mt-6">
        &copy; 2026 Survey Project Page &middot; Built with React & Bulma,
        inspired by the DreamGaussian project page.
      </p>
    </>
  );
}
