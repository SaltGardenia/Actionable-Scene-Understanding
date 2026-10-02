import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
// resolve the paper directory: local "paper" symlink if present, else the
// full folder name (the symlink is gitignored and absent on fresh clones)
const PAPER_DIR = fs.existsSync(path.join(ROOT, "paper", "main.tex"))
  ? "paper"
  : "From_3D_Scene_Reconstruction_to_Actionable_Scene_Understanding_for_Embodied_Manipulation__A_Survey";
const PAPER = path.join(ROOT, PAPER_DIR, "main.tex");
const OUT = path.join(ROOT, "src", "content.js");

// Page section id -> \section{...} title in the paper.
const PAGE_SECTIONS = [
  { id: "datasets", title: "Datasets and Evaluation Metrics" },
  { id: "geometric", title: "Geometric Reconstruction" },
  { id: "semantic", title: "Semantic Understanding" },
  { id: "physical", title: "Physical and Functional Understanding" },
  { id: "executable", title: "Executable Embodied Manipulation" },
  { id: "future", title: "Conclusion and Future Directions" },
];

// ---------- brace helpers ----------
function readBalanced(text, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return { inner: text.slice(openIdx + 1, i), end: i + 1 };
    }
  }
  return { inner: "", end: openIdx + 1 };
}

function takeBraced(s, idx) {
  let depth = 0;
  for (let i = idx; i < s.length; i++) {
    if (s[i] === "{") {
      if (depth === 0) {
        const r = readBalanced(s, i);
        return { inner: r.inner, end: r.end };
      }
      depth++;
    } else if (s[i] === "}") depth--;
  }
  return { inner: "", end: idx + 1 };
}

// strip LaTeX comments (but keep \%)
function stripComments(s) {
  return s
    .split("\n")
    .map((line) => {
      let res = "";
      let i = 0;
      while (i < line.length) {
        if (line[i] === "\\" && line[i + 1] === "%") {
          res += "%";
          i += 2;
          continue;
        }
        if (line[i] === "%") break;
        res += line[i];
        i++;
      }
      return res;
    })
    .join("\n");
}

// remove whole environments (balanced begin/end)
function removeEnvironments(s, names) {
  let out = s;
  for (const name of names) {
    const begin = "\\begin{" + name;
    for (let guard = 0; guard < 500; guard++) {
      const start = out.indexOf(begin);
      if (start < 0) break;
      const endMarker = "\\end{" + name + "}";
      const end = out.indexOf(endMarker, start);
      if (end < 0) {
        out = out.slice(0, start);
        break;
      }
      out = out.slice(0, start) + out.slice(end + endMarker.length);
    }
  }
  return out;
}

// ---------- label numbering (Table/Figure/Section) ----------
function buildLabelMaps(raw) {
  const text = stripComments(raw);
  const labels = { tab: {}, fig: {}, sec: {} };
  const envRe = /\\begin\{(table\*?|figure\*?)\}/g;
  let m;
  let tabN = 0;
  let figN = 0;
  while ((m = envRe.exec(text)) !== null) {
    const kind = m[1].startsWith("tab") ? "tab" : "fig";
    const endMarker = "\\end{" + m[1] + "}";
    const end = text.indexOf(endMarker, m.index);
    const body = text.slice(m.index, end < 0 ? text.length : end);
    envRe.lastIndex = end < 0 ? text.length : end;
    const lm = body.match(/\\label\{([^}]*)\}/);
    if (kind === "tab") {
      tabN += 1;
      if (lm) labels.tab[lm[1]] = String(tabN);
    } else {
      figN += 1;
      if (lm) labels.fig[lm[1]] = String(figN);
    }
  }
  const secRe = /\\section\{([^}]*)\}/g;
  let secN = 0;
  while ((m = secRe.exec(text)) !== null) {
    secN += 1;
    const after = text.slice(m.index, m.index + 400);
    const lm = after.match(/\\label\{(sec:[^}]*)\}/);
    if (lm) labels.sec[lm[1]] = String(secN);
  }
  return labels;
}

// parse \newcommand{\name}[n]{definition} (definitions may span lines)
function parseMacros(raw) {
  const text = stripComments(raw);
  const macros = {};
  const re = /\\newcommand\{\\([a-zA-Z]+)\}(?:\[(\d)\])?\{/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const b = takeBraced(text, re.lastIndex - 1);
    macros[m[1]] = {
      n: m[2] ? parseInt(m[2], 10) : 0,
      def: b.inner.replace(/\s+/g, " ").trim(),
    };
  }
  return macros;
}

// expand custom macros (\strength{...}, \researchdirection{..}{..}{..}, ...)
function expandMacros(s, macros) {
  let out = s;
  for (let guard = 0; guard < 500; guard++) {
    let replaced = false;
    for (const [name, macro] of Object.entries(macros)) {
      if (macro.n === 0) {
        const re = new RegExp("\\\\" + name + "(?![a-zA-Z])", "g");
        if (re.test(out)) {
          out = out.replace(re, macro.def);
          replaced = true;
        }
        continue;
      }
      const needle = "\\" + name + "{";
      let i = out.indexOf(needle);
      while (i >= 0) {
        let j = i + needle.length;
        const args = [];
        let ok = true;
        for (let a = 0; a < macro.n; a++) {
          while (j < out.length && /\s/.test(out[j])) j++;
          if (out[j] === "{") {
            const b = takeBraced(out, j);
            args.push(b.inner);
            j = b.end;
          } else {
            ok = false;
            break;
          }
        }
        if (!ok) {
          i = out.indexOf(needle, i + 1);
          continue;
        }
        let def = macro.def;
        for (let a = macro.n; a >= 1; a--) {
          def = def.split("#" + a).join(args[a - 1]);
        }
        out = out.slice(0, i) + def + out.slice(j);
        replaced = true;
        i = out.indexOf(needle, i);
      }
    }
    if (!replaced) break;
  }
  return out;
}

// \textcolor{color}{content} -> content (brace-aware)
function unwrapTextcolor(s) {
  let out = s;
  for (let guard = 0; guard < 500; guard++) {
    const i = out.indexOf("\\textcolor{");
    if (i < 0) break;
    const color = takeBraced(out, i + 10);
    let j = color.end;
    while (j < out.length && /\s/.test(out[j])) j++;
    if (out[j] !== "{") {
      out = out.slice(0, i) + out.slice(j);
      continue;
    }
    const content = takeBraced(out, j);
    out = out.slice(0, i) + content.inner + out.slice(content.end);
  }
  return out;
}

// unwrap \cmd[opt]{a1}{a2}... keeping the content of argument `keepArg`
function unwrapCmd(s, name, keepArg = 1) {
  const needle = "\\" + name + "{";
  let out = s;
  for (let guard = 0; guard < 500; guard++) {
    const i = out.indexOf(needle);
    if (i < 0) break;
    let j = i + needle.length;
    const args = [];
    let ok = true;
    for (let a = 0; a < keepArg; a++) {
      if (out[j] === "{") {
        const b = takeBraced(out, j);
        args.push(b.inner);
        j = b.end;
      } else {
        ok = false;
        break;
      }
    }
    if (!ok) break;
    out = out.slice(0, i) + args[keepArg - 1] + out.slice(j);
  }
  return out;
}

// ---------- inline LaTeX -> HTML ----------
const EM = "\x01";
const EM_END = "\x02";

const GREEK = {
  pi: "π", alpha: "α", beta: "β", gamma: "γ", delta: "δ", theta: "θ",
  lambda: "λ", mu: "μ", sigma: "σ", phi: "φ", omega: "ω", epsilon: "ε",
  bullet: "•", checkmark: "✓",
};

function inlineMath(s) {
  return s.replace(/\$([^$]*)\$/g, (_, m) => {
    let t = m;
    t = t.replace(/\\(mathcal|mathrm|mathbf|text)\{([^{}]*)\}/g, "$2");
    t = t.replace(/\\([a-zA-Z]+)/g, (_, c) => GREEK[c] ?? c);
    t = t.replace(/[{}]/g, "");
    return t;
  });
}

function inline(s) {
  let t = s;
  // \label — anchors are not needed on the web page
  t = t.replace(/\\label\{[^}]*\}/g, "");
  // \cite — citations are intentionally dropped from the web version
  t = t.replace(/~?\\cite(\[[^\]]*\])?\{[^}]*\}/g, "");
  // custom macros (\strength, \researchdirection, ...) and \textcolor
  t = expandMacros(t, MACROS);
  t = unwrapTextcolor(t);
  // \ref -> resolved numbers ("Table~\ref{tab:x}" -> "Table 1")
  t = t.replace(/\\ref\{([^}]*)\}/g, (_, label) => {
    const kind = label.startsWith("tab") ? "tab" : label.startsWith("fig") ? "fig" : "sec";
    return LABELS[kind][label] ?? "?";
  });
  // emphasis / bold -> placeholder tags (restored after escaping)
  for (let k = 0; k < 3; k++) {
    const next = t
      .replace(/\\(emph|textit)\{([^{}]*)\}/g, EM + "$2" + EM_END)
      .replace(/\\textbf\{([^{}]*)\}/g, EM + "$1" + EM_END);
    if (next === t) break;
    t = next;
  }
  t = t.replace(/\\texttt\{([^{}]*)\}/g, "$1");
  t = t.replace(/\\ding\{51\}/g, "✓").replace(/\\ding\{55\}/g, "✗");
  t = inlineMath(t);
  // punctuation & escapes
  t = t.replace(/---/g, "—").replace(/--/g, "–");
  t = t.replace(/``/g, " “ ").replace(/''/g, " ” ");
  t = t.replace(/\\%/g, "%").replace(/\\&/g, "&").replace(/\\_/g, "_");
  t = t.replace(/\\\$/g, "$").replace(/\\\{/g, "{").replace(/\\\}/g, "}");
  t = t.replace(/\\textendash/g, "–").replace(/\\texttimes/g, "×");
  t = t.replace(/\\[,;:! /]/g, " ");
  t = t.replace(/\\~/g, " ").replace(/~/g, " ");
  t = t.replace(/\\\(/g, " ").replace(/\\\)/g, " ");
  // drop any remaining commands with a single argument, then bare commands
  t = unwrapCmd(t, "mbox", 1);
  t = t.replace(/\\[a-zA-Z]+(\[[^\]]*\])?/g, "");
  t = t.replace(/[{}]/g, "");
  // escape HTML, then restore emphasis tags
  t = t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  t = t.split(EM).join("<em>").split(EM_END).join("</em>");
  // cite-stripping can leave "word ." — pull punctuation back onto the word
  t = t.replace(/ ([.,;:!?])/g, "$1");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

// ---------- section body -> blocks ----------
const HEAD_RE = /^\\(subsection|subsubsection|paragraph)\{/;
const NOISE_LINE_RE =
  /^\\(definecolor|newcommand|newcolumntype|rowcolors|setlength|renewcommand|footnotesize|scriptsize|small|centering|noindent|maketitle|arraybackslash|vspace|hspace)\b/;

// remove entire \newcommand{\name}[n]{...} / \newcolumntype{L}[n]{...}
// definitions (bodies may span lines)
function removeMacroDefs(s) {
  let out = s;
  for (let guard = 0; guard < 500; guard++) {
    const m = out.match(/\\(?:newcommand|newcolumntype)\{\\?[a-zA-Z]*\}(?:\[\d\])?\{/);
    if (!m) break;
    const start = out.indexOf(m[0]);
    const b = takeBraced(out, start + m[0].length - 1);
    out = out.slice(0, start) + out.slice(b.end);
  }
  return out;
}

function toBlocks(body) {
  let text = removeMacroDefs(body);
  text = removeEnvironments(text, [
    "table", "table*", "figure", "figure*", "equation", "equation*",
    "align", "align*", "tabular", "tabularx", "longtable", "minipage",
  ]);
  text = stripComments(text);
  const blocks = [];
  let buf = [];
  const flush = () => {
    if (!buf.length) return;
    const html = inline(buf.join(" "));
    if (html) blocks.push({ kind: "p", html });
    buf = [];
  };
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }
    if (NOISE_LINE_RE.test(line)) continue;
    const hm = line.match(HEAD_RE);
    if (hm) {
      flush();
      const b = takeBraced(line, hm[0].length - 1);
      const kind =
        hm[1] === "subsection" ? "h3" : hm[1] === "subsubsection" ? "h4" : "h5";
      blocks.push({ kind, text: inline(b.inner) });
      buf.push(line.slice(b.end));
      continue;
    }
    buf.push(line);
  }
  flush();
  return blocks;
}

// ---------- main ----------
const raw = fs.readFileSync(PAPER, "utf8");
const LABELS = buildLabelMaps(raw);
const MACROS = parseMacros(raw);

// split document into \section chunks
// (truncate before the bibliography/back-matter so "\bibliographystyle{scis}",
// "\bibliography{ref}" and "\end{document}" never leak into the last section)
const bodyText = stripComments(raw).replace(
  /\\bibliographystyle\{|\\bibliography\{|\\end\{document\}/,
  "\x00END\x00"
);
const lines = bodyText.split("\x00END\x00")[0].split("\n");
const chunks = [];
let current = null;
for (const line of lines) {
  const m = line.match(/^\\section\{([^}]*)\}/);
  if (m) {
    current = { title: m[1], lines: [] };
    chunks.push(current);
  } else if (current) {
    current.lines.push(line);
  }
}

const manifest = {};
for (const page of PAGE_SECTIONS) {
  const chunk = chunks.find((c) => c.title.trim() === page.title);
  if (!chunk) {
    console.warn("[warn] section not found: " + page.title);
    manifest[page.id] = { blocks: [] };
    continue;
  }
  manifest[page.id] = { blocks: toBlocks(chunk.lines.join("\n")) };
  const nP = manifest[page.id].blocks.filter((b) => b.kind === "p").length;
  const nH = manifest[page.id].blocks.length - nP;
  console.log(page.id + ": " + nH + " headings, " + nP + " paragraphs");
}

const moduleText =
  "// AUTO-GENERATED by scripts/build-content.mjs — do not edit by hand.\n" +
  "// Full prose of the survey body (sections 2-7), citations stripped.\n" +
  "export const CONTENT = " + JSON.stringify(manifest, null, 2) + ";\n";
fs.writeFileSync(OUT, moduleText);
console.log("\nDone. Wrote " + PAGE_SECTIONS.length + " sections -> src/content.js");
