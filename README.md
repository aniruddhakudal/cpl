# CPL Cricket Tournament Dashboard

An interactive web application for visualizing cricket tournament statistics from two seasons of the CPL (Celebria Premier League) tournament.

## Features

The dashboard provides comprehensive visualizations for:

### 🏏 Batting Statistics
- Top run scorers
- Strike rate vs batting average analysis
- Boundaries (4s and 6s)
- Highest individual scores
- 50s and 100s
- Total runs by team

### ⚾ Bowling Statistics
- Top wicket takers
- Economy rate vs wickets analysis
- Best bowling figures
- Best economy rates
- Best bowling averages
- Total wickets by team

### 🧤 Fielding Statistics
- Top fielders (total dismissals)
- Most catches
- Most run outs
- Total dismissals by team

### ⭐ MVP Leaderboard
- Top MVP leaders
- MVP points breakdown (batting, bowling, fielding)
- Average MVP points by team

### 👥 Team Comparison
- Team performance comparison
- Team performance radar chart
- Total runs and wickets by team

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Data Structure

The application expects CSV files in the following structure:
```
public/
  data/
    cpl1/
      - 315370_batting_leaderboard.csv
      - 315370_bowling_leaderboard.csv
      - 315370_fielding_leaderboard.csv
      - 315370_mvp_leaderboard.csv
    cpl2/
      - 510643_batting_leaderboard.csv
      - 510643_bowling_leaderboard.csv
      - 510643_fielding_leaderboard.csv
      - 510643_mvp_leaderboard.csv
```

## Technologies Used

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Recharts** - Charting library
- **PapaParse** - CSV parsing

## Features

- Interactive charts with hover tooltips
- Season switching (CPL1 and CPL2)
- Responsive design for mobile and desktop
- Modern, clean UI with gradient backgrounds
- Multiple chart types: bar charts, scatter plots, pie charts, radar charts

## License

This project is for internal use.

