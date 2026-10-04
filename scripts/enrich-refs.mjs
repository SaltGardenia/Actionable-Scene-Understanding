// Enriches src/refs-links.json with verified arXiv IDs / DOIs for every
// cited reference. Sources: the paper's own ref.bib fields, the arXiv API
// and the Crossref API. Every match is title-verified before acceptance.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PAPER_DIR = fs.existsSync(path.join(ROOT, "paper", "main.tex"))
  ? "paper"
  : "From_3D_Scene_Reconstruction_to_Actionable_Scene_Understanding_for_Embodied_Manipulation__A_Survey";
const BIB = path.join(ROOT, PAPER_DIR, "ref.bib");
const CACHE = path.join(ROOT, "paper-links-cache.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- tiny brace-aware bib parser (same as build-refs.mjs) ----------
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

function parseBib(text) {
  const entries = {};
  let i = 0;
  while (i < text.length) {
    const at = text.indexOf("@", i);
    if (at < 0) break;
    const brace = text.indexOf("{", at);
    if (brace < 0) break;
    const head = text.slice(at + 1, brace).trim().toLowerCase();
    const body = readBalanced(text, brace);
    if (["article", "inproceedings", "book", "incollection", "phdthesis", "misc", "techreport"].includes(head.split(/\s+/)[0])) {
      const keyMatch = body.inner.match(/^\s*([^,\s]+)\s*,/);
      if (keyMatch) {
        const fields = {};
        const rest = body.inner.slice(keyMatch[0].length);
        const fieldRe = /(\w+)\s*=\s*/g;
        let m;
        while ((m = fieldRe.exec(rest)) !== null) {
          const name = m[1].toLowerCase();
          let vStart = m.index + m[0].length;
          while (/\s/.test(rest[vStart])) vStart++;
          let value = "";
          if (rest[vStart] === "{") {
            const b = readBalanced(rest, vStart);
            value = b.inner;
            fieldRe.lastIndex = b.end;
          } else if (rest[vStart] === '"') {
            const e = rest.indexOf('"', vStart + 1);
            value = rest.slice(vStart + 1, e < 0 ? rest.length : e);
            fieldRe.lastIndex = e < 0 ? rest.length : e + 1;
          } else {
            let e = vStart;
            while (e < rest.length && rest[e] !== "," && rest[e] !== "\n") e++;
            value = rest.slice(vStart, e);
            fieldRe.lastIndex = e;
          }
          if (!(name in fields)) fields[name] = value.replace(/\s+/g, " ").trim();
        }
        entries[keyMatch[1]] = fields;
      }
    }
    i = body.end;
  }
  return entries;
}

const norm = (s) =>
  (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const tokens = (s) => new Set(norm(s).split(" ").filter((w) => w.length > 1));
function similarity(a, b) {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / Math.min(A.size, B.size);
}

// ---------- arXiv / Crossref lookups ----------
async function arxivLookup(title) {
  const q = encodeURIComponent(`ti:"${title.replace(/["\\]/g, "").slice(0, 180)}"`);
  try {
    const res = await fetch(`https://export.arxiv.org/api/query?search_query=${q}&max_results=3`, {
      headers: { "User-Agent": "survey-page-linker/1.0" },
    });
    if (!res.ok) return null;
    const xml = await res.text();
    const entries = xml.split("<entry>").slice(1);
    for (const e of entries) {
      const id = (e.match(/<id>http:\/\/arxiv.org\/abs\/([^<]+)<\/id>/) || [])[1];
      const t = (e.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "";
      if (id && similarity(t, title) >= 0.7) {
        return { arxiv: id.replace(/v\d+$/, "") };
      }
    }
  } catch {
    /* network hiccup — retried on the next run */
  }
  return null;
}

async function crossrefLookup(title, author) {
  const q = encodeURIComponent((title + " " + (author || "").split(" et ")[0]).slice(0, 200));
  try {
    const res = await fetch(`https://api.crossref.org/works?query.bibliographic=${q}&rows=3&select=DOI,title`, {
      headers: { "User-Agent": "survey-page-linker/1.0 (mailto:example@example.com)" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    for (const item of json?.message?.items || []) {
      const t = Array.isArray(item.title) ? item.title[0] : item.title;
      if (t && similarity(t, title) >= 0.75 && item.DOI) {
        return { doi: item.DOI.toLowerCase() };
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function main() {
  const bib = parseBib(fs.readFileSync(BIB, "utf8"));
  const { REFS } = await import(
    pathToFileURL(path.join(ROOT, "src", "refs.js"))
  );
  const cache = fs.existsSync(CACHE)
    ? JSON.parse(fs.readFileSync(CACHE, "utf8"))
    : {};

  const targets = REFS.filter((r) => !cache[r.key]);
  console.log(`refs: ${REFS.length}, cached: ${REFS.length - targets.length}, to resolve: ${targets.length}`);

  let done = 0;
  for (const ref of targets) {
    const f = bib[ref.key] || {};
    const entry = {};

    // 1. identifiers already present in the paper's own bibliography.
    // The placeholder "preprint" (bib entries for unpublished work) is not a
    // real ID — fall through to the online lookup instead.
    const journal = f.journal || "";
    const arxivInBib =
      (f.eprint || journal.match(/arXiv[: ]+(\S+)/i)?.[1] || (f.url || "").match(/arxiv\.org\/abs\/([^\s/]+)/i)?.[1] || "").replace(/v\d+$/i, "");
    if (arxivInBib && arxivInBib.toLowerCase() !== "preprint") entry.arxiv = arxivInBib;
    if (f.doi) entry.doi = f.doi.toLowerCase();
    if (!entry.arxiv && !entry.doi && f.url && !f.url.includes("scholar.google")) {
      entry.url = f.url;
    }

    // 2. otherwise look the paper up online
    if (!entry.arxiv && !entry.doi && !entry.url) {
      const viaArxiv = await arxivLookup(ref.title);
      if (viaArxiv) {
        entry.arxiv = viaArxiv.arxiv;
        entry.source = "arxiv-api";
      } else {
        await sleep(400);
        const viaCrossref = await crossrefLookup(ref.title, ref.authors);
        if (viaCrossref) {
          entry.doi = viaCrossref.doi;
          entry.source = "crossref";
        } else {
          entry.failed = true;
        }
      }
      await sleep(1100); // arXiv politeness window
    } else {
      entry.source = "bib";
    }

    cache[ref.key] = entry;
    done++;
    if (done % 10 === 0 || done === targets.length) {
      fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2));
      console.log(`[${done}/${targets.length}] ${ref.key} -> ${JSON.stringify(entry)}`);
    }
  }

  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2));
  const stats = { arxiv: 0, doi: 0, url: 0, failed: 0 };
  for (const v of Object.values(cache)) {
    if (v.arxiv) stats.arxiv++;
    else if (v.doi) stats.doi++;
    else if (v.url) stats.url++;
    else if (v.failed) stats.failed++;
  }
  console.log("done.", stats);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
