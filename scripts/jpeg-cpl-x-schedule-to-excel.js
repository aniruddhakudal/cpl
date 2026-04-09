/**
 * OCR public/cpl_x_schedule.jpeg (or .jpg) and write public/data/cpl_x_schedule.xlsx.
 *
 * Run from cpl/: npm run convert:cpl-x-schedule-xlsx
 * Optional: npm run convert:cpl-x-schedule-xlsx -- path/to/out.xlsx
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';
import {
  findScheduleImage,
  extractScheduleFromImage,
  scheduleImageCandidates,
} from './lib/cpl-x-schedule-from-image.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const DEFAULT_OUT = path.join(rootDir, 'public', 'data', 'cpl_x_schedule.xlsx');
const DEBUG_TEXT_PATH = path.join(rootDir, 'public', 'data', 'cpl_x_schedule_ocr_debug.txt');

function scheduleToAoa(schedule) {
  const headerRow = schedule.headers.map((h, i) => (String(h).trim() ? h : `Column ${i + 1}`));
  return [headerRow, ...schedule.rows];
}

async function main() {
  const imagePath = findScheduleImage(rootDir);
  if (!imagePath) {
    console.error('No schedule image found. Add one of:');
    scheduleImageCandidates(rootDir).forEach((p) => console.error(' ', p));
    process.exit(1);
  }

  const outPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_OUT;

  console.log('Image:', path.relative(rootDir, imagePath));
  console.log('OCR (tesseract)…');

  const { ocrText, schedule } = await extractScheduleFromImage(imagePath);

  fs.mkdirSync(path.dirname(DEBUG_TEXT_PATH), { recursive: true });
  fs.writeFileSync(DEBUG_TEXT_PATH, ocrText, 'utf8');

  if (!schedule || schedule.rows.length === 0) {
    console.error('Could not build a table from OCR. Inspect', path.relative(rootDir, DEBUG_TEXT_PATH));
    process.exit(1);
  }

  const aoa = scheduleToAoa(schedule);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const ref = ws['!ref'];
  if (ref) {
    const range = XLSX.utils.decode_range(ref);
    for (let c = range.s.c; c <= range.e.c; c++) {
      let max = 10;
      for (let r = range.s.r; r <= range.e.r; r++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        const v = cell && cell.v != null ? String(cell.v) : '';
        max = Math.max(max, v.length);
      }
      ws['!cols'] = ws['!cols'] || [];
      ws['!cols'][c] = { wch: Math.min(max + 2, 48) };
    }
  }

  const wb = XLSX.utils.book_new();
  const sheetName = (schedule.title || 'Schedule').slice(0, 31).replace(/[*?:\\/\[\]]/g, '');
  XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Schedule');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  XLSX.writeFile(wb, outPath);

  console.log('Wrote:', path.relative(rootDir, outPath), `(${schedule.rows.length} data rows)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
