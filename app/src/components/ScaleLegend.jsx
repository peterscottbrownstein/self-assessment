import { useState } from 'react';
import { RATINGS, RATING_DEFINITIONS } from '../data/pillars';

export function ScaleLegend() {
  const [showDefinitions, setShowDefinitions] = useState(false);

  return (
    <div className="scale-legend">
      <div className="scale-legend-header">
        <h3>Rating Scale</h3>
        <button
          type="button"
          className="legend-toggle"
          onClick={() => setShowDefinitions(current => !current)}
        >
          {showDefinitions ? 'Hide definitions' : 'Show definitions'}
        </button>
      </div>

      <div className="legend-items legend-items-compact">
        {Object.entries(RATINGS).map(([k, v]) => (
          <div key={k} className="legend-item legend-item-compact">
            <div className={`legend-swatch ls-${k}`} />
            <strong>{k}</strong>
            <span className="legend-sep">|</span>
            {v}
          </div>
        ))}
      </div>

      {showDefinitions && (
        <div className="legend-items legend-items-expanded">
          {Object.entries(RATINGS).map(([k, v]) => (
            <div key={k} className="legend-item legend-item-expanded">
              <div className={`legend-swatch ls-${k}`} />
              <div className="legend-copy">
                <div className="legend-title">
                  <strong>{k}</strong>
                  <span className="legend-sep">|</span>
                  {v}
                </div>
                <div className="legend-definition">{RATING_DEFINITIONS[k]}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
