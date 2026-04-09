/**
 * OCR + table parse for public/cpl_x_schedule.jpeg (shared by JSON + Excel exporters).
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';
import tess from 'tesseract.js';

const { createWorker, PSM } = tess;

export const scheduleImageCandidates = (rootDir) => [
  path.join(rootDir, 'public', 'cpl_x_schedule.jpeg'),
  path.join(rootDir, 'public', 'cpl_x_schedule.jpg'),
];

export function findScheduleImage(rootDir) {
  for (const p of scheduleImageCandidates(rootDir)) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function inferTeamColumnIndicesFromHeaders(headers) {
  return headers
    .map((h, i) => ({ h: String(h || '').trim().toLowerCase(), i }))
    .filter(({ h }) => {
      if (!h) return false;
      if (/^team\s*[ab12]\s*$/.test(h)) return true;
      if (/\bteam\s+[ab]\b/.test(h)) return true;
      if (/\bhome\b|\baway\b|vs\b|versus/.test(h)) return true;
      if (/^t\d$/.test(h)) return true;
      if (h.includes('team') && !/time|respons|camera|line|umpire/.test(h)) return true;
      return false;
    })
    .map(({ i }) => i);
}

function looksLikeTimeOrMatchCell(v) {
  const s = String(v || '').trim();
  if (!s) return true;
  if (/^match/i.test(s)) return true;
  if (/^day\s*\d+/i.test(s)) return true;
  if (/semi|final/i.test(s) && s.length < 24) return true;
  if (/\d\s*[:.]\s*\d/.test(s) && s.length < 28) return true;
  if (/^\d+[ap]m|[ap]m\s*$/i.test(s.replace(/\s/g, ''))) return true;
  if (/^-+$/.test(s)) return true;
  return false;
}

function inferTeamColumnIndicesFromRows(headers, rows) {
  if (!rows.length || !headers.length) return [];
  const w = headers.length;
  const scored = [];
  for (let c = 0; c < w; c++) {
    let nameHits = 0;
    let nonEmpty = 0;
    let matchColHits = 0;
    for (const r of rows) {
      const cell = String(r[c] || '').trim();
      if (!cell) continue;
      nonEmpty++;
      if (/^match/i.test(cell)) {
        matchColHits++;
        continue;
      }
      if (looksLikeTimeOrMatchCell(cell)) continue;
      if (/^[A-Z~]{1,3}$/.test(cell) && cell.length < 4) continue;
      const letters = cell.replace(/[^a-zA-Z]/g, '').length;
      if (letters >= 4 && cell.length <= 48) nameHits++;
    }
    const denom = rows.length;
    const matchRatio = nonEmpty ? matchColHits / nonEmpty : 0;
    if (matchRatio > 0.2) continue;
    const ratio = nameHits / denom;
    scored.push({ c, ratio });
  }
  scored.sort((a, b) => b.ratio - a.ratio);
  const picks = scored.filter((s) => s.ratio >= 0.28).map((s) => s.c);
  if (picks.length >= 2) {
    return [...new Set(picks)].sort((a, b) => a - b).slice(0, 3);
  }
  if (picks.length === 1) return picks;
  return scored.slice(0, Math.min(3, scored.length)).map((s) => s.c).sort((a, b) => a - b);
}

function splitLineToCells(line) {
  let s = line.replace(/^\|+|\|+$/g, '').trim();
  if (!s) return [];
  if (s.includes('|')) {
    return s.split(/\s*\|\s*/).map((c) => c.replace(/\s+/g, ' ').trim());
  }
  return s
    .split(/\t+| {2,}/)
    .map((c) => c.trim())
    .filter((c) => c.length);
}

function normalizeGrid(rows) {
  if (rows.length === 0) return [];
  const maxW = Math.max(...rows.map((r) => r.length), 0);
  if (maxW === 0) return [];
  let grid = rows.map((r) => {
    const p = [...r];
    while (p.length < maxW) p.push('');
    return p.slice(0, maxW);
  });
  while (grid.length && grid.every((r) => !String(r[0] || '').trim())) {
    grid = grid.map((r) => r.slice(1));
  }
  return grid;
}

function parseOcrGrid(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const pipeRows = [];
  const spaceRows = [];

  for (const line of lines) {
    if (line.includes('|')) {
      const cells = line.split(/\s*\|\s*/).map((c) => c.replace(/\s+/g, ' ').trim());
      const nonEmpty = cells.filter(Boolean);
      if (nonEmpty.length >= 2) pipeRows.push(cells);
    } else {
      const cells = splitLineToCells(line);
      if (cells.length >= 2) spaceRows.push(cells);
    }
  }

  if (pipeRows.length >= 2) return normalizeGrid(pipeRows);
  if (spaceRows.length >= 2) return normalizeGrid(spaceRows);
  return [];
}

function firstRowLooksLikeHeader(row) {
  if (!row.length) return false;
  const joined = row.join(' ').toLowerCase();
  if (
    !/team|date|round|venue|time|match|umpire|semi|final|toss|respons|column|matchs|ground/.test(joined)
  ) {
    return false;
  }
  const cells = row.filter((c) => String(c).trim());
  return cells.length >= 2 && cells.every((c) => String(c).length <= 52);
}

function rowHasUsefulContent(cells) {
  const letters = (s) => (s || '').replace(/[^a-zA-Z]/g, '').length;
  const meaningful = cells.filter((c) => {
    const t = String(c || '').trim();
    return letters(t) >= 3 || /\d{1,2}\s*[:.]\s*\d{2}/.test(t) || /\b(am|pm)\b/i.test(t);
  });
  return meaningful.length >= 2;
}

export function buildScheduleFromGrid(grid) {
  if (grid.length === 0) return null;

  let headers;
  let body;

  if (firstRowLooksLikeHeader(grid[0]) && grid.length > 1) {
    headers = grid[0].map((c) => String(c).replace(/\s+/g, ' ').trim());
    body = grid.slice(1);
  } else {
    const w = grid[0].length;
    headers = Array.from({ length: w }, (_, i) => `Column ${i + 1}`);
    body = [...grid];
  }

  body = body.filter((r) => r.some((c) => String(c).trim()) && rowHasUsefulContent(r));

  if (body.length === 0) return null;

  let teamColumnIndices = inferTeamColumnIndicesFromHeaders(headers);
  const fromData = inferTeamColumnIndicesFromRows(headers, body);
  if (fromData.length >= 2) teamColumnIndices = fromData;
  else if (teamColumnIndices.length === 0 && fromData.length === 1) teamColumnIndices = fromData;
  else if (teamColumnIndices.length === 0 && headers.length >= 2) {
    teamColumnIndices = [Math.max(0, headers.length - 2), headers.length - 1];
  }

  const title = process.env.CPL_SCHEDULE_TITLE || 'CPL X schedule';

  return {
    title,
    headers,
    teamColumnIndices,
    rows: body,
  };
}

async function preprocessForOcr(srcPath, outPath) {
  await sharp(srcPath)
    .rotate()
    .resize({ width: 2800, height: 2800, fit: 'inside', withoutEnlargement: false })
    .greyscale()
    .normalize()
    .modulate({ brightness: 1.05, saturation: 0 })
    .sharpen({ sigma: 1 })
    .png()
    .toFile(outPath);
}

async function runOcr(imagePath) {
  const worker = await createWorker('eng', 1, { logger: () => {} });

  const tryRecognize = async (psm) => {
    await worker.setParameters({ tessedit_pageseg_mode: psm });
    const {
      data: { text },
    } = await worker.recognize(imagePath);
    return text;
  };

  try {
    let text = await tryRecognize(PSM.SINGLE_BLOCK);
    let grid = parseOcrGrid(text);
    if (grid.length < 3) {
      const alt = await tryRecognize(PSM.AUTO);
      const gridAlt = parseOcrGrid(alt);
      if (gridAlt.length > grid.length) {
        text = alt;
        grid = gridAlt;
      }
    }
    return text;
  } finally {
    await worker.terminate();
  }
}

/**
 * @param {string} imagePath absolute path to jpeg/jpg
 * @returns {Promise<{ ocrText: string, schedule: ReturnType<typeof buildScheduleFromGrid> }>}
 */
export async function extractScheduleFromImage(imagePath) {
  const tmpPng = path.join(os.tmpdir(), `cpl-x-schedule-ocr-${Date.now()}.png`);
  try {
    await preprocessForOcr(imagePath, tmpPng);
    const ocrText = await runOcr(tmpPng);
    const grid = parseOcrGrid(ocrText);
    const schedule = buildScheduleFromGrid(grid);
    return { ocrText, schedule };
  } finally {
    try {
      fs.unlinkSync(tmpPng);
    } catch {
      /* ignore */
    }
  }
}
