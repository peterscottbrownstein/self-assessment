import { RATINGS } from '../data/pillars';

export function ScaleLegend() {
  return (
    <div className="scale-legend">
      <h3>Rating Scale</h3>
      <div className="legend-items">
        {Object.entries(RATINGS).map(([k, v]) => (
          <div key={k} className="legend-item">
            <div className={`legend-swatch ls-${k}`} />
            <strong>{k}</strong>
            <span className="legend-sep">·</span>
            {v}
          </div>
        ))}
      </div>
    </div>
  );
}
