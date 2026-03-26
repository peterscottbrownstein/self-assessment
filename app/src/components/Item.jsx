import { useState } from 'react';
import { RATINGS } from '../data/pillars';

export function Item({ item, itemState, position, totalResponsibilities, onRate, onNote }) {
  const { rating = null, note = '' } = itemState || {};
  const [notesOpen, setNotesOpen] = useState(!!note?.trim());

  const hasNote = note?.trim();

  return (
    <div className={`item ${rating ? `rated-${rating}` : 'unrated'}`}>
      <div className="item-heading">
        <div className="item-position">
          Responsibility {position} of {totalResponsibilities}
        </div>
        <p className="item-text">
          <span className="item-number">{position}.</span> {item.text}
        </p>
      </div>
      <div className="item-controls">
        <div className="rating-group">
          {[1, 2, 3, 4, 5].map(r => (
            <button
              key={r}
              className={`rating-btn ${rating === r ? `active-${r}` : ''}`}
              onClick={() => onRate(item.id, r)}
            >
              {r} - {RATINGS[r]}
            </button>
          ))}
        </div>
        <button
          className={`notes-toggle ${hasNote ? 'has-note' : ''}`}
          onClick={() => setNotesOpen(o => !o)}
        >
          {hasNote ? 'Edit Note' : '+ Note'}
        </button>
      </div>
      {notesOpen && (
        <div className="notes-area">
          <textarea
            placeholder="Add context for your rating..."
            value={note}
            onChange={e => onNote(item.id, e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
