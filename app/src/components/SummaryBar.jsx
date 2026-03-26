import { PILLARS, RATINGS } from '../data/pillars';

export function SummaryBar({ assessmentState }) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, null: 0 };
  PILLARS.forEach(p =>
    p.items.forEach(item => {
      const r = assessmentState[item.id]?.rating ?? null;
      counts[r] = (counts[r] || 0) + 1;
    })
  );
  const total = PILLARS.reduce((sum, p) => sum + p.items.length, 0);

  return (
    <div className="summary-bar">
      <h2>Summary</h2>
      <div className="summary-chips">
        {[1, 2, 3, 4, 5].map(r =>
          counts[r] > 0 ? (
            <div key={r} className={`chip chip-${r}`}>
              <div className="chip-dot" />
              {counts[r]} x {RATINGS[r]}
            </div>
          ) : null
        )}
        {counts[null] > 0 && (
          <div className="chip chip-unrated">
            <div className="chip-dot" />
            {counts[null]} unrated
          </div>
        )}
      </div>
      <div className="progress-bar-wrap">
        <div className="progress-bar">
          {[1, 2, 3, 4, 5].map(r => (
            <div
              key={r}
              className={`progress-seg seg-${r}`}
              style={{ width: `${(counts[r] / total) * 100}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
