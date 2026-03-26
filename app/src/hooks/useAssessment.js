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

function buildDefaultSummary() {
  const pillars = {};
  PILLARS.forEach(pillar => {
    pillars[pillar.id] = '';
  });

  return {
    pillars,
    overall: '',
    nextSteps: '',
  };
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

function normalizeAssessmentSummary(candidateSummary) {
  const defaultSummary = buildDefaultSummary();

  if (!candidateSummary || typeof candidateSummary !== 'object') {
    return defaultSummary;
  }

  const normalizedPillars = { ...defaultSummary.pillars };
  if (candidateSummary.pillars && typeof candidateSummary.pillars === 'object') {
    Object.keys(normalizedPillars).forEach(pillarId => {
      normalizedPillars[pillarId] =
        typeof candidateSummary.pillars[pillarId] === 'string' ? candidateSummary.pillars[pillarId] : '';
    });
  }

  return {
    pillars: normalizedPillars,
    overall: typeof candidateSummary.overall === 'string' ? candidateSummary.overall : '',
    nextSteps: typeof candidateSummary.nextSteps === 'string' ? candidateSummary.nextSteps : '',
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        state: normalizeAssessmentState(parsed.state),
        summary: normalizeAssessmentSummary(parsed.summary),
        savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : null,
      };
    }
  } catch {
    // Fall back to the imported defaults when saved data is missing or invalid.
  }

  return {
    state: buildDefaultState(),
    summary: buildDefaultSummary(),
    savedAt: null,
  };
}

export function useAssessment() {
  const [initialState] = useState(loadState);
  const [assessmentState, setAssessmentState] = useState(initialState.state);
  const [assessmentSummary, setAssessmentSummary] = useState(initialState.summary);
  const [savedAt, setSavedAt] = useState(initialState.savedAt);
  const [justSaved, setJustSaved] = useState(false);
  const autoSaveTimer = useRef(null);

  const persistToStorage = useCallback((currentState, currentSummary) => {
    const savedAtNow = new Date().toISOString();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: currentState, summary: currentSummary, savedAt: savedAtNow })
    );
    setSavedAt(savedAtNow);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  }, []);

  const scheduleAutoSave = useCallback((currentState, currentSummary) => {
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => persistToStorage(currentState, currentSummary), 1500);
  }, [persistToStorage]);

  const setRating = useCallback((itemId, rating) => {
    setAssessmentState(prev => {
      const current = prev[itemId]?.rating;
      const next = { ...prev, [itemId]: { ...prev[itemId], rating: current === rating ? null : rating } };
      scheduleAutoSave(next, assessmentSummary);
      return next;
    });
  }, [assessmentSummary, scheduleAutoSave]);

  const setNote = useCallback((itemId, note) => {
    setAssessmentState(prev => {
      const next = { ...prev, [itemId]: { ...prev[itemId], note } };
      scheduleAutoSave(next, assessmentSummary);
      return next;
    });
  }, [assessmentSummary, scheduleAutoSave]);

  const setPillarSummary = useCallback((pillarId, value) => {
    setAssessmentSummary(prev => {
      const next = {
        ...prev,
        pillars: {
          ...prev.pillars,
          [pillarId]: value,
        },
      };
      scheduleAutoSave(assessmentState, next);
      return next;
    });
  }, [assessmentState, scheduleAutoSave]);

  const saveNow = useCallback(() => {
    setAssessmentState(currentState => {
      setAssessmentSummary(currentSummary => {
        persistToStorage(currentState, currentSummary);
        return currentSummary;
      });
      return currentState;
    });
  }, [persistToStorage]);

  const reset = useCallback(() => {
    const defaultState = buildDefaultState();
    const defaultSummary = buildDefaultSummary();
    setAssessmentState(defaultState);
    setAssessmentSummary(defaultSummary);
    persistToStorage(defaultState, defaultSummary);
  }, [persistToStorage]);

  const importState = useCallback((payload) => {
    if (!payload || typeof payload !== 'object') {
      throw new Error('That file is not a valid assessment export.');
    }

    if (payload.app !== 'doe-self-assessment') {
      throw new Error('That file is not from this assessment app.');
    }

    const nextState = normalizeAssessmentState(payload.state);
    const nextSummary = normalizeAssessmentSummary(payload.summary);
    clearTimeout(autoSaveTimer.current);
    setAssessmentState(nextState);
    setAssessmentSummary(nextSummary);
    persistToStorage(nextState, nextSummary);
  }, [persistToStorage]);

  useEffect(() => () => clearTimeout(autoSaveTimer.current), []);

  return {
    assessmentState,
    assessmentSummary,
    savedAt,
    justSaved,
    setRating,
    setNote,
    setPillarSummary,
    saveNow,
    reset,
    importState,
  };
}
