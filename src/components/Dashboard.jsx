import { useState } from 'react';
import BattingCharts from './charts/BattingCharts';
import BowlingCharts from './charts/BowlingCharts';
import FieldingCharts from './charts/FieldingCharts';
import MVPCharts from './charts/MVPCharts';
import TeamComparison from './charts/TeamComparison';
import './Dashboard.css';

const Dashboard = ({ data, season }) => {
  const [activeTab, setActiveTab] = useState('batting');

  const tabs = [
    { id: 'batting', label: '🏏 Batting', icon: '🏏' },
    { id: 'bowling', label: '⚾ Bowling', icon: '⚾' },
    { id: 'fielding', label: '🧤 Fielding', icon: '🧤' },
    { id: 'mvp', label: '⭐ MVP', icon: '⭐' },
    { id: 'teams', label: '👥 Teams', icon: '👥' }
  ];

  return (
    <div className="dashboard">
      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {activeTab === 'batting' && <BattingCharts data={data.batting} />}
        {activeTab === 'bowling' && <BowlingCharts data={data.bowling} />}
        {activeTab === 'fielding' && <FieldingCharts data={data.fielding} />}
        {activeTab === 'mvp' && <MVPCharts data={data.mvp} />}
        {activeTab === 'teams' && <TeamComparison data={data} />}
      </div>
    </div>
  );
};

export default Dashboard;

