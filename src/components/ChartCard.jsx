import './ChartCard.css';

const ChartCard = ({ title, children }) => {
  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-content">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;

