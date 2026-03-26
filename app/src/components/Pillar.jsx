import { useState } from 'react';
import { Item } from './Item';
import { PillarSummary } from './PillarSummary';

export function Pillar({ pillar, assessmentState, summaryText, onRate, onNote, onSummaryChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const ratedCount = pillar.items.filter(i => assessmentState[i.id]?.rating != null).length;

  return (
    <div className={`pillar ${collapsed ? 'collapsed' : ''}`}>
      <div className="pillar-header" onClick={() => setCollapsed(c => !c)}>
        <h2>{pillar.title}</h2>
        <span className="pillar-meta">{ratedCount}/{pillar.items.length} rated</span>
        <span className="pillar-chevron">v</span>
      </div>
      {!collapsed && (
        <div className="pillar-body">
          {pillar.items.map(item => (
            <Item
              key={item.id}
              item={item}
              itemState={assessmentState[item.id]}
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
