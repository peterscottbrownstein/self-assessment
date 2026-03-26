import { PILLARS, RATINGS, RATING_DEFINITIONS } from '../data/pillars';

const BACKUP_VERSION = 1;

function downloadFile(contents, mimeType, filename) {
  const blob = new Blob([contents], { type: mimeType });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
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

function appendSummary(lines, counts, includeAverage = false) {
  if (includeAverage) {
    const average = buildAverage(counts);
    if (average) lines.push(`- **Average:** ${average}/5`);
  }

  [5, 4, 3, 2, 1].forEach(rating => {
    if (counts[rating]) lines.push(`- **${RATINGS[rating]}:** ${counts[rating]}`);
  });

  if (counts[null]) lines.push(`- **Unrated:** ${counts[null]}`);
}

export function exportAssessmentData(assessmentState, assessmentSummary, savedAt) {
  const today = new Date().toISOString().split('T')[0];
  const payload = {
    app: 'doe-self-assessment',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    savedAt,
    state: assessmentState,
    summary: assessmentSummary,
  };

  downloadFile(
    JSON.stringify(payload, null, 2),
    'application/json',
    `doe-self-assessment-backup-${today}.json`
  );
}

export function exportMarkdown(assessmentState, assessmentSummary) {
  const today = new Date().toISOString().split('T')[0];
  const allItems = PILLARS.flatMap(pillar => pillar.items);
  const overallCounts = buildCounts(allItems, assessmentState);
  let globalIndex = 1;

  const lines = [
    '# Director of Engineering - Self Assessment',
    'Navigator | Marcura',
    '',
    `**Date:** ${today}`,
    '',
    '## Summary',
    '',
  ];

  appendSummary(lines, overallCounts, true);

  lines.push('');
  lines.push('## Rating Scale');
  lines.push('| # | Label | Definition |');
  lines.push('|---|-------|------------|');
  Object.entries(RATINGS).forEach(([rating, label]) => {
    lines.push(`| ${rating} | ${label} | ${RATING_DEFINITIONS[rating]} |`);
  });
  lines.push('');

  PILLARS.forEach(pillar => {
    const pillarCounts = buildCounts(pillar.items, assessmentState);
    const pillarAverage = buildAverage(pillarCounts);

    lines.push('---');
    lines.push(`## ${pillar.title}`);
    lines.push('');
    lines.push('### Pillar Rating Summary');
    lines.push('');
    if (pillarAverage) lines.push(`- **Average:** ${pillarAverage}/5`);
    appendSummary(lines, pillarCounts, false);
    lines.push('');

    pillar.items.forEach(item => {
      const current = assessmentState[item.id] || {};
      const rating = current.rating ?? null;
      const label = rating ? `${rating} - ${RATINGS[rating]}` : 'Unrated';

      lines.push(`#### ${globalIndex}. ${item.text}`);
      lines.push(`**Rating:** ${label}`);
      if (current.note?.trim()) lines.push(`**Notes:** ${current.note.trim()}`);
      lines.push('');
      globalIndex += 1;
    });

    const pillarReflection = assessmentSummary.pillars?.[pillar.id]?.trim();
    if (pillarReflection) {
      lines.push('### Pillar Reflection');
      lines.push(pillarReflection);
      lines.push('');
    }
  });

  downloadFile(lines.join('\n'), 'text/markdown', `doe-self-assessment-${today}.md`);
}
