import { useMemo, useRef, useState } from 'react';
import { useAssessment } from './hooks/useAssessment';
import { exportAssessmentData, exportCsv, exportMarkdown } from './utils/export';
import { buildAssessmentFromCsv } from './utils/csv';
import { buildPillarStartIndexes, flattenItems, getTotalResponsibilities } from './utils/assessmentModel';
import { Header } from './components/Header';
import { SummaryBar } from './components/SummaryBar';
import { ScaleLegend } from './components/ScaleLegend';
import { Pillar } from './components/Pillar';
import { AssessmentLibrary } from './components/AssessmentLibrary';

export default function App() {
  const jsonImportRef = useRef(null);
  const csvImportRef = useRef(null);
  const [view, setView] = useState('library');
  const {
    assessments,
    currentAssessment,
    justSaved,
    openAssessment,
    createAssessment,
    renameAssessment,
    setRating,
    setNote,
    setPillarSummary,
    saveNow,
    reset,
    importState,
  } = useAssessment();

  const totalResponsibilities = useMemo(
    () => getTotalResponsibilities(currentAssessment.template),
    [currentAssessment.template]
  );
  const pillarStartIndexes = useMemo(
    () => buildPillarStartIndexes(currentAssessment.template),
    [currentAssessment.template]
  );
  const summaryItems = useMemo(
    () => flattenItems(currentAssessment.template),
    [currentAssessment.template]
  );

  function handleOpenAssessment(assessmentId) {
    openAssessment(assessmentId);
    setView('assessment');
  }

  function handleRenameAssessment(assessmentId = currentAssessment.id) {
    const assessment = assessments.find(entry => entry.id === assessmentId) ?? currentAssessment;
    const nextTitle = prompt('Assessment title', assessment.title);

    if (nextTitle == null) return;

    try {
      renameAssessment(assessmentId, nextTitle);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to rename assessment.');
    }
  }

  function handleReset() {
    if (confirm('Reset all ratings, notes, and pillar reflections to their original imported values? This cannot be undone.')) {
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

  async function handleCreateFromCsv(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    try {
      const importedAssessment = buildAssessmentFromCsv(await file.text(), file.name);
      createAssessment({
        title: importedAssessment.title,
        template: importedAssessment.template,
        state: importedAssessment.state,
        summary: importedAssessment.summary,
        source: 'csv',
      });
      setView('assessment');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to create an assessment from that CSV.');
    }
  }

  function handleExport(exportAction, event) {
    exportAction();
    event.currentTarget.closest('details')?.removeAttribute('open');
  }

  if (view === 'library') {
    return (
      <>
        <Header
          title="Assessment Library"
          subtitle={`${assessments.length} saved assessments`}
          actions={<button className="btn btn-data" onClick={() => csvImportRef.current?.click()}>New from CSV</button>}
        />
        <input
          ref={csvImportRef}
          className="visually-hidden"
          type="file"
          accept=".csv,text/csv"
          onChange={handleCreateFromCsv}
        />
        <AssessmentLibrary
          assessments={assessments}
          currentAssessmentId={currentAssessment.id}
          onOpen={handleOpenAssessment}
          onRename={handleRenameAssessment}
          onCreate={() => csvImportRef.current?.click()}
        />
      </>
    );
  }

  return (
    <>
      <Header
        title={currentAssessment.title}
        subtitle={currentAssessment.template.subtitle || 'Custom assessment'}
        savedAt={currentAssessment.savedAt}
        justSaved={justSaved}
        onBack={() => setView('library')}
        actions={(
          <>
            <button className="btn btn-save" onClick={saveNow}>Save</button>
            <button className="btn btn-import" onClick={() => handleRenameAssessment()}>Rename</button>
            <button className="btn btn-import" onClick={() => jsonImportRef.current?.click()}>Import Data</button>
            <details className="export-menu">
              <summary className="btn btn-export">Export</summary>
              <div className="export-menu-list">
                <button
                  type="button"
                  className="export-menu-item"
                  onClick={event => handleExport(() => exportAssessmentData(currentAssessment), event)}
                >
                  JSON backup
                </button>
                <button
                  type="button"
                  className="export-menu-item"
                  onClick={event => handleExport(() => exportMarkdown(currentAssessment), event)}
                >
                  Markdown
                </button>
                <button
                  type="button"
                  className="export-menu-item"
                  onClick={event => handleExport(() => exportCsv(currentAssessment), event)}
                >
                  CSV for import
                </button>
              </div>
            </details>
            <button className="btn btn-reset" onClick={handleReset}>Reset</button>
          </>
        )}
      />
      <input
        ref={jsonImportRef}
        className="visually-hidden"
        type="file"
        accept=".json,application/json"
        onChange={handleImportFile}
      />
      <SummaryBar
        assessmentState={currentAssessment.state}
        items={summaryItems}
        showAverage
      />
      <main className="main">
        <ScaleLegend />
        {currentAssessment.template.pillars.map(pillar => (
          <Pillar
            key={pillar.id}
            pillar={pillar}
            assessmentState={currentAssessment.state}
            startIndex={pillarStartIndexes[pillar.id]}
            totalResponsibilities={totalResponsibilities}
            summaryText={currentAssessment.summary.pillars[pillar.id] ?? ''}
            onRate={setRating}
            onNote={setNote}
            onSummaryChange={value => setPillarSummary(pillar.id, value)}
          />
        ))}
      </main>
    </>
  );
}
