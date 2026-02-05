/**
 * Pre-converts CPL_RULE_BOOK.docx to JSON at build time.
 * Run: node scripts/convert-rules.js
 * Output: public/data/CPL_RULES.json
 */
import mammoth from 'mammoth';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const docxPath = path.join(rootDir, 'data', 'CPL_RULE_BOOK.docx');
const docxPathPublic = path.join(rootDir, 'public', 'data', 'CPL_RULE_BOOK.docx');
const outputPath = path.join(rootDir, 'public', 'data', 'CPL_RULES.json');
const cplLogoSrc = path.join(rootDir, 'data', 'cpl_logo.png');
const cplLogoDest = path.join(rootDir, 'public', 'data', 'cpl_logo.png');

function parseRulesFromHtml(html) {
  const dom = new JSDOM(html);
  const tempDiv = dom.window.document.createElement('div');
  tempDiv.innerHTML = html;

  const allNodes = Array.from(tempDiv.childNodes);
  const rules = [];
  let currentRule = null;
  let currentRuleContent = [];

  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];

    if (node.nodeType === dom.window.Node.TEXT_NODE && !node.textContent.trim()) {
      continue;
    }

    let text = '';
    if (node.nodeType === dom.window.Node.ELEMENT_NODE) {
      text = node.textContent || '';
    } else if (node.nodeType === dom.window.Node.TEXT_NODE) {
      text = node.textContent || '';
    }

    const ruleMatch = text.match(/Rule:\s*(.+)/i);

    if (ruleMatch) {
      if (currentRule !== null && currentRuleContent.length > 0) {
        rules.push({
          number: currentRule.number,
          title: currentRule.title,
          content: currentRuleContent.join('')
        });
      }

      const ruleHeader = ruleMatch[1].trim();
      const numberMatch = ruleHeader.match(/^(\d+(?:\.\d+)*)/);
      const ruleNumber = numberMatch ? numberMatch[1] : `${rules.length + 1}`;
      let ruleTitle = ruleHeader;
      if (numberMatch) {
        ruleTitle = ruleHeader.substring(numberMatch[0].length).trim();
        if (!ruleTitle) ruleTitle = ruleHeader;
      }

      currentRule = { number: ruleNumber, title: ruleTitle };
      currentRuleContent = [];
    } else if (currentRule !== null) {
      if (node.nodeType === dom.window.Node.ELEMENT_NODE) {
        const nodeElement = node;
        const nodeText = nodeElement.textContent || '';
        const hasContent = nodeText.trim() ||
          nodeElement.querySelector('img') ||
          nodeElement.tagName === 'IMG' ||
          nodeElement.innerHTML.trim();
        if (hasContent) {
          currentRuleContent.push(nodeElement.outerHTML);
        }
      } else if (node.nodeType === dom.window.Node.TEXT_NODE && node.textContent.trim()) {
        currentRuleContent.push(`<p>${node.textContent.trim()}</p>`);
      }
    }
  }

  if (currentRule !== null && currentRuleContent.length > 0) {
    rules.push({
      number: currentRule.number,
      title: currentRule.title,
      content: currentRuleContent.join('')
    });
  }

  if (rules.length === 0) {
    const textContent = tempDiv.textContent || '';
    const ruleSections = textContent.split(/Rule:/i).filter(s => s.trim().length > 0);
    ruleSections.forEach((section, index) => {
      const trimmedSection = section.trim();
      const lines = trimmedSection.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 0) {
        const firstLine = lines[0];
        const ruleNumberMatch = firstLine.match(/^(\d+(?:\.\d+)*)/);
        const ruleNumber = ruleNumberMatch ? ruleNumberMatch[1] : `${index + 1}`;
        let ruleTitle = firstLine;
        if (ruleNumberMatch) {
          ruleTitle = firstLine.substring(ruleNumberMatch[0].length).trim() || firstLine;
        }
        const ruleBody = lines.slice(1).join('\n').trim();
        rules.push({
          number: ruleNumber,
          title: ruleTitle,
          content: ruleBody ? `<p>${ruleBody.replace(/\n/g, '</p><p>')}</p>` : ''
        });
      }
    });
  }

  return rules;
}

async function convert() {
  if (fs.existsSync(cplLogoSrc)) {
    const publicDataDir = path.dirname(cplLogoDest);
    if (!fs.existsSync(publicDataDir)) {
      fs.mkdirSync(publicDataDir, { recursive: true });
    }
    fs.copyFileSync(cplLogoSrc, cplLogoDest);
    console.log('Copied cpl_logo.png to public/data/');
  }

  const inputPath = fs.existsSync(docxPath) ? docxPath : docxPathPublic;
  if (!fs.existsSync(inputPath)) {
    console.error('CPL_RULE_BOOK.docx not found at', docxPath, 'or', docxPathPublic);
    process.exit(1);
  }

  const result = await mammoth.convertToHtml(
    { path: inputPath },
    {
      convertImage: mammoth.images.inline((image) => {
        return image.read('base64').then((imageBuffer) => ({
          src: 'data:' + image.contentType + ';base64,' + imageBuffer
        }));
      })
    }
  );

  const rules = parseRulesFromHtml(result.value);

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(rules, null, 2), 'utf8');
  console.log(`Converted ${rules.length} rules to ${outputPath}`);
}

convert().catch((err) => {
  console.error(err);
  process.exit(1);
});
