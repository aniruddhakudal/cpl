/**
 * Build public/data/cpl_x_schedule.json from a CSV (e.g. typed from the schedule image in Excel).
 *
 * Usage (from cpl/):
 *   npm run import:cpl-x-schedule
 *   npm run import:cpl-x-schedule -- path/to/file.csv
 *
 * Default input: public/data/cpl_x_schedule.csv
 * Optional env: CPL_SCHEDULE_TITLE="My title"
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const defaultInput = path.join(rootDir, 'public', 'data', 'cpl_x_schedule.csv');
const outputPath = path.join(rootDir, 'public', 'data', 'cpl_x_schedule.json');

function inferTeamColumnIndices(headers) {
  return headers
    .map((h, i) => ({ h: String(h || '').trim().toLowerCase(), i }))
    .filter(({ h }) => /team|home|away|side|vs\b|versus/.test(h))
    .map(({ i }) => i);
}

function main() {
  const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultInput;
  if (!fs.existsSync(inputPath)) {
    console.error('Missing CSV:', inputPath);
    console.error('Copy public/data/cpl_x_schedule.sample.csv to cpl_x_schedule.csv and edit, or pass a path.');
    process.exit(1);
  }
  const csv = fs.readFileSync(inputPath, 'utf8');
  const parsed = Papa.parse(csv, { skipEmptyLines: true });
  const data = parsed.data.filter((row) => Array.isArray(row) && row.some((c) => String(c).trim()));

  if (data.length < 2) {
    console.error('CSV needs a header row plus at least one data row.');
    process.exit(1);
  }

  const headers = data[0].map((c) => String(c).trim());
  const width = headers.length;
  const rows = data.slice(1).map((row) => {
    const out = [];
    for (let i = 0; i < width; i++) {
      out.push(row[i] != null && row[i] !== '' ? String(row[i]).trim() : '');
    }
    return out;
  });

  let teamColumnIndices = inferTeamColumnIndices(headers);
  if (teamColumnIndices.length === 0) {
    if (headers.length >= 2) {
      teamColumnIndices = [Math.max(0, headers.length - 2), headers.length - 1];
    } else {
      teamColumnIndices = [0];
    }
    console.warn('No team-like column headers found; using indices:', teamColumnIndices.join(', '));
  }

  const title = process.env.CPL_SCHEDULE_TITLE || 'CPL X schedule';
  const out = { title, headers, teamColumnIndices, rows };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote:', outputPath, `(${rows.length} rows, teams in columns ${teamColumnIndices.join(', ')})`);
}

main();
