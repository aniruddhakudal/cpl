import Papa from 'papaparse';

const loadCSV = async (path) => {
  const response = await fetch(path);
  const text = await response.text();
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error)
    });
  });
};

export const loadSeasonData = async (season) => {
  const seasonPath = season === 'cpl1' ? 'cpl1' : 'cpl2';
  const seasonId = season === 'cpl1' ? '315370' : '510643';
  
  try {
    const [batting, bowling, fielding, mvp] = await Promise.all([
      loadCSV(`/data/${seasonPath}/${seasonId}_batting_leaderboard.csv`),
      loadCSV(`/data/${seasonPath}/${seasonId}_bowling_leaderboard.csv`),
      loadCSV(`/data/${seasonPath}/${seasonId}_fielding_leaderboard.csv`),
      loadCSV(`/data/${seasonPath}/${seasonId}_mvp_leaderboard.csv`)
    ]);

    // Clean and parse numeric values
    const cleanData = (data, numericFields) => {
      return data.map(row => {
        const cleaned = { ...row };
        numericFields.forEach(field => {
          if (cleaned[field] && cleaned[field] !== '-' && cleaned[field] !== '') {
            cleaned[field] = parseFloat(cleaned[field]) || 0;
          } else {
            cleaned[field] = 0;
          }
        });
        return cleaned;
      });
    };

    return {
      batting: cleanData(batting, ['total_runs', 'average', 'strike_rate', 'ball_faced', '4s', '6s', '50s', '100s', 'highest_run', 'not_out', 'innings']),
      bowling: cleanData(bowling, ['total_wickets', 'economy', 'SR', 'avg', 'runs', 'balls', 'overs', 'dot_balls', 'maidens', 'highest_wicket']),
      fielding: cleanData(fielding, ['catches', 'run_outs', 'stumpings', 'total_catches', 'total_dismissal', 'caught_behind', 'assist_run_outs', 'caught_and_bowl']),
      mvp: cleanData(mvp, ['Matches', 'Batting', 'Bowling', 'Fielding', 'Total'])
    };
  } catch (error) {
    console.error(`Error loading data for ${season}:`, error);
    throw error;
  }
};

export const getAllSeasonsData = async () => {
  const [cpl1, cpl2] = await Promise.all([
    loadSeasonData('cpl1'),
    loadSeasonData('cpl2')
  ]);
  
  return { cpl1, cpl2 };
};

