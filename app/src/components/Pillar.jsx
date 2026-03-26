import { useState } from 'react';
import { Item } from './Item';
import { PillarSummary } from './PillarSummary';
import { SummaryBar } from './SummaryBar';

export function Pillar({
  pillar,
  assessmentState,
  startIndex,
  totalResponsibilities,
  summaryText,
  onRate,
  onNote,
  onSummaryChange,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const ratedCount = pillar.items.filter(i => assessmentState[i.id]?.rating != null).length;

  return (
    <div className={`pillar ${collapsed ? 'collapsed' : ''}`}>
      <div className="pillar-header" onClick={() => setCollapsed(c => !c)}>
        <h2>{pillar.title}</h2>
        <span className="pillar-meta">
          {ratedCount}/{pillar.items.length} rated | {pillar.items.length} responsibilities
        </span>
        <span className="pillar-chevron">v</span>
      </div>
      {!collapsed && (
        <div className="pillar-body">
          <SummaryBar
            assessmentState={assessmentState}
            items={pillar.items}
            title="Pillar Summary"
            className="summary-bar-pillar"
          />
          {pillar.items.map((item, index) => (
            <Item
              key={item.id}
              item={item}
              itemState={assessmentState[item.id]}
              position={startIndex + index}
              totalResponsibilities={totalResponsibilities}
              onRate={onRate}
              onNote={onNote}
            />
          ))}
          <PillarSummary
            pillarTitle={pillar.title}
            value={summaryText}
            onChange={onSummaryChange}
          />
        </div>
      )}
    </div>
  );
}
