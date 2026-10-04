import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PAPER_DIR = fs.existsSync(path.join(ROOT, "paper", "main.tex"))
  ? "paper"
  : "From_3D_Scene_Reconstruction_to_Actionable_Scene_Understanding_for_Embodied_Manipulation__A_Survey";
const BIB = path.join(ROOT, PAPER_DIR, "ref.bib");
const TEX = path.join(ROOT, PAPER_DIR, "main.tex");
const OUT = path.join(ROOT, "src", "refs.js");

// ---------- reference categories (aligned with the survey structure) ----------
export const CATEGORIES = [
  { id: "datasets", label: "Datasets & Environments" },
  { id: "geometric", label: "Geometric Reconstruction" },
  { id: "semantic", label: "Semantic Understanding" },
  { id: "physical", label: "Physical & Functional" },
  { id: "embodied", label: "Embodied Intelligence" },
];

const CATEGORY_MAP = {
  // ---- datasets, simulation environments, benchmarks ----
  datasets: `
    dai2017scannet chang2017matterport3d song2015sunrgbd silberman2012indoor straub2019replica
    yeshwanth2023scannet++ zheng2020structured3d ling2024dl3dv baruch2021arkitscenes handa2014benchmark
    sturm2012benchmark arméni20163d arméni2017joint arméni20193d armeni20163d armeni2017joint armeni20193d
    dai2017bundlefusion shotton2013scene wald2019rio barberteguy2026pano3d kanayama2025tof360
    ou2026holo360d
    kolve2017ai2 shah2018air simmons2021air xia2018gibson li2020igibson shen2021igibson puig2021watch
    li2023behavior szot2021habitat savva2019habitat ramakrishnan2021habitat yadav2023habitat
    gu2023maniskill2 tao2025maniskill3 nasiriany2024robocasa deitke2022 raistrick2024infinigen
    khanna2024hssd wang2024embodiedscan grauman2022ego4d damen2018scaling gan2021threedworld
    zhong2025internscenes delitzas2024scenefun3d zhang2025functional3d openx2023openx
    song2017sscnet chen2021hais
  `,
  // ---- geometric reconstruction, SLAM, mapping, layout ----
  geometric: `
    schonberger2016structure furukawa2010accurate furukawa2015multiview bleyer2011patchmatch
    yao2018mvsnet schónberger2016 izadi2011kinectfusion newcombe2015dynamicfusion dai2017bundlefusion
    mur2015orb campos2020orb schmuck2021covins lajoie2023swarm liu2025slam3r chen2026lifting
    mildenhall2021nerf fridovich2023k chen2022tensorf takikawa2021neural kerbl20233d guedon2024sugar
    jiang2024gaussianshader huang20242d munkberg2022extracting niedermayr2024compressed chen2024pgsr
    yang2024deformable wang2021neus chen2024sdsgg? guo2022neural bi2020neural zhang2025nerfprior
    muller2022instant wang2024dust3r murai2025mast3r wang2025vggt jin2026zipmap keetha2026mapanything
    ren2025fin3r chen2026lifting zhang2026efficiently zhi2021semanticnerf peng2025gaussian
    matsuki2024gaussian yugay2025magic yugay2026gaussian piedade2026revisiting lazarow2025cubify
    zou2018layoutnet sun2019HorizonNet hu2023cp wang2021LED2 dai2018scancomplete zhu2022nice
    cao2022monoscene barberteguy2026pano3d tsai2024BiLayout mia2026layout lai2022stratified
    chen2026lifting xu2026area3d wu2025MODP jiang2024openocc
    lin2025depthanything3 wang2004image snavely2006photo rich2024smoothness rich2026prism
    pumarola2021d yu2024gsdf cadena2016past sucar2021imap yang2022vox keetha2024splatam
    tian2026sdgs pan2022activenerf feng2024naruto luiten2024dynamic Lee2025uLayout
    Huang2025PlaneDUSt3R jiang2022lgt yao2023undirected wang2021LED2 xiong2025cl
    li2026scenix deng2025mne
  `,
  // ---- semantic understanding, detection, grounding, language ----
  semantic: `
    qi2017pointnet++ qi2019deep thomas2019kpconv jiang2020pointgroup vu2022softgroup chen2021hais
    kirillov2019panoptic schult2023mask3d takmaz2023openmask3d kolodiazhnyi2024oneformer3d
    rukhovich2022fcaf3d rukhovich2023tr3d wang2022cagroup3d zhu2024spgroup3d yang2025swin3d
    guo2020deep wu2024point chen2020scanrefer yuan2021instancerefer achlioptas2020referit3d
    roh2021languagerefer zhao20213dvgtransformer zhang2023multi3drefer chen2024sdsgg lv2024sgformer
    chen2025graph2scene zhang2026scenellm zellers2018neural zhang2018perceptual
    peng2023openscene javatavallabhula2023conceptfusion leroy2024grounding azuma2022scanqa
    chen2024ll3da hong20233dllm zhu20233dvista li2021openrooms chen2026scenix? kolodiazhnyi
    chen2026scenix cheng2023tbfnt3d wu2021 li2024dense mccormac2017semanticfusion
    mccormac2018fusionpp choy20194d qian2022pointnext
  `,
  // ---- physical & functional understanding ----
  physical: `
    mo2021where2act do2018affordancenet halacheva2025articulate3d bear2021physion
    chow2025physbench li2025quantiphy yi2019clevrer foss2025causalvqa meng2024towards
    cao2025physx3d cao2025physxanything yuan2024robopoint xu2021digging yang2019learning
    kim2021just li2026magician kang2024far bi2020neural
  `,
  // ---- embodied intelligence: VLM / VLN / VLA / world models ----
  embodied: `
    radford2021clip li2023blip liu2023visual li2023pope ahn2022saycan anderson2018vision
    hao2020towards chen2021history hong2021vln zhou2024navgpt brohan2022rt zitkovich2023rt
    team2024octo kim2024openvla openx2023openx team2024pi0 qu2025spatialvla li2026pointvla
    bi2026vla zhang2026vtla li2026dypesvla wang2026think ha2018world hafner2023mastering
    brooks2024video bruce2024genie hu2023gaia lee2026unified chen2026abot driess2023palme
    zhen20243d xiang2020sapien gu2023maniskill2 agrawal2025cosmos wang2026autonomous
    deshpande2026molmobot chen2026robodojo jin2025planargs werby2024hierarchical wang2024grutopia
    wei2026simple li2024vision zhang2024rail
  `,
};

// per-work resources we are confident about (key -> { code, page })
const PAGE_MAP = {
  mildenhall2021nerf: "https://www.matthewtancik.com/nerf",
  kerbl20233d: "https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/",
  wang2024dust3r: "https://dust3r.europe.naverlabs.com/",
  murai2025mast3r: "https://dust3r.europe.naverlabs.com/mast3r",
  "schonberger2016structure": "https://colmap.github.io/",
  "schönberger2016structure": "https://colmap.github.io/",
  dai2017scannet: "https://www.scan-net.eu/",
  yeshwanth2023scannetpp: "https://kaldir.vc.in.tum.de/scannetpp/",
  chang2017matterport3d: "https://niessner.github.io/Matterport/",
  szot2021habitat: "https://aihabitat.org/",
  savva2019habitat: "https://aihabitat.org/",
  ramakrishnan2021habitat: "https://aihabitat.org/",
  yadav2023habitat: "https://aihabitat.org/",
  kolve2017ai2: "https://ai2thor.allenai.org/",
  li2020igibson: "https://svl.stanford.edu/igibson/",
  xia2018gibson: "http://gibsonenv.stanford.edu/",
  xiang2020sapien: "https://sapien.ucsd.edu/",
  gu2023maniskill2: "https://maniskill.github.io/",
  tao2025maniskill3: "https://maniskill.ai/",
  nasiriany2024robocasa: "https://robocasa.ai/",
  radford2021clip: "https://openai.com/research/clip",
  li2023blip: "https://salesforce.github.io/LAVIS/",
  liu2023visual: "https://llava-vl.github.io/",
  hafner2023mastering: "https://danijar.com/project/dreamerv3/",
  kim2024openvla: "https://openvla.github.io/",
  team2024octo: "https://octo-models.github.io/",
  team2024pi0: "https://www.physicalintelligence.company/blog/openpi",
  mo2021where2act: "https://where2act.github.io/",
  chen2020scanrefer: "https://scanrefer.github.io/",
  zhu2022nice: "https://zjhthu.github.io/NICE-SLAM/",
  guedon2024sugar: "https://anttwo.github.io/sugar_gaussian.html",
  zhang2018perceptual: "https://richzhang.github.io/PerceptualSimilarity/",
  wang2024embodiedscan: "https://tai-wang.github.io/embodiedscan/",
  grauman2022ego4d: "https://ego4d-data.org/",
  delitzas2024scenefun3d: "https://scenefun3d.github.io/",
  yuan2024robopoint: "https://robopoint.github.io/",
  cao2025physx3d: "https://physx3d.github.io/",
};

// open-source repositories we are confident about (key -> GitHub owner/repo)
const CODE_MAP = {
  radford2021clip: "openai/CLIP",
  li2023blip: "salesforce/LAVIS",
  liu2023visual: "haotian-liu/LLaVA",
  "schonberger2016structure": "colmap/colmap",
  "schönberger2016structure": "colmap/colmap",
  kerbl20233d: "graphdeco-inria/gaussian-splatting",
  mildenhall2021nerf: "bmild/nerf",
  munkberg2022extracting: "NVlabs/nvdiffrec",
  chen2022tensorf: "apchenstu/TensoRF",
  guedon2024sugar: "Anttwo/SuGaR",
  wang2021neus: "wang-ps/neus",
  wang2024dust3r: "naver/dust3r",
  murai2025mast3r: "naver/mast3r",
  keetha2026mapanything: "facebookresearch/map-anything",
  dai2017scannet: "ScanNet/ScanNet",
  chang2017matterport3d: "niessner/Matterport",
  yeshwanth2023scannetpp: "ScanNet/ScanNet++",
  szot2021habitat: "facebookresearch/habitat-lab",
  savva2019habitat: "facebookresearch/habitat-lab",
  ramakrishnan2021habitat: "facebookresearch/habitat-lab",
  yadav2023habitat: "facebookresearch/habitat-lab",
  kolve2017ai2: "allenai/ai2thor",
  li2020igibson: "StanfordVL/iGibson",
  xia2018gibson: "StanfordVL/GibsonEnv",
  xiang2020sapien: "haosulab/SAPIEN",
  gu2023maniskill2: "haosulab/ManiSkill",
  tao2025maniskill3: "haosulab/ManiSkill",
  nasiriany2024robocasa: "robocasa/robocasa",
  raistrick2024infinigen: "princeton-vl/infinigen",
  mur2015orb: "raulmur/ORB_SLAM2",
  campos2020orb: "UZ-SLAMLab/ORB_SLAM3",
  schmuck2021covins: "ethz-asl/covins",
  zhu2022nice: "zjhthu/NICE-SLAM",
  dai2017bundlefusion: "NVIDIA/BundleFusion",
  mo2021where2act: "danfeiX/where2act",
  kim2024openvla: "openvla/openvla",
  team2024octo: "octo-models/octo",
  team2024pi0: "physical-intelligence/openpi",
  hafner2023mastering: "danijar/dreamerv3",
  qi2017pointnet: "charlesq34/pointnet",
  "qi2017pointnet++": "charlesq34/pointnet2",
  qi2019deep: "ma-xu/pointMLP-pytorch",
  thomas2019kpconv: "hbredif? kpconv",
  thomas2019kpconvx: "hbredif",
  jiang2020pointgroup: "llijiang/PointGroup",
  vu2022softgroup: "llijiang/SoftGroup",
  chen2021hais: "hustvl/HAIS",
  schult2023mask3d: "jonasschult/Mask3D",
  takmaz2023openmask3d: "takmaz/openmask3d",
  rukhovich2022fcaf3d: "DMAir/FCAF3D",
  rukhovich2023tr3d: "DMAir/TR3D",
  chen2020scanrefer: "daveredrum/ScanRefer",
  zhao20213dvgtransformer: "zlccccc/3dvg-transformer",
  zellers2018neural: "rowanz/neural-motifs",
  zhang2018perceptual: "richzhang/PerceptualSimilarity",
  peng2023openscene: "pengsongyou/openscene",
  hong2021vln: "YicongHong/HAMT-Visual-Language-Navigation",
};

// ---------- tiny brace-aware bib parser ----------
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
        let rest = body.inner.slice(keyMatch[0].length);
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

const VENUE_SHORT = [
  ["Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition", "CVPR"],
  ["Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition", "CVPR"],
  ["IEEE/CVF Conference on Computer Vision and Pattern Recognition", "CVPR"],
  ["IEEE Conference on Computer Vision and Pattern Recognition", "CVPR"],
  ["IEEE/CVF International Conference on Computer Vision", "ICCV"],
  ["IEEE International Conference on Computer Vision", "ICCV"],
  ["British Machine Vision Conference", "BMVC"],
  ["European Conference on Computer Vision", "ECCV"],
  ["Advances in Neural Information Processing Systems", "NeurIPS"],
  ["IEEE International Conference on Robotics and Automation", "ICRA"],
  ["IEEE/RSJ International Conference on Intelligent Robots and Systems", "IROS"],
  ["IEEE Robotics and Automation Letters", "RA-L"],
  ["AAAI Conference on Artificial Intelligence", "AAAI"],
  ["International Conference on Learning Representations", "ICLR"],
  ["International Conference on Machine Learning", "ICML"],
  ["International Conference on 3D Vision", "3DV"],
  ["ACM SIGGRAPH", "SIGGRAPH"],
  ["IEEE Transactions on Pattern Analysis and Machine Intelligence", "TPAMI"],
  ["IEEE Transactions on Visualization and Computer Graphics", "TVCG"],
  ["IEEE Transactions on Image Processing", "TIP"],
  ["IEEE/CVF Transactions on Robotics", "T-RO"],
  ["The International Journal of Robotics Research", "IJRR"],
  ["IEEE and ACM International Symposium on Mixed and Augmented Reality", "ISMAR"],
];

const ACRONYMS = new Set([
  "3d", "2d", "rgb-d", "slam", "nerf", "mvs", "sfm", "vlm", "vla", "vln", "llm",
  "lidar", "cnn", "iou", "gpu", "cpu", "ar", "vr", " grasping",
]);

const STOPWORDS = new Set([
  "of", "for", "the", "and", "with", "a", "an", "in", "on", "to", "via",
  "from", "by", "at", "as", "or", "using",
]);

const NAME_OVERRIDES = {
  scannet: "ScanNet", "scannet++": "ScanNet++", matterport3d: "Matterport3D",
  nerf: "NeRF", slam: "SLAM", "nice-slam": "NICE-SLAM", splatam: "SplaTAM",
  imap: "iMAP", colmap: "COLMAP", dust3r: "DUSt3R", mast3r: "MASt3R",
  vggt: "VGGT", mapanything: "MapAnything", "3dgs": "3DGS",
  layoutnet: "LayoutNet", "lgt-net": "LGT-Net", where2act: "Where2Act",
  affordancenet: "AffordanceNet", pointnet: "PointNet", "pointnet++": "PointNet++",
  pointnext: "PointNeXt", kpconv: "KPConv", mask3d: "Mask3D", fcaf3d: "FCAF3D",
  tr3d: "TR3D", hais: "HAIS", "3d-vista": "3D-VISTA", sgformer: "SGFormer",
  scanrefer: "ScanRefer", instancerefer: "InstanceRefer", "3dvg": "3DVG",
  scanqa: "ScanQA", "3dllm": "3D-LLM", ll3da: "LL3DA", physx: "PhysX",
  "physx-3d": "PhysX-3D", r2r: "R2R", hamt: "HAMT", navgpt: "NavGPT",
  openvla: "OpenVLA", spatialvla: "SpatialVLA", pointvla: "PointVLA",
  openpi: "OpenPI", saycan: "SayCan", rt: "RT", gaia: "GAIA", genie: "Genie",
  clevrer: "CLEVRER", causalvqa: "CausalVQA", phygenbench: "PhyGenBench",
  physbench: "PhysBench", robopoint: "RoboPoint", gpt: "GPT", clip: "CLIP",
  blip: "BLIP", blip: "BLIP", lavis: "LAVIS", lerf: "LERF",
  embodiedscan: "EmbodiedScan", habitat: "Habitat", gibson: "Gibson",
  igibson: "iGibson", ai2thor: "AI2-THOR", sapien: "SAPIEN",
  maniskill: "ManiSkill", robocasa: "RoboCasa", infinigen: "Infinigen",
  "3dv": "3DV", bmvc: "BMVC", "led2-net": "LED2-Net", sunrgbd: "SUN RGB-D",
  s3dis: "S3DIS", "gsdf": "GSDF", dynamic3d: "Dynamic 3D", scannetpp: "ScanNet++",
  arkit: "ARKit", hololens: "HoloLens", kinect: "Kinect", voxformer: "VoxFormer",
  "3d": "3D", "2d": "2D", "rgb-d": "RGB-D", mvs: "MVS", sfm: "SfM", lidar: "LiDAR",
  iou: "IoU", vlm: "VLM", vla: "VLA", vln: "VLN", llm: "LLM", arxiv: "arXiv",
};

function polishTitle(s) {
  let t = cleanTeX(s).replace(/[.,;:]$/, "").trim();
  t = t.replace(/([:!?]\s+)([a-z])/g, (m, p, c) => p + c.toUpperCase());
  t = t
    .split(" ")
    .map((w, i) => {
      const bare = w.replace(/[^a-z0-9+-]/gi, "").toLowerCase();
      if (NAME_OVERRIDES[bare]) {
        const re = new RegExp(bare.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        return w.replace(re, NAME_OVERRIDES[bare]);
      }
      if (i > 0 && STOPWORDS.has(bare)) return w.toLowerCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
  return t;
}

function polishVenue(s) {
  const v = cleanTeX(s || "");
  if (!v) return "";
  for (const [long, short] of VENUE_SHORT) {
    if (v.toLowerCase().includes(long.toLowerCase())) return short;
  }
  return v.charAt(0).toUpperCase() + v.slice(1);
}

function cleanTeX(s) {
  return s
    .replace(/\\['`^"~=.uvwHcckbdtr]\s?/g, "")
    .replace(/\\[a-zA-Z]+\{([^{}]*)\}/g, "$1")
    .replace(/[{}]/g, "")
    .replace(/--+/g, "–")
    .replace(/\s+/g, " ")
    .trim();
}

function formatAuthors(bibAuthors) {
  const names = bibAuthors.split(/ and | AND /).map(cleanTeX).filter(Boolean);
  if (names.length === 0) return "";
  const first = names[0].includes(",")
    ? names[0].split(",")[1].trim() + " " + names[0].split(",")[0].trim()
    : names[0];
  return names.length > 3 ? `${first} et al.` : first + (names.length > 1 ? " et al." : "");
}

// arXiv abs links -> direct pdf; doi/url fallback; scholar search as last resort
// verified links resolved online by scripts/enrich-refs.mjs
const LINKS = JSON.parse(fs.readFileSync(path.join(ROOT, "paper-links-cache.json"), "utf8"));

function paperLink(fields, key) {
  // one "Paper" button per entry; the arXiv abstract page is preferred,
  // then DOI, then any URL the bibliography provides
  const link = LINKS[key] || {};
  const arxivId =
    link.arxiv ||
    fields.eprint ||
    (fields.journal || "").match(/arXiv[: ]+(\S+)/i)?.[1] ||
    (fields.note || "").match(/arXiv[: ]+(\S+)/i)?.[1] ||
    null;
  if (arxivId) {
    return { paper: `https://arxiv.org/abs/${arxivId.replace(/^arXiv:/i, "").replace(/v\d+$/i, "")}` };
  }
  if (link.doi || fields.doi) {
    return { paper: "https://doi.org/" + (link.doi || fields.doi).toLowerCase() };
  }
  if (link.url) return { paper: link.url };
  const url = (fields.url || "").replace(/^http:/, "https:");
  if (url && !url.includes("scholar.google")) return { paper: url };
  const q = encodeURIComponent(cleanTeX(fields.title || "").replace(/[.,;:]$/, ""));
  return { paper: `https://scholar.google.com/scholar?q=${q}` };
}

// ---------- main ----------
// Keys cited only inside table cells without an inline \cite in the current
// tex (e.g. "Neural Reflectance Fields" in the physical table). They belong
// in the bibliography, so include them explicitly.
const EXTRA_KEYS = ["bi2020neural"];

const bib = parseBib(fs.readFileSync(BIB, "utf8"));
const tex = fs
  .readFileSync(TEX, "utf8")
  .split("\n")
  .map((l) => {
    // strip LaTeX comments, but keep \%
    let res = "";
    for (let i = 0; i < l.length; i++) {
      if (l[i] === "\\" && l[i + 1] === "%") {
        res += "%";
        i++;
      } else if (l[i] === "%") break;
      else res += l[i];
    }
    return res;
  })
  .join("\n");
const cited = new Set(
  [...tex.matchAll(/\\cite\{([^}]*)\}/g)]
    .flatMap((m) => m[1].split(","))
    .map((k) => k.trim())
    .filter(Boolean)
);
for (const k of EXTRA_KEYS) cited.add(k);

// invert the category map: key -> category id
const keyToCat = {};
for (const [cat, blob] of Object.entries(CATEGORY_MAP)) {
  blob
    .split(/\s+/)
    .filter(Boolean)
    .forEach((k) => {
      keyToCat[k.toLowerCase()] = cat;
    });
}

const refs = [];
const missingMeta = [];
const unmapped = [];
for (const key of cited) {
  const f = bib[key];
  if (!f || !f.title) {
    missingMeta.push(key);
    continue;
  }
  const cat = keyToCat[key.toLowerCase()];
  if (!cat) unmapped.push(key);
  const { paper } = paperLink(f, key);
  const venue = cleanTeX(f.booktitle || f.journal || f.publisher || f.howpublished || f.school || "");
  refs.push({
    key,
    category: cat || "embodied",
    title: polishTitle(f.title || ""),
    authors: formatAuthors(f.author || ""),
    venue: polishVenue(venue),
    year: (f.year || "").trim(),
    paper,
    code: CODE_MAP[key] ? `https://github.com/${CODE_MAP[key]}` : null,
    page: PAGE_MAP[key] || null,
  });
}

refs.sort((a, b) => (a.year < b.year ? 1 : a.year > b.year ? -1 : a.key.localeCompare(b.key)));

const counts = {};
refs.forEach((r) => (counts[r.category] = (counts[r.category] || 0) + 1));
console.log("total:", refs.length);
console.log("by category:", counts);
console.log("missing metadata:", missingMeta);
console.log("unmapped (defaulted to embodied):", unmapped);

const moduleText =
  "// AUTO-GENERATED by scripts/build-refs.mjs — do not edit by hand.\n" +
  "// Curated, categorized bibliography of the survey.\n" +
  `export const CATEGORIES = ${JSON.stringify(CATEGORIES, null, 2)};\n\n` +
  `export const REFS = ${JSON.stringify(refs, null, 2)};\n`;
fs.writeFileSync(OUT, moduleText);
console.log("wrote", OUT);
