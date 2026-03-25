import { useRef } from 'react';
import { useAssessment } from './hooks/useAssessment';
import { exportAssessmentData, exportMarkdown } from './utils/export';
import { PILLARS } from './data/pillars';
import { Header } from './components/Header';
import { SummaryBar } from './components/SummaryBar';
import { ScaleLegend } from './components/ScaleLegend';
import { Pillar } from './components/Pillar';

export default function App() {
  const fileInputRef = useRef(null);
  const {
    assessmentState,
    savedAt,
    justSaved,
    setRating,
    setNote,
    saveNow,
    reset,
    importState,
  } = useAssessment();

  function handleReset() {
    if (confirm('Reset all ratings and notes to the original imported values? This cannot be undone.')) {
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
        onExportData={() => exportAssessmentData(assessmentState, savedAt)}
        onImportData={() => fileInputRef.current?.click()}
        onExportMarkdown={() => exportMarkdown(assessmentState)}
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
            onRate={setRating}
            onNote={setNote}
          />
        ))}
      </main>
    </>
  );
}
