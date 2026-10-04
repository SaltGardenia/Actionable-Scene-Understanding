// Linkify table cells that name a reference: dataset/method tokens get an
// anchor to the reference's project page, falling back to the paper link.
// Aliases come from two sources: the segment before ":" in each REFS title
// (NeRF, ScanNet, DUSt3R, …) and a curated map for table-only abbreviations
// (3DGS, CLIP, TUM RGB-D, VoteNet, …).
import { REFS } from "./refs";

// table token → reference title exactly as written in refs.js
const CURATED = [
  ["TUM RGB-D", "A Benchmark for the Evaluation of RGB-D SLAM Systems"],
  ["Replica", "The Replica Dataset: a Digital Replica of Indoor Spaces"],
  ["NYU Depth V2", "Indoor Segmentation and Support Inference from Rgbd Images"],
  ["S3DIS", "3D Semantic Parsing of Large-scale Indoor Spaces"],
  ["Gibson", "Gibson Env: Real-world Perception for Embodied Agents"],
  ["HM3D", "Habitat-matterport 3D Dataset (hm3d): 1000 Large-scale 3D Environments for Embodied Ai"],
  ["HM3D-Sem", "Habitat-matterport 3D Semantics Dataset"],
  ["HSSD-200", "Habitat Synthetic Scenes Dataset (HSSD-200): an Analysis of 3D Scene Scale and Realism Tradeoffs for ObjectGoal Navigation"],
  ["MolmoBot-Data", "MolmoB0T: Large-Scale Simulation Enables Zero-Shot Manipulation"],
  ["3RScan", "Rio: 3D Object Instance Re-localization in Changing Indoor Environments"],
  ["MP3D", "Matterport3D: Learning from RGB-D Data in Indoor Environments"],
  ["3DGS", "3D Gaussian Splatting for Real-time Radiance Field Rendering"],
  ["2DGS", "2D Gaussian Splatting for Geometrically Accurate Radiance Fields"],
  ["Instant-NGP", "Instant Neural Graphics Primitives with a Multiresolution Hash Encoding"],
  ["MonoGS", "Gaussian Splatting SLAM"],
  ["MASt3R", "Grounding Image Matching in 3D with MASt3R"],
  ["SfM", "Structure-from-motion Revisited"],
  ["MVS", "Multi-view Stereo: a Tutorial"],
  ["deformable Gaussians", "Deformable 3D Gaussians for High-fidelity Monocular Dynamic Scene Reconstruction"],
  ["D4RT", "Efficiently Reconstructing Dynamic Scenes One D4rt at a Time"],
  ["StratifiedTF", "Stratified Transformer for 3D Point Cloud Segmentation"],
  ["PTv3", "Point Transformer V3: Simpler, Faster, Stronger"],
  ["HAIS", "Hierarchical Aggregation for 3D Instance Segmentation"],
  ["VoteNet", "Deep Hough Voting for 3D Object Detection in Point Clouds"],
  ["SSCNet", "Semantic Scene Completion from a Single Depth Image"],
  ["SemanticNeRF", "Neural 3D Scene Reconstruction with the Manhattan-world Assumption"],
  ["Bi-Layout", "No More Ambiguity in 360extdegree Room Layout via Bi-Layout Estimation"],
  ["CLIP", "Learning Transferable Visual Models from Natural Language Supervision"],
  ["LLaVA", "Visual Instruction Tuning"],
  ["R2R", "Vision-and-language Navigation: Interpreting Visually-grounded Navigation Instructions in Real Environments"],
  ["PREVALENT", "Towards Learning a Generic Agent for Vision-and-language Navigation via Pre-training"],
  ["HAMT", "History Aware Multimodal Transformer for Vision-and-language Navigation"],
  ["DreamerV3", "Mastering Diverse Control Tasks Through World Models"],
  ["Cosmos", "Cosmos World Foundation Model Platform for Physical AI"],
  ["π0", "$\\pi_0$: a Vision-Language-Action Flow Model for General Robot Control"],
  ["PatchMatch Stereo", "Patchmatch Stereo-stereo Matching with Slanted Support Windows"],
  ["Bundler", "Extracting Triangular 3D Models, Materials, and Lighting from Images"],
  ["COLMAP", "Structure-from-motion Revisited"],
  // dataset tokens whose \cite in the paper maps to an existing reference
  ["HiRoom", "Depth Anything 3: Recovering the Visual Space from Any Views"],
  ["XScene", "Scenix: Sparse-View 3D Scene Reconstruction via Executable Scene Programs"],
  ["ReplicaCAD", "Habitat 2.0: Training Home Assistants to Rearrange Their Habitat"],
  ["SceneVerse++", "Lifting Unlabeled Internet-level Data for 3D Scene Understanding"],
  // representative works/methods cited in the tables
  ["SDSGG", "Scene Graph Generation with Role-Playing Large Language Models"],
  ["Plane-DUSt3R", "Unposed Sparse Views Room Layout Reconstruction in the Age of Pretrain Model"],
  ["PhyGenBench", "Towards World Simulator: Crafting Physical Commonsense-based Benchmark for Video Generation"],
  ["3D-BoNet", "Learning Object Bounding Boxes for 3D Instance Segmentation on Point Clouds"],
  ["RoboFlamingo", "Vision-Language Foundation Models as Effective Robot Imitators"],
  ["world-model-based predictive frameworks", "Autonomous Video Generation with Counterfactual Controllability for Self-Evolving World Models"],
  ["Neural Reflectance Fields", "Neural reflectance fields for appearance acquisition"],
  ["SoftGroup", "SoftGroup for 3D Instance Segmentation on Point Clouds"],
];

const normStrict = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
const normFuzzy = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const REF_BY_STRICT = new Map();
const REF_BY_FUZZY = new Map();
const add = (map, alias, ref) => {
  const k = map === REF_BY_STRICT ? normStrict(alias) : normFuzzy(alias);
  if (k && !map.has(k)) map.set(k, ref);
};
for (const r of REFS) {
  const colon = r.title.indexOf(":");
  if (colon > 0) {
    add(REF_BY_STRICT, r.title.slice(0, colon), r);
    add(REF_BY_FUZZY, r.title.slice(0, colon), r);
  }
  add(REF_BY_STRICT, r.title, r);
  add(REF_BY_FUZZY, r.title, r);
}
const byTitle = new Map(REFS.map((r) => [normFuzzy(r.title), r]));
for (const [alias, title] of CURATED) {
  const ref = byTitle.get(normFuzzy(title));
  if (ref) {
    add(REF_BY_STRICT, alias, ref);
    add(REF_BY_FUZZY, alias, ref);
  }
}

// Strict lookup first so tokens like "ScanNet" vs "ScanNet++" stay distinct;
// the alnum-only fuzzy map is the fallback for punctuation variants.
function refForToken(token) {
  return (
    REF_BY_STRICT.get(normStrict(token)) ||
    REF_BY_FUZZY.get(normFuzzy(token)) ||
    null
  );
}

// Category row tints from the paper's source colors. The inline light-mode
// pastels are replaced with classes so CSS can render theme-aware tints
// (the light hexes wash out dark mode).
const TINT_CLASSES = {
  "#ecfdf3": "row-tint-green",
  "#eff6ff": "row-tint-blue",
  "#fff7ed": "row-tint-orange",
  "#faf5ff": "row-tint-purple",
  "#ecfeff": "row-tint-cyan",
};

function tintRows(doc) {
  for (const tr of doc.querySelectorAll("tbody tr")) {
    const style = tr.getAttribute("style") || "";
    const m = style.match(/background:\s*(#[0-9a-fA-F]{6})/);
    if (!m) continue;
    tr.removeAttribute("style");
    const cls = TINT_CLASSES[m[1].toLowerCase()];
    if (cls) tr.classList.add(cls);
  }
}

// Strengths/limitations cells (table 4): the paper puts every • + / • -- item
// on its own line with a bold green + / red --. The generator flattened the
// \par breaks, so re-group the nodes into per-line items here.
function formatBullets(doc) {
  for (const td of doc.querySelectorAll("tbody td")) {
    const dots = td.querySelectorAll("span.pos, span.neg");
    if (!dots.length) continue;
    const items = [];
    let current = null;
    for (const node of [...td.childNodes]) {
      if (node.nodeType === 1 && node.matches("span.pos, span.neg")) {
        current = { dot: node, rest: [] };
        items.push(current);
      } else if (current) {
        current.rest.push(node);
      }
    }
    if (!items.length) continue;
    td.textContent = "";
    for (const item of items) {
      const div = doc.createElement("div");
      div.className = "tbl-item";
      div.appendChild(item.dot);
      const firstText = item.rest.find(
        (n) => n.nodeType === 3 && n.textContent.trim()
      );
      const signClass = item.dot.classList.contains("pos")
        ? "pos-sign"
        : "neg-sign";
      let matched = false;
      if (firstText) {
        const m = firstText.textContent.match(/^\s*([+\-]{1,2})\s+([\s\S]*)$/);
        if (m) {
          matched = true;
          const sign = doc.createElement("b");
          sign.className = signClass;
          sign.textContent = m[1];
          div.appendChild(sign);
          div.appendChild(doc.createTextNode(" " + m[2]));
        }
      }
      for (const n of item.rest) {
        if (matched && n === firstText) continue;
        div.appendChild(n);
      }
      td.appendChild(div);
    }
  }
}

function linkifyNode(node, doc) {
  // split on commas/semicolons/parentheses and space-surrounded " + " only,
  // so tokens like "ScanNet++" stay intact
  const parts = node.textContent.split(/([,;()]| \+ )/);
  if (parts.length === 0) return;
  const frag = doc.createDocumentFragment();
  let changed = false;
  // a link whose trailing text is still pending, so a following separator
  // can be glued to it (line wraps then never start with a stray comma)
  let pendingLink = null;
  const flush = () => {
    if (!pendingLink) return;
    if (pendingLink.trail) frag.appendChild(doc.createTextNode(pendingLink.trail));
    pendingLink = null;
  };
  for (const part of parts) {
    const isSep = /^(,|;|\(|\)| \+ )$/.test(part);
    if (isSep) {
      if (pendingLink) {
        const span = doc.createElement("span");
        span.style.whiteSpace = "nowrap";
        span.appendChild(pendingLink.a);
        if (pendingLink.trail) {
          span.appendChild(doc.createTextNode(pendingLink.trail));
        }
        span.appendChild(doc.createTextNode(part));
        frag.appendChild(span);
        pendingLink = null;
      } else {
        frag.appendChild(doc.createTextNode(part));
      }
      continue;
    }
    if (!part.trim()) {
      if (pendingLink) pendingLink.trail += part;
      else frag.appendChild(doc.createTextNode(part));
      continue;
    }
    const token = part.trim();
    const ref = refForToken(token);
    if (!ref) {
      flush();
      frag.appendChild(doc.createTextNode(part));
      continue;
    }
    changed = true;
    flush();
    const start = part.indexOf(token);
    const lead = part.slice(0, start);
    const trail = part.slice(start + token.length);
    if (lead) frag.appendChild(doc.createTextNode(lead));
    const a = doc.createElement("a");
    a.href = ref.page || ref.paper;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.className = "tbl-ref";
    a.textContent = token;
    frag.appendChild(a);
    pendingLink = { a, trail };
  }
  flush();
  if (changed) node.parentNode.replaceChild(frag, node);
}

const cache = new Map();

// Rewrites the generated table HTML so body cells naming a reference are
// wrapped in links. cacheKey should be the table index.
export function linkifyTableHtml(html, cacheKey) {
  if (cacheKey != null && cache.has(cacheKey)) return cache.get(cacheKey);
  const doc = new DOMParser().parseFromString(html, "text/html");
  tintRows(doc);
  formatBullets(doc);
  for (const td of doc.querySelectorAll("tbody td")) {
    const walker = doc.createTreeWalker(td, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) linkifyNode(node, doc);
  }
  const out = doc.body.innerHTML;
  if (cacheKey != null) cache.set(cacheKey, out);
  return out;
}
