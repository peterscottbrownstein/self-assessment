import { PILLARS } from '../data/pillars';

export const APP_ID = 'doe-self-assessment';
export const DEFAULT_ASSESSMENT_TITLE = 'Director of Engineering - Self Assessment';
export const DEFAULT_ASSESSMENT_SUBTITLE = 'Navigator | Marcura';
export const VALID_RATINGS = new Set([1, 2, 3, 4, 5]);

function cloneItem(item) {
  return {
    id: item.id,
    text: item.text,
    prev: VALID_RATINGS.has(item.prev) ? item.prev : null,
  };
}

function clonePillar(pillar) {
  return {
    id: pillar.id,
    title: pillar.title,
    items: pillar.items.map(cloneItem),
  };
}

export function createTemplateFromPillars(pillars, options = {}) {
  return {
    title: options.title ?? DEFAULT_ASSESSMENT_TITLE,
    subtitle: options.subtitle ?? DEFAULT_ASSESSMENT_SUBTITLE,
    pillars: pillars.map(clonePillar),
  };
}

export function getDefaultTemplate() {
  return createTemplateFromPillars(PILLARS);
}

export function flattenItems(template) {
  return template.pillars.flatMap(pillar => pillar.items);
}

export function getTotalResponsibilities(template) {
  return flattenItems(template).length;
}

export function buildPillarStartIndexes(template) {
  return template.pillars.reduce((starts, pillar, index) => {
    if (index === 0) {
      starts[pillar.id] = 1;
      return starts;
    }

    const previousPillar = template.pillars[index - 1];
    starts[pillar.id] = starts[previousPillar.id] + previousPillar.items.length;
    return starts;
  }, {});
}

export function buildDefaultState(template) {
  const state = {};

  template.pillars.forEach(pillar => {
    pillar.items.forEach(item => {
      state[item.id] = {
        rating: VALID_RATINGS.has(item.prev) ? item.prev : null,
        note: '',
      };
    });
  });

  return state;
}

export function buildDefaultSummary(template) {
  const pillars = {};

  template.pillars.forEach(pillar => {
    pillars[pillar.id] = '';
  });

  return {
    pillars,
  };
}

export function normalizeTemplate(candidateTemplate, fallbackTemplate = getDefaultTemplate()) {
  if (!candidateTemplate || typeof candidateTemplate !== 'object') {
    return fallbackTemplate;
  }

  const rawPillars = Array.isArray(candidateTemplate.pillars) ? candidateTemplate.pillars : [];
  const normalizedPillars = rawPillars
    .map((pillar, pillarIndex) => {
      if (!pillar || typeof pillar !== 'object') return null;

      const rawItems = Array.isArray(pillar.items) ? pillar.items : [];
      const normalizedItems = rawItems
        .map((item, itemIndex) => {
          if (!item || typeof item !== 'object') return null;

          const text = typeof item.text === 'string' ? item.text.trim() : '';
          if (!text) return null;

          return {
            id: typeof item.id === 'string' && item.id.trim()
              ? item.id.trim()
              : `p${pillarIndex + 1}_${String(itemIndex + 1).padStart(2, '0')}`,
            text,
            prev: VALID_RATINGS.has(item.prev) ? item.prev : null,
          };
        })
        .filter(Boolean);

      if (normalizedItems.length === 0) return null;

      return {
        id: typeof pillar.id === 'string' && pillar.id.trim() ? pillar.id.trim() : `p${pillarIndex + 1}`,
        title: typeof pillar.title === 'string' && pillar.title.trim()
          ? pillar.title.trim()
          : `Pillar ${pillarIndex + 1}`,
        items: normalizedItems,
      };
    })
    .filter(Boolean);

  if (normalizedPillars.length === 0) {
    return fallbackTemplate;
  }

  return {
    title: typeof candidateTemplate.title === 'string' && candidateTemplate.title.trim()
      ? candidateTemplate.title.trim()
      : fallbackTemplate.title,
    subtitle: typeof candidateTemplate.subtitle === 'string'
      ? candidateTemplate.subtitle.trim()
      : fallbackTemplate.subtitle,
    pillars: normalizedPillars,
  };
}

export function normalizeAssessmentState(template, candidateState) {
  const defaultState = buildDefaultState(template);

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

export function normalizeAssessmentSummary(template, candidateSummary) {
  const defaultSummary = buildDefaultSummary(template);

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
  };
}

export function createAssessmentRecord({
  id,
  title,
  template,
  source = 'builtin',
  archivedAt = null,
  createdAt = new Date().toISOString(),
  updatedAt = createdAt,
  savedAt = null,
  state,
  summary,
}) {
  const normalizedTemplate = normalizeTemplate(template);

  return {
    id,
    title: typeof title === 'string' && title.trim() ? title.trim() : normalizedTemplate.title,
    source,
    archivedAt: typeof archivedAt === 'string' ? archivedAt : null,
    createdAt,
    updatedAt,
    savedAt,
    template: normalizedTemplate,
    state: normalizeAssessmentState(normalizedTemplate, state),
    summary: normalizeAssessmentSummary(normalizedTemplate, summary),
  };
}

export function createBuiltinAssessmentRecord() {
  const template = getDefaultTemplate();

  return createAssessmentRecord({
    id: 'assessment_default',
    title: template.title,
    template,
    source: 'builtin',
  });
}

export function generateAssessmentId() {
  return `assessment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
