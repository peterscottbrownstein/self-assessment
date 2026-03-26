import { useState } from 'react';
import { RATINGS } from '../data/pillars';

export function Item({ item, itemState, onRate, onNote }) {
  const { rating = null, note = '' } = itemState || {};
  const [notesOpen, setNotesOpen] = useState(!!note?.trim());

  const hasNote = note?.trim();

  return (
    <div className={`item ${rating ? `rated-${rating}` : 'unrated'}`}>
      <p className="item-text">{item.text}</p>
      <div className="item-controls">
        <div className="rating-group">
          {[1, 2, 3, 4, 5].map(r => (
            <button
              key={r}
              className={`rating-btn ${rating === r ? `active-${r}` : ''}`}
              onClick={() => onRate(item.id, r)}
              title={RATINGS[r]}
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
