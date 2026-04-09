/**
 * OCR public/cpl_x_schedule.jpeg (or .jpg) and write public/data/cpl_x_schedule.json.
 *
 * Run from cpl/: npm run convert:cpl-x-schedule
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  findScheduleImage,
  extractScheduleFromImage,
  scheduleImageCandidates,
} from './lib/cpl-x-schedule-from-image.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const OUTPUT_PATH = path.join(rootDir, 'public', 'data', 'cpl_x_schedule.json');
const DEBUG_TEXT_PATH = path.join(rootDir, 'public', 'data', 'cpl_x_schedule_ocr_debug.txt');

async function main() {
  const imagePath = findScheduleImage(rootDir);
  if (!imagePath) {
    if (fs.existsSync(OUTPUT_PATH)) {
      console.warn(
        '[convert:cpl-x-schedule] No public/cpl_x_schedule.jpeg (or .jpg); keeping existing',
        path.relative(rootDir, OUTPUT_PATH)
      );
      process.exit(0);
    }
    console.error('No schedule image found. Add one of:');
    scheduleImageCandidates(rootDir).forEach((p) => console.error(' ', p));
    process.exit(1);
  }

  console.log('Preprocess:', path.relative(rootDir, imagePath));
  console.log('OCR (tesseract)…');

  const { ocrText, schedule } = await extractScheduleFromImage(imagePath);

  fs.mkdirSync(path.dirname(DEBUG_TEXT_PATH), { recursive: true });
  fs.writeFileSync(DEBUG_TEXT_PATH, ocrText, 'utf8');
  console.log('Raw OCR:', path.relative(rootDir, DEBUG_TEXT_PATH));

  if (!schedule || schedule.rows.length === 0) {
    console.error('Could not build a table from OCR. Inspect', DEBUG_TEXT_PATH);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(schedule, null, 2), 'utf8');
  console.log(
    'Wrote:',
    path.relative(rootDir, OUTPUT_PATH),
    `(${schedule.rows.length} rows, ${schedule.headers.length} columns)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
