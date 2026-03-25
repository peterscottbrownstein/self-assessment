import { useAssessment } from './hooks/useAssessment';
import { exportMarkdown } from './utils/export';
import { PILLARS } from './data/pillars';
import { Header } from './components/Header';
import { SummaryBar } from './components/SummaryBar';
import { ScaleLegend } from './components/ScaleLegend';
import { Pillar } from './components/Pillar';

export default function App() {
  const { assessmentState, savedAt, justSaved, setRating, setNote, saveNow, reset } = useAssessment();

  function handleReset() {
    if (confirm('Reset all ratings and notes to the original imported values? This cannot be undone.')) {
      reset();
    }
  }

  return (
    <>
      <Header
        savedAt={savedAt}
        justSaved={justSaved}
        onSave={saveNow}
        onExport={() => exportMarkdown(assessmentState)}
        onReset={handleReset}
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
