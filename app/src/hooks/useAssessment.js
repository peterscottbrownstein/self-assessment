import { useCallback, useEffect, useRef, useState } from 'react';
import {
  APP_ID,
  createAssessmentRecord,
  createBuiltinAssessmentRecord,
  generateAssessmentId,
  normalizeAssessmentState,
  normalizeAssessmentSummary,
  normalizeTemplate,
} from '../utils/assessmentModel';

const STORAGE_KEY = 'doe-self-assessment-library';
const LEGACY_STORAGE_KEY = 'doe-self-assessment';

function buildDefaultLibrary() {
  return {
    assessments: [],
    currentAssessmentId: null,
  };
}

function normalizeLibrary(candidateLibrary) {
  if (!candidateLibrary || typeof candidateLibrary !== 'object') {
    return buildDefaultLibrary();
  }

  const rawAssessments = Array.isArray(candidateLibrary.assessments) ? candidateLibrary.assessments : [];
  const assessments = rawAssessments
    .map(record => {
      if (!record || typeof record !== 'object') return null;

      return createAssessmentRecord({
        id: typeof record.id === 'string' && record.id.trim() ? record.id.trim() : generateAssessmentId(),
        title: record.title,
        template: record.template,
        source: typeof record.source === 'string' ? record.source : 'custom',
        archivedAt: typeof record.archivedAt === 'string' ? record.archivedAt : null,
        createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
        updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : new Date().toISOString(),
        savedAt: typeof record.savedAt === 'string' ? record.savedAt : null,
        state: record.state,
        summary: record.summary,
      });
    })
    .filter(Boolean);

  const currentAssessmentId = assessments.some(
    assessment => assessment.id === candidateLibrary.currentAssessmentId
  )
    ? candidateLibrary.currentAssessmentId
    : assessments[0]?.id ?? null;

  return {
    assessments,
    currentAssessmentId,
  };
}

function migrateLegacyState() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const builtinAssessment = createBuiltinAssessmentRecord();

    return {
      assessments: [
        {
          ...builtinAssessment,
          state: normalizeAssessmentState(builtinAssessment.template, parsed.state),
          summary: normalizeAssessmentSummary(builtinAssessment.template, parsed.summary),
          savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : null,
        },
      ],
      currentAssessmentId: builtinAssessment.id,
    };
  } catch {
    return null;
  }
}

function loadLibrary() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return normalizeLibrary(JSON.parse(raw));
    }
  } catch {
    return buildDefaultLibrary();
  }

  try {
    const migrated = migrateLegacyState();
    return migrated ? normalizeLibrary(migrated) : buildDefaultLibrary();
  } catch {
    return buildDefaultLibrary();
  }
}

export function useAssessment() {
  const [library, setLibrary] = useState(loadLibrary);
  const [justSaved, setJustSaved] = useState(false);
  const autoSaveTimer = useRef(null);
  const savedIndicatorTimer = useRef(null);

  const showSavedIndicator = useCallback(() => {
    clearTimeout(savedIndicatorTimer.current);
    setJustSaved(true);
    savedIndicatorTimer.current = setTimeout(() => setJustSaved(false), 2000);
  }, []);

  const persistToStorage = useCallback((libraryToPersist) => {
    const savedAtNow = new Date().toISOString();
    const persistedLibrary = {
      ...libraryToPersist,
      assessments: libraryToPersist.assessments.map(assessment =>
        assessment.id === libraryToPersist.currentAssessmentId
          ? { ...assessment, savedAt: savedAtNow, updatedAt: savedAtNow }
          : assessment
      ),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedLibrary));
    } catch {
      // localStorage unavailable (e.g. private browsing) — continue in-memory only.
    }
    setLibrary(persistedLibrary);
    showSavedIndicator();
  }, [showSavedIndicator]);

  const scheduleAutoSave = useCallback((libraryToPersist) => {
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => persistToStorage(libraryToPersist), 1500);
  }, [persistToStorage]);

  const updateCurrentAssessment = useCallback((updater, saveMode = 'auto') => {
    setLibrary(currentLibrary => {
      const nextLibrary = {
        ...currentLibrary,
        assessments: currentLibrary.assessments.map(assessment => (
          assessment.id === currentLibrary.currentAssessmentId ? updater(assessment) : assessment
        )),
      };

      if (saveMode === 'immediate') {
        clearTimeout(autoSaveTimer.current);
        persistToStorage(nextLibrary);
        return nextLibrary;
      }

      if (saveMode === 'auto') {
        scheduleAutoSave(nextLibrary);
      }

      return nextLibrary;
    });
  }, [persistToStorage, scheduleAutoSave]);

  const currentAssessment = library.assessments.find(
    assessment => assessment.id === library.currentAssessmentId
  ) ?? null;

  const openAssessment = useCallback((assessmentId) => {
    setLibrary(currentLibrary => {
      if (!currentLibrary.assessments.some(assessment => assessment.id === assessmentId)) {
        return currentLibrary;
      }

      return {
        ...currentLibrary,
        currentAssessmentId: assessmentId,
      };
    });
  }, []);

  const createAssessment = useCallback(({ title, template, source = 'csv', state, summary }) => {
    const assessmentId = generateAssessmentId();
    const normalizedTemplate = normalizeTemplate(template);
    const nextAssessment = createAssessmentRecord({
      id: assessmentId,
      title,
      template: normalizedTemplate,
      source,
      state,
      summary,
    });

    setLibrary(currentLibrary => {
      const nextLibrary = {
        assessments: [nextAssessment, ...currentLibrary.assessments],
        currentAssessmentId: assessmentId,
      };

      scheduleAutoSave(nextLibrary);
      return nextLibrary;
    });

    return assessmentId;
  }, [scheduleAutoSave]);

  const renameAssessment = useCallback((assessmentId, title) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      throw new Error('Assessment title cannot be empty.');
    }

    setLibrary(currentLibrary => {
      const nextLibrary = {
        ...currentLibrary,
        assessments: currentLibrary.assessments.map(assessment => (
          assessment.id === assessmentId
            ? {
                ...assessment,
                title: trimmedTitle,
                template: {
                  ...assessment.template,
                  title: trimmedTitle,
                },
              }
            : assessment
        )),
      };

      scheduleAutoSave(nextLibrary);
      return nextLibrary;
    });
  }, [scheduleAutoSave]);

  const archiveAssessment = useCallback((assessmentId) => {
    setLibrary(currentLibrary => {
      const target = currentLibrary.assessments.find(assessment => assessment.id === assessmentId);
      if (!target) return currentLibrary;
      if (target.source === 'builtin') {
        throw new Error('The built-in assessment cannot be archived.');
      }

      const archivedAt = new Date().toISOString();
      const nextAssessments = currentLibrary.assessments.map(assessment => (
        assessment.id === assessmentId
          ? { ...assessment, archivedAt, updatedAt: archivedAt }
          : assessment
      ));

      const nextCurrentId = currentLibrary.currentAssessmentId === assessmentId
        ? (nextAssessments.find(assessment => !assessment.archivedAt)?.id ?? nextAssessments[0].id)
        : currentLibrary.currentAssessmentId;

      const nextLibrary = {
        assessments: nextAssessments,
        currentAssessmentId: nextCurrentId,
      };

      scheduleAutoSave(nextLibrary);
      return nextLibrary;
    });
  }, [scheduleAutoSave]);

  const restoreAssessment = useCallback((assessmentId) => {
    setLibrary(currentLibrary => {
      const nextLibrary = {
        ...currentLibrary,
        assessments: currentLibrary.assessments.map(assessment => (
          assessment.id === assessmentId
            ? { ...assessment, archivedAt: null, updatedAt: new Date().toISOString() }
            : assessment
        )),
      };

      scheduleAutoSave(nextLibrary);
      return nextLibrary;
    });
  }, [scheduleAutoSave]);

  const setRating = useCallback((itemId, rating) => {
    updateCurrentAssessment(assessment => {
      const current = assessment.state[itemId]?.rating;
      const nextRating = current === rating ? null : rating;

      return {
        ...assessment,
        state: {
          ...assessment.state,
          [itemId]: {
            ...assessment.state[itemId],
            rating: nextRating,
          },
        },
      };
    });
  }, [updateCurrentAssessment]);

  const setNote = useCallback((itemId, note) => {
    updateCurrentAssessment(assessment => ({
      ...assessment,
      state: {
        ...assessment.state,
        [itemId]: {
          ...assessment.state[itemId],
          note,
        },
      },
    }));
  }, [updateCurrentAssessment]);

  const setPillarSummary = useCallback((pillarId, value) => {
    updateCurrentAssessment(assessment => ({
      ...assessment,
      summary: {
        ...assessment.summary,
        pillars: {
          ...assessment.summary.pillars,
          [pillarId]: value,
        },
      },
    }));
  }, [updateCurrentAssessment]);

  const saveNow = useCallback(() => {
    clearTimeout(autoSaveTimer.current);
    persistToStorage(library);
  }, [library, persistToStorage]);

  const reset = useCallback(() => {
    updateCurrentAssessment(assessment => ({
      ...assessment,
      state: normalizeAssessmentState(assessment.template, null),
      summary: normalizeAssessmentSummary(assessment.template, null),
    }), 'immediate');
  }, [updateCurrentAssessment]);

  const importState = useCallback((payload) => {
    if (!payload || typeof payload !== 'object') {
      throw new Error('That file is not a valid assessment export.');
    }

    if (payload.app !== APP_ID) {
      throw new Error('That file is not from this assessment app.');
    }

    updateCurrentAssessment(assessment => {
      const importedAssessment = payload.assessment && typeof payload.assessment === 'object'
        ? payload.assessment
        : payload;
      const template = importedAssessment.template
        ? normalizeTemplate(importedAssessment.template, assessment.template)
        : assessment.template;

      return {
        ...assessment,
        title: typeof importedAssessment.title === 'string' && importedAssessment.title.trim()
          ? importedAssessment.title.trim()
          : assessment.title,
        template,
        state: normalizeAssessmentState(template, importedAssessment.state),
        summary: normalizeAssessmentSummary(template, importedAssessment.summary),
      };
    }, 'immediate');
  }, [updateCurrentAssessment]);

  useEffect(() => () => {
    clearTimeout(autoSaveTimer.current);
    clearTimeout(savedIndicatorTimer.current);
  }, []);

  return {
    assessments: library.assessments,
    currentAssessmentId: currentAssessment?.id ?? null,
    currentAssessment,
    justSaved,
    openAssessment,
    createAssessment,
    renameAssessment,
    archiveAssessment,
    restoreAssessment,
    setRating,
    setNote,
    setPillarSummary,
    saveNow,
    reset,
    importState,
  };
}
