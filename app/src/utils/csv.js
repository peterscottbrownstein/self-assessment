import {
  VALID_RATINGS,
  buildDefaultState,
  buildDefaultSummary,
  createTemplateFromPillars,
} from './assessmentModel';

const RESPONSIBILITY_HEADERS = new Set(['responsibility', 'item', 'text', 'description']);
const CATEGORY_HEADERS = new Set(['category', 'pillar', 'group', 'section']);
const TITLE_HEADERS = new Set(['title', 'assessment', 'assessment_title', 'name']);
const RATING_HEADERS = new Set(['rating', 'score', 'value']);
const NOTE_HEADERS = new Set(['note', 'notes', 'comment', 'comments']);
const PILLAR_REFLECTION_HEADERS = new Set([
  'pillar_reflection',
  'pillar reflection',
  'reflection',
  'summary',
  'pillar_summary',
]);

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripExtension(filename) {
  return filename.replace(/\.[^.]+$/, '');
}

function humanizeFilename(filename) {
  const base = stripExtension(filename).trim();
  if (!base) return 'Uploaded Assessment';

  return base
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

export function parseCsv(text) {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }

      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows
    .map(row => row.map(cell => cell.trim()))
    .filter(row => row.some(cell => cell.length > 0));
}

function detectHeader(row) {
  const normalized = row.map(cell => cell.toLowerCase().trim());
  return normalized.some(cell =>
    RESPONSIBILITY_HEADERS.has(cell)
      || CATEGORY_HEADERS.has(cell)
      || TITLE_HEADERS.has(cell)
      || RATING_HEADERS.has(cell)
      || NOTE_HEADERS.has(cell)
      || PILLAR_REFLECTION_HEADERS.has(cell)
  );
}

function buildColumnMap(headerRow) {
  const columns = {
    category: -1,
    responsibility: -1,
    title: -1,
    rating: -1,
    note: -1,
    pillarReflection: -1,
  };

  headerRow.forEach((header, index) => {
    const normalized = header.toLowerCase().trim();
    if (columns.responsibility === -1 && RESPONSIBILITY_HEADERS.has(normalized)) {
      columns.responsibility = index;
      return;
    }

    if (columns.category === -1 && CATEGORY_HEADERS.has(normalized)) {
      columns.category = index;
      return;
    }

    if (columns.title === -1 && TITLE_HEADERS.has(normalized)) {
      columns.title = index;
      return;
    }

    if (columns.rating === -1 && RATING_HEADERS.has(normalized)) {
      columns.rating = index;
      return;
    }

    if (columns.note === -1 && NOTE_HEADERS.has(normalized)) {
      columns.note = index;
      return;
    }

    if (columns.pillarReflection === -1 && PILLAR_REFLECTION_HEADERS.has(normalized)) {
      columns.pillarReflection = index;
    }
  });

  return columns;
}

function normalizeRatingValue(value) {
  if (value == null || value === '') return null;
  const numericValue = Number(value);
  return VALID_RATINGS.has(numericValue) ? numericValue : null;
}

function buildRecordFromRow(row, columns, fallbackTitle) {
  const responsibility = columns.responsibility >= 0
    ? row[columns.responsibility]
    : row.length === 1
      ? row[0]
      : row[1] ?? row[0];

  const category = columns.category >= 0
    ? row[columns.category]
    : row.length >= 2
      ? row[0]
      : '';

  const title = columns.title >= 0 ? row[columns.title] : fallbackTitle;
  const rating = columns.rating >= 0 ? row[columns.rating] : '';
  const note = columns.note >= 0 ? row[columns.note] : '';
  const pillarReflection = columns.pillarReflection >= 0 ? row[columns.pillarReflection] : '';

  return {
    title: title?.trim() || fallbackTitle,
    category: category?.trim() || '',
    responsibility: responsibility?.trim() || '',
    rating: normalizeRatingValue(rating?.trim()),
    note: note?.trim() || '',
    pillarReflection: pillarReflection?.trim() || '',
  };
}

export function buildAssessmentFromCsv(text, filename = 'uploaded-assessment.csv') {
  const rows = parseCsv(text);
  if (rows.length === 0) {
    throw new Error('That CSV is empty.');
  }

  const defaultTitle = humanizeFilename(filename);
  const hasHeader = detectHeader(rows[0]);
  const columns = hasHeader
    ? buildColumnMap(rows[0])
    : {
        category: -1,
        responsibility: -1,
        title: -1,
        rating: -1,
        note: -1,
        pillarReflection: -1,
      };
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const records = dataRows
    .map(row => buildRecordFromRow(row, columns, defaultTitle))
    .filter(record => record.responsibility);

  if (records.length === 0) {
    throw new Error('The CSV did not contain any responsibilities to import.');
  }

  const title = records.find(record => record.title)?.title || defaultTitle;
  const hasCategories = records.some(record => record.category);
  const pillarMap = new Map();

  records.forEach(record => {
    const pillarTitle = hasCategories ? (record.category || 'Uncategorized') : 'Responsibilities';
    if (!pillarMap.has(pillarTitle)) {
      pillarMap.set(pillarTitle, []);
    }

    pillarMap.get(pillarTitle).push(record);
  });

  const pillars = Array.from(pillarMap.entries()).map(([pillarTitle, responsibilityRecords], pillarIndex) => ({
    id: `p${pillarIndex + 1}`,
    title: pillarTitle,
    items: responsibilityRecords.map((record, itemIndex) => ({
      id: `p${pillarIndex + 1}_${String(itemIndex + 1).padStart(2, '0')}`,
      text: record.responsibility,
      prev: null,
    })),
  }));

  const template = createTemplateFromPillars(pillars, {
    title,
    subtitle: `Custom assessment imported from ${filename}`,
  });

  const state = buildDefaultState(template);
  const summary = buildDefaultSummary(template);

  template.pillars.forEach((pillar, pillarIndex) => {
    const sourceRecords = Array.from(pillarMap.values())[pillarIndex];
    let pillarReflection = '';

    pillar.items.forEach((item, itemIndex) => {
      const record = sourceRecords[itemIndex];
      state[item.id] = {
        rating: record.rating,
        note: record.note,
      };

      if (!pillarReflection && record.pillarReflection) {
        pillarReflection = record.pillarReflection;
      }
    });

    summary.pillars[pillar.id] = pillarReflection;
  });

  return {
    title,
    template,
    state,
    summary,
  };
}

export function buildTemplateFromCsv(text, filename = 'uploaded-assessment.csv') {
  return buildAssessmentFromCsv(text, filename).template;
}

export function buildSampleCsv() {
  return [
    'category,responsibility',
    'Technical Vision,Defines a coherent technical strategy for the platform',
    'Technical Vision,Balances modernization work with delivery needs',
    'Delivery,Creates clear roadmaps and delivery visibility',
    'People Leadership,Builds leadership capability across the team',
  ].join('\n');
}

export function buildTemplateSlug(templateTitle) {
  return slugify(templateTitle) || 'uploaded-assessment';
}
