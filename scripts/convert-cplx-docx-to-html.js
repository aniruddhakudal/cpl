/**
 * Convert CPLX_rules.docx to standalone HTML.
 * Run (from cpl/): node scripts/convert-cplx-docx-to-html.js
 * Output: public/data/CPLX_rules.html
 *
 * Source (first match wins): public/CPLX_rules.docx, data/CPLX_rules.docx,
 * public/data/CPLX_rules.docx
 *
 * Preserves paragraph text alignment and horizontal rules (paragraph borders),
 * matching Word OOXML (w:jc, w:pBdr), then merges into Mammoth HTML.
 */
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import JSZip from 'jszip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const docxCandidates = [
  path.join(rootDir, 'public', 'CPLX_rules.docx'),
  path.join(rootDir, 'data', 'CPLX_rules.docx'),
  path.join(rootDir, 'public', 'data', 'CPLX_rules.docx'),
];
const outputPath = path.join(rootDir, 'public', 'data', 'CPLX_rules.html');

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function findDocx() {
  for (const p of docxCandidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function isWordElement(el) {
  return el && el.nodeType === 1 && (el.namespaceURI === W_NS || el.namespaceURI === null);
}

function childElements(el) {
  const out = [];
  for (const n of el.childNodes) {
    if (n.nodeType === 1) out.push(n);
  }
  return out;
}

function firstByLocalName(parent, localName) {
  for (const el of childElements(parent)) {
    if (el.localName === localName && isWordElement(el)) return el;
  }
  return null;
}

function descChildrenByLocalName(parent, localName) {
  const out = [];
  const walk = (node) => {
    for (const el of childElements(node)) {
      if (el.localName === localName && isWordElement(el)) out.push(el);
      walk(el);
    }
  };
  walk(parent);
  return out;
}

function getVal(el) {
  if (!el) return null;
  return el.getAttribute('w:val') || el.getAttributeNS(W_NS, 'val') || null;
}

function paragraphPlainText(pEl) {
  const parts = descChildrenByLocalName(pEl, 't');
  return parts.map((t) => t.textContent || '').join('');
}

function hasVisibleBottomBorder(pPr) {
  if (!pPr) return false;
  const pBdr = firstByLocalName(pPr, 'pBdr');
  if (!pBdr) return false;
  const bottom = firstByLocalName(pBdr, 'bottom');
  if (!bottom) return false;
  const v = getVal(bottom);
  return v && v !== 'nil' && v !== 'none';
}

function describeParagraph(pEl) {
  const pPr = firstByLocalName(pEl, 'pPr');
  let align = null;
  if (pPr) {
    const jc = firstByLocalName(pPr, 'jc');
    if (jc) align = getVal(jc);
  }
  const text = paragraphPlainText(pEl);
  const emptyish = text.trim().length === 0;
  const bottomRule = hasVisibleBottomBorder(pPr);

  if (emptyish && bottomRule) {
    return { type: 'hr' };
  }
  return {
    type: 'p',
    align: align ? align.toLowerCase() : null,
    bottomRule,
  };
}

function flattenBodyBlocks(container, blocks) {
  for (const el of childElements(container)) {
    if (!isWordElement(el)) continue;
    const ln = el.localName;
    if (ln === 'p') {
      blocks.push(describeParagraph(el));
    } else if (ln === 'tbl') {
      blocks.push({ type: 'tbl' });
    } else if (ln === 'sdt') {
      const inner = firstByLocalName(el, 'sdtContent');
      if (inner) flattenBodyBlocks(inner, blocks);
    }
  }
}

async function extractDocxBlockLayout(docxPath) {
  const buf = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const file = zip.file('word/document.xml');
  if (!file) return [];
  const xml = await file.async('string');
  const dom = new JSDOM(xml, { contentType: 'text/xml' });
  const doc = dom.window.document;
  const bodies = doc.getElementsByTagNameNS(W_NS, 'body');
  let body = bodies.length ? bodies[0] : doc.getElementsByTagName('w:body')[0];
  if (!body) return [];
  const blocks = [];
  flattenBodyBlocks(body, blocks);
  return blocks;
}

function alignToCss(align) {
  if (!align) return null;
  const a = align.toLowerCase();
  if (a === 'center') return 'center';
  if (a === 'right' || a === 'end') return 'right';
  if (a === 'both' || a === 'distribute' || a === 'thaidistribute' || a === 'mediumkashida') {
    return 'justify';
  }
  if (a === 'left' || a === 'start') return 'left';
  return null;
}

function mergeStyle(existing, addition) {
  if (!addition) return existing || null;
  if (!existing) return addition;
  return `${existing.replace(/;\s*$/, '')}; ${addition}`;
}

function stripTextAlign(styleAttr) {
  if (!styleAttr) return null;
  const s = styleAttr
    .replace(/text-align\s*:\s*[^;]+;?\s*/gi, '')
    .replace(/;\s*;/g, ';')
    .replace(/^;+|;+$/g, '')
    .trim();
  return s || null;
}

function setParagraphTextAlign(el, align) {
  const cleaned = stripTextAlign(el.getAttribute('style'));
  el.setAttribute('style', mergeStyle(cleaned, `text-align: ${align}`));
}

/** Paragraphs that must stay center when DOCX sync misses alignment (see splitBeamerOverthrowHeadingBody for rule blocks). */
const CENTER_PARAGRAPH_PATTERNS = [
  /^What is CPLX ball\?/i,
  /^Semi-final\s*&\s*final\b/i,
];

function docxHr(doc) {
  const hr = doc.createElement('hr');
  hr.className = 'docx-hr';
  return hr;
}

/**
 * Beamer / Overthrow are one <p> with <br> after the title. Split so the title stays centered
 * and the body is left-aligned; keep border/padding from DOCX on the body paragraph.
 * Inserts a horizontal rule before each of these sections.
 */
function splitBeamerOverthrowHeadingBody(wrapper) {
  const candidates = [...wrapper.querySelectorAll('p')];
  for (const p of candidates) {
    if (!p.parentNode) continue;
    const text = (p.textContent || '').replace(/\s+/g, ' ').trim();
    const match =
      /^Beamer rule\b/i.test(text) || /^Overthrow rule\b/i.test(text);
    if (!match) continue;

    const html = p.innerHTML;
    const brMatch = /<br\s*\/?>/i.exec(html);
    const doc = p.ownerDocument;
    const hr = docxHr(doc);

    if (!brMatch) {
      p.parentNode.insertBefore(hr, p);
      setParagraphTextAlign(p, 'center');
      continue;
    }

    const headHtml = html.slice(0, brMatch.index).trim();
    const bodyHtml = html.slice(brMatch.index + brMatch[0].length).trim();
    if (!bodyHtml) {
      p.parentNode.insertBefore(hr, p);
      setParagraphTextAlign(p, 'center');
      continue;
    }

    const origStyle = p.getAttribute('style');
    const styleNoAlign = stripTextAlign(origStyle);

    const pHead = doc.createElement('p');
    pHead.setAttribute('style', mergeStyle(null, 'text-align: center'));
    pHead.innerHTML = headHtml;

    const pBody = doc.createElement('p');
    const bodyStyle = mergeStyle(styleNoAlign, 'text-align: left');
    if (bodyStyle) pBody.setAttribute('style', bodyStyle);
    else pBody.setAttribute('style', 'text-align: left');
    pBody.innerHTML = bodyHtml;

    p.replaceWith(hr, pHead, pBody);
  }
}

/** Inserts “Stoppage due to Sunlight” after the Overthrow body (DOCX may omit this rule). No extra hr: Overthrow paragraph already has border-bottom. Idempotent. */
function insertStoppageDueToSunlightAfterOverthrow(wrapper) {
  if (/Stoppage due to Sunlight/i.test(wrapper.textContent || '')) return;
  const paras = [...wrapper.querySelectorAll('p')];
  for (const p of paras) {
    const text = (p.textContent || '').replace(/\s+/g, ' ').trim();
    if (!/^Overthrow runs are added/i.test(text)) continue;
    const doc = p.ownerDocument;
    const pHead = doc.createElement('p');
    pHead.setAttribute('style', mergeStyle(null, 'text-align: center'));
    pHead.innerHTML = '<strong>Stoppage due to Sunlight </strong>';
    const pBody = doc.createElement('p');
    pBody.setAttribute('style', mergeStyle(null, 'text-align: left'));
    pBody.textContent =
      'Due to bright sunlight, the toss will be at 6:30am and the first match starts at 6:45am. Play may pause around 7:30am depending on conditions, and all match timings will adjust accordingly.';
    p.after(pHead, pBody);
    break;
  }
}

function applyKnownCenterHeadings(wrapper) {
  for (const el of wrapper.querySelectorAll('p')) {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (CENTER_PARAGRAPH_PATTERNS.some((re) => re.test(text))) {
      setParagraphTextAlign(el, 'center');
    }
  }
}

/** Paragraphs that must stay left even when DOCX sync applies section-wide right alignment. */
function applyKnownLeftParagraphs(wrapper) {
  for (const el of wrapper.querySelectorAll('p')) {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (
      /^Batter\s*[–—-]\s*batting team will get double runs of runs scored on that ball/i.test(text)
    ) {
      setParagraphTextAlign(el, 'left');
    }
  }
}

/** Strip duplicate page title; shell page already shows “CPL Rules”. */
function removeDocTitleParagraph(wrapper) {
  for (const p of wrapper.querySelectorAll('p')) {
    const text = (p.textContent || '').replace(/\s+/g, ' ').trim();
    if (/^Men'?s CPL X rules\s*$/i.test(text)) {
      p.remove();
    }
  }
}

/** Top-level blocks only (matches body order; avoids nested <p> inside lists). */
function collectHtmlBlocks(wrapper) {
  const blocks = [];
  for (const el of wrapper.children) {
    const tag = el.tagName;
    if (tag === 'P' || tag === 'TABLE' || /^H[1-6]$/.test(tag) || tag === 'UL' || tag === 'OL') {
      blocks.push(el);
    }
  }
  return blocks;
}

function postprocessHtmlFragment(htmlFragment, docxPath) {
  return extractDocxBlockLayout(docxPath).then((xmlBlocks) => {
    if (!xmlBlocks.length) return htmlFragment;

    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    const { document } = dom.window;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = htmlFragment;

    const htmlBlocks = collectHtmlBlocks(wrapper);
    let xi = 0;

    for (let hi = 0; hi < htmlBlocks.length; hi++) {
      const el = htmlBlocks[hi];
      const tag = el.tagName;

      if (tag === 'TABLE') {
        while (xi < xmlBlocks.length && xmlBlocks[xi].type === 'hr') {
          const hr = document.createElement('hr');
          hr.className = 'docx-hr';
          el.parentNode.insertBefore(hr, el);
          xi++;
        }
        while (xi < xmlBlocks.length && xmlBlocks[xi].type !== 'tbl') {
          xi++;
        }
        if (xi < xmlBlocks.length && xmlBlocks[xi].type === 'tbl') {
          xi++;
        }
        continue;
      }

      if (tag === 'UL' || tag === 'OL') {
        while (xi < xmlBlocks.length && xmlBlocks[xi].type === 'hr') {
          const hr = document.createElement('hr');
          hr.className = 'docx-hr';
          el.parentNode.insertBefore(hr, el);
          xi++;
        }
        const liCount = el.querySelectorAll(':scope > li').length;
        for (let j = 0; j < liCount && xi < xmlBlocks.length; j++) {
          while (xi < xmlBlocks.length && xmlBlocks[xi].type === 'hr') xi++;
          while (xi < xmlBlocks.length && xmlBlocks[xi].type === 'tbl') xi++;
          if (xi < xmlBlocks.length && xmlBlocks[xi].type === 'p') xi++;
        }
        continue;
      }

      while (xi < xmlBlocks.length && xmlBlocks[xi].type === 'hr') {
        const hr = document.createElement('hr');
        hr.className = 'docx-hr';
        el.parentNode.insertBefore(hr, el);
        xi++;
      }

      while (xi < xmlBlocks.length && xmlBlocks[xi].type === 'tbl') {
        xi++;
      }
      if (xi >= xmlBlocks.length) break;

      const xb = xmlBlocks[xi];
      if (xb.type === 'hr') {
        xi++;
        hi--;
        continue;
      }
      if (xb.type !== 'p') {
        xi++;
        hi--;
        continue;
      }
      xi++;

      const cssAlign = alignToCss(xb.align);
      if (cssAlign) {
        el.setAttribute('style', mergeStyle(el.getAttribute('style'), `text-align: ${cssAlign}`));
      }
      if (xb.bottomRule) {
        el.setAttribute(
          'style',
          mergeStyle(
            el.getAttribute('style'),
            'border-bottom: 1px solid #64748b; padding-bottom: 0.75rem; margin-bottom: 1rem'
          )
        );
      }
    }

    while (xi < xmlBlocks.length && xmlBlocks[xi].type === 'hr') {
      const hr = document.createElement('hr');
      hr.className = 'docx-hr';
      wrapper.appendChild(hr);
      xi++;
    }

    splitBeamerOverthrowHeadingBody(wrapper);
    insertStoppageDueToSunlightAfterOverthrow(wrapper);
    applyKnownCenterHeadings(wrapper);
    applyKnownLeftParagraphs(wrapper);
    removeDocTitleParagraph(wrapper);

    return wrapper.innerHTML;
  });
}

function wrapDocument(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CPL X Rules</title>
  <style>
    body { font-family: system-ui, Segoe UI, Roboto, sans-serif; line-height: 1.5; max-width: 56rem; margin: 0 auto; padding: 1.5rem; color: #1e293b; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #cbd5e1; padding: 0.5rem; text-align: left; }
    hr.docx-hr { border: none; border-top: 1px solid #64748b; margin: 1.25rem 0; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>
`;
}

async function main() {
  const docxPath = findDocx();
  if (!docxPath) {
    console.error(
      'No CPLX_rules.docx found. Expected one of:\n',
      docxCandidates.join('\n ')
    );
    process.exit(1);
  }

  console.log('Source:', docxPath);

  const result = await mammoth.convertToHtml(
    { path: docxPath },
    {
      convertImage: mammoth.images.imgElement((image) =>
        image.read('base64').then((imageBase64) => ({
          src: `data:${image.contentType};base64,${imageBase64}`,
        }))
      ),
    }
  );

  for (const msg of result.messages || []) {
    console.warn('[mammoth]', msg);
  }

  const merged = await postprocessHtmlFragment(result.value, docxPath);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, wrapDocument(merged), 'utf8');
  console.log('Wrote:', outputPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
