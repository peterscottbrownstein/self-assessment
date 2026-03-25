import { useState, useEffect, useCallback, useRef } from 'react';
import { PILLARS } from '../data/pillars';

const STORAGE_KEY = 'doe-self-assessment';

function buildDefaultState() {
  const s = {};
  PILLARS.forEach(p =>
    p.items.forEach(item => {
      s[item.id] = { rating: item.prev, note: '' };
    })
  );
  return s;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { state: { ...buildDefaultState(), ...parsed.state }, savedAt: parsed.savedAt };
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

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(autoSaveTimer.current), []);

  return { assessmentState, savedAt, justSaved, setRating, setNote, saveNow, reset };
}
