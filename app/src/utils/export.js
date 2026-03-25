import { PILLARS, RATINGS } from '../data/pillars';

const BACKUP_VERSION = 1;

function downloadFile(contents, mimeType, filename) {
  const blob = new Blob([contents], { type: mimeType });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportAssessmentData(assessmentState, savedAt) {
  const today = new Date().toISOString().split('T')[0];
  const payload = {
    app: 'doe-self-assessment',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    savedAt,
    state: assessmentState,
  };

  downloadFile(
    JSON.stringify(payload, null, 2),
    'application/json',
    `doe-self-assessment-backup-${today}.json`
  );
}

export function exportMarkdown(assessmentState) {
  const today = new Date().toISOString().split('T')[0];
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, null: 0 };

  const lines = [
    `# Director of Engineering — Self Assessment`,
    `Navigator · Marcura`,
    ``,
    `**Date:** ${today}`,
    ``,
    `## Rating Scale`,
    `| # | Label |`,
    `|---|-------|`,
    ...Object.entries(RATINGS).map(([k, v]) => `| ${k} | ${v} |`),
    ``,
  ];

  PILLARS.forEach(pillar => {
    lines.push(`---`);
    lines.push(`## ${pillar.title}`);
    lines.push(``);
    pillar.items.forEach((item, idx) => {
      const s = assessmentState[item.id] || {};
      const r = s.rating ?? null;
      counts[r] = (counts[r] || 0) + 1;
      const label = r ? `${r} – ${RATINGS[r]}` : 'Unrated';
      lines.push(`### ${idx + 1}. ${item.text}`);
      lines.push(`**Rating:** ${label}`);
      if (s.note?.trim()) lines.push(`**Notes:** ${s.note.trim()}`);
      lines.push(``);
    });
  });

  lines.push(`---`);
  lines.push(`## Summary`);
  lines.push(``);
  [5, 4, 3, 2, 1].forEach(r => {
    if (counts[r]) lines.push(`- **${RATINGS[r]}:** ${counts[r]}`);
  });
  if (counts[null]) lines.push(`- **Unrated:** ${counts[null]}`);

  downloadFile(lines.join('\n'), 'text/markdown', `doe-self-assessment-${today}.md`);
}
