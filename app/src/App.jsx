import { useRef } from 'react';
import { useAssessment } from './hooks/useAssessment';
import { exportAssessmentData, exportMarkdown } from './utils/export';
import { PILLARS } from './data/pillars';
import { Header } from './components/Header';
import { SummaryBar } from './components/SummaryBar';
import { ScaleLegend } from './components/ScaleLegend';
import { Pillar } from './components/Pillar';

const totalResponsibilities = PILLARS.reduce((sum, pillar) => sum + pillar.items.length, 0);
const pillarStartIndexes = PILLARS.reduce((starts, pillar, index) => {
  if (index === 0) {
    starts[pillar.id] = 1;
  } else {
    const previousPillar = PILLARS[index - 1];
    starts[pillar.id] = starts[previousPillar.id] + previousPillar.items.length;
  }

  return starts;
}, {});

export default function App() {
  const fileInputRef = useRef(null);
  const {
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
  } = useAssessment();

  function handleReset() {
    if (confirm('Reset all ratings, notes, and pillar summaries to the original imported values? This cannot be undone.')) {
      reset();
    }
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    try {
      const payload = JSON.parse(await file.text());
      importState(payload);
      alert('Assessment data imported successfully.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to import that file.');
    }
  }

  return (
    <>
      <Header
        savedAt={savedAt}
        justSaved={justSaved}
        onSave={saveNow}
        onExportData={() => exportAssessmentData(assessmentState, assessmentSummary, savedAt)}
        onImportData={() => fileInputRef.current?.click()}
        onExportMarkdown={() => exportMarkdown(assessmentState, assessmentSummary)}
        onReset={handleReset}
      />
      <input
        ref={fileInputRef}
        className="visually-hidden"
        type="file"
        accept=".json,application/json"
        onChange={handleImportFile}
      />
      <SummaryBar assessmentState={assessmentState} />
      <main className="main">
        <ScaleLegend />
        {PILLARS.map(pillar => (
          <Pillar
            key={pillar.id}
            pillar={pillar}
            assessmentState={assessmentState}
            startIndex={pillarStartIndexes[pillar.id]}
            totalResponsibilities={totalResponsibilities}
            summaryText={assessmentSummary.pillars[pillar.id] ?? ''}
            onRate={setRating}
            onNote={setNote}
            onSummaryChange={value => setPillarSummary(pillar.id, value)}
          />
        ))}
      </main>
    </>
  );
}
