import { PILLARS, RATINGS } from '../data/pillars';

function buildCounts(items, assessmentState) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, null: 0 };

  items.forEach(item => {
    const r = assessmentState[item.id]?.rating ?? null;
    counts[r] = (counts[r] || 0) + 1;
  });

  return counts;
}

export function SummaryBar({
  assessmentState,
  items,
  title = 'Summary',
  className = '',
}) {
  const summaryItems = items ?? PILLARS.flatMap(pillar => pillar.items);
  const counts = buildCounts(summaryItems, assessmentState);
  const total = summaryItems.length;
  const ratedCount = [1, 2, 3, 4, 5].reduce((sum, rating) => sum + counts[rating], 0);
  const weightedScore = [1, 2, 3, 4, 5].reduce((sum, rating) => sum + (rating * counts[rating]), 0);
  const averageScore = ratedCount > 0 ? (weightedScore / ratedCount).toFixed(2) : null;
  const showAverage = !items;

  return (
    <div className={`summary-bar ${className}`.trim()}>
      <h2>{title}</h2>
      {showAverage && averageScore && (
        <div className="summary-average">
          <span className="summary-average-label">Average</span>
          <span className="summary-average-value">{averageScore}/5</span>
        </div>
      )}
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
              style={{ width: total > 0 ? `${(counts[r] / total) * 100}%` : '0%' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
