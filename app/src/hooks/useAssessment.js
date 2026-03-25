import { useState, useEffect, useCallback, useRef } from 'react';
import { PILLARS } from '../data/pillars';

const STORAGE_KEY = 'doe-self-assessment';
const VALID_RATINGS = new Set([1, 2, 3, 4, 5]);

function buildDefaultState() {
  const s = {};
  PILLARS.forEach(p =>
    p.items.forEach(item => {
      s[item.id] = { rating: item.prev, note: '' };
    })
  );
  return s;
}

function normalizeAssessmentState(candidateState) {
  const defaultState = buildDefaultState();

  if (!candidateState || typeof candidateState !== 'object') {
    return defaultState;
  }

  Object.keys(defaultState).forEach(itemId => {
    const current = candidateState[itemId];
    if (!current || typeof current !== 'object') return;

    defaultState[itemId] = {
      rating: VALID_RATINGS.has(current.rating) ? current.rating : null,
      note: typeof current.note === 'string' ? current.note : '',
    };
  });

  return defaultState;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        state: normalizeAssessmentState(parsed.state),
        savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : null,
      };
    }
  } catch {
    // Fall back to the imported defaults when saved data is missing or invalid.
  }
  return { state: buildDefaultState(), savedAt: null };
}

export function useAssessment() {
  const [assessmentState, setAssessmentState] = useState(() => loadState().state);
  const [savedAt, setSavedAt] = useState(() => loadState().savedAt);
  const [justSaved, setJustSaved] = useState(false);
  const autoSaveTimer = useRef(null);

  const persistToStorage = useCallback((currentState) => {
    const savedAtNow = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: currentState, savedAt: savedAtNow }));
    setSavedAt(savedAtNow);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  }, []);

  const scheduleAutoSave = useCallback((currentState) => {
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => persistToStorage(currentState), 1500);
  }, [persistToStorage]);

  const setRating = useCallback((itemId, rating) => {
    setAssessmentState(prev => {
      const current = prev[itemId]?.rating;
      const next = { ...prev, [itemId]: { ...prev[itemId], rating: current === rating ? null : rating } };
      scheduleAutoSave(next);
      return next;
    });
  }, [scheduleAutoSave]);

  const setNote = useCallback((itemId, note) => {
    setAssessmentState(prev => {
      const next = { ...prev, [itemId]: { ...prev[itemId], note } };
      scheduleAutoSave(next);
      return next;
    });
  }, [scheduleAutoSave]);

  const saveNow = useCallback(() => {
    setAssessmentState(current => {
      persistToStorage(current);
      return current;
    });
  }, [persistToStorage]);

  const reset = useCallback(() => {
    const defaultState = buildDefaultState();
    setAssessmentState(defaultState);
    persistToStorage(defaultState);
  }, [persistToStorage]);

  const importState = useCallback((payload) => {
    if (!payload || typeof payload !== 'object') {
      throw new Error('That file is not a valid assessment export.');
    }

    if (payload.app !== 'doe-self-assessment') {
      throw new Error('That file is not from this assessment app.');
    }

    const nextState = normalizeAssessmentState(payload.state);
    clearTimeout(autoSaveTimer.current);
    setAssessmentState(nextState);
    persistToStorage(nextState);
  }, [persistToStorage]);

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(autoSaveTimer.current), []);

  return { assessmentState, savedAt, justSaved, setRating, setNote, saveNow, reset, importState };
}
