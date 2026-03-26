import { RATINGS, RATING_DEFINITIONS } from '../data/pillars';
import { APP_ID, flattenItems } from './assessmentModel';
import { buildTemplateSlug } from './csv';

const BACKUP_VERSION = 2;

function downloadFile(contents, mimeType, filename) {
  const blob = new Blob([contents], { type: mimeType });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function escapeCsvValue(value) {
  const stringValue = `${value ?? ''}`;
  if (!/[",\n\r]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}

function buildCounts(items, assessmentState) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, null: 0 };

  items.forEach(item => {
    const rating = assessmentState[item.id]?.rating ?? null;
    counts[rating] = (counts[rating] || 0) + 1;
  });

  return counts;
}

function buildAverage(counts) {
  const ratedCount = [1, 2, 3, 4, 5].reduce((sum, rating) => sum + counts[rating], 0);
  const weightedScore = [1, 2, 3, 4, 5].reduce((sum, rating) => sum + (rating * counts[rating]), 0);

  if (ratedCount === 0) return null;
  return (weightedScore / ratedCount).toFixed(2);
}

function appendRatingSummaryTable(lines, counts, includeAverage = false) {
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');

  if (includeAverage) {
    const average = buildAverage(counts);
    const averageLabel = average ? '**Average**' : 'Average';
    const averageValue = average ? `**${average}/5**` : 'N/A';
    lines.push(`| ${averageLabel} | ${averageValue} |`);
  }

  [1, 2, 3, 4, 5].forEach(rating => {
    const value = counts[rating];
    const label = value !== 0 ? `**${RATINGS[rating]}**` : RATINGS[rating];
    const displayValue = value !== 0 ? `**${value}**` : value;
    lines.push(`| ${label} | ${displayValue} |`);
  });

  const unratedValue = counts[null];
  const unratedLabel = unratedValue !== 0 ? '**Unrated**' : 'Unrated';
  const unratedDisplayValue = unratedValue !== 0 ? `**${unratedValue}**` : unratedValue;
  lines.push(`| ${unratedLabel} | ${unratedDisplayValue} |`);
}

export function exportAssessmentData(assessment) {
  const today = new Date().toISOString().split('T')[0];
  const slug = buildTemplateSlug(assessment.title);
  const payload = {
    app: APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    assessment: {
      title: assessment.title,
      template: assessment.template,
      state: assessment.state,
      summary: assessment.summary,
      savedAt: assessment.savedAt,
    },
  };

  downloadFile(
    JSON.stringify(payload, null, 2),
    'application/json',
    `${slug}-backup-${today}.json`
  );
}

export function exportMarkdown(assessment) {
  const today = new Date().toISOString().split('T')[0];
  const allItems = flattenItems(assessment.template);
  const overallCounts = buildCounts(allItems, assessment.state);
  const slug = buildTemplateSlug(assessment.title);
  let globalIndex = 1;

  const lines = [
    `# ${assessment.title}`,
    assessment.template.subtitle || '',
    '',
    `**Date:** ${today}`,
    '',
    '## Rating Scale',
    '| Rating | Label | Definition |',
    '|--------|-------|------------|',
    ...Object.entries(RATINGS).map(([rating, label]) => `| ${rating} | ${label} | ${RATING_DEFINITIONS[rating]} |`),
    '',
    '## Rating Summary',
    '',
  ];

  appendRatingSummaryTable(lines, overallCounts, true);
  lines.push('');

  assessment.template.pillars.forEach(pillar => {
    const pillarCounts = buildCounts(pillar.items, assessment.state);

    lines.push('---');
    lines.push(`## ${pillar.title}`);
    lines.push('');
    lines.push('### Pillar Rating Summary');
    lines.push('');
    appendRatingSummaryTable(lines, pillarCounts, true);
    lines.push('');

    pillar.items.forEach(item => {
      const current = assessment.state[item.id] || {};
      const rating = current.rating ?? null;
      const label = rating ? `${rating} - ${RATINGS[rating]}` : 'Unrated';

      lines.push(`#### ${globalIndex}. ${item.text}`);
      lines.push(`**Rating:** ${label}`);
      if (current.note?.trim()) lines.push(`**Notes:** ${current.note.trim()}`);
      lines.push('');
      globalIndex += 1;
    });

    const pillarReflection = assessment.summary.pillars?.[pillar.id]?.trim();
    if (pillarReflection) {
      lines.push('### Pillar Reflection');
      lines.push(pillarReflection);
      lines.push('');
    }
  });

  downloadFile(lines.join('\n'), 'text/markdown', `${slug}-${today}.md`);
}

export function exportCsv(assessment) {
  const today = new Date().toISOString().split('T')[0];
  const slug = buildTemplateSlug(assessment.title);
  const rows = ['title,category,responsibility,rating,note,pillar_reflection'];

  assessment.template.pillars.forEach(pillar => {
    pillar.items.forEach(item => {
      const itemState = assessment.state[item.id] || {};
      const pillarReflection = assessment.summary.pillars?.[pillar.id] ?? '';

      rows.push([
        escapeCsvValue(assessment.title),
        escapeCsvValue(pillar.title),
        escapeCsvValue(item.text),
        escapeCsvValue(itemState.rating ?? ''),
        escapeCsvValue(itemState.note ?? ''),
        escapeCsvValue(pillarReflection),
      ].join(','));
    });
  });

  downloadFile(rows.join('\n'), 'text/csv', `${slug}-${today}.csv`);
}
