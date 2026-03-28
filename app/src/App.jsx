import { useEffect, useMemo, useRef, useState } from 'react';
import { useAssessment } from './hooks/useAssessment';
import { downloadSampleCsv, exportAssessmentData, exportCsv, exportMarkdown } from './utils/export';
import { buildAssessmentFromCsv, buildDefaultAssessmentTitle } from './utils/csv';
import { buildPillarStartIndexes, flattenItems, getTotalResponsibilities } from './utils/assessmentModel';
import { Header } from './components/Header';
import { SummaryBar } from './components/SummaryBar';
import { ScaleLegend } from './components/ScaleLegend';
import { Pillar } from './components/Pillar';
import { AssessmentLibrary } from './components/AssessmentLibrary';
import { ToastStack } from './components/ToastStack';

function waitForNextPaint() {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export default function App() {
  const jsonImportRef = useRef(null);
  const csvImportRef = useRef(null);
  const toastTimersRef = useRef(new Map());
  const [view, setView] = useState('library');
  const [busyMessage, setBusyMessage] = useState('');
  const [toasts, setToasts] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const {
    assessments,
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
  const activeAssessments = useMemo(
    () => assessments.filter(assessment => !assessment.archivedAt),
    [assessments]
  );
  const archivedAssessments = useMemo(
    () => assessments.filter(assessment => assessment.archivedAt),
    [assessments]
  );
  const isBusy = busyMessage.length > 0;

  useEffect(() => () => {
    toastTimersRef.current.forEach(timerId => clearTimeout(timerId));
    toastTimersRef.current.clear();
  }, []);

  function dismissToast(toastId) {
    const timerId = toastTimersRef.current.get(toastId);
    if (timerId) {
      clearTimeout(timerId);
      toastTimersRef.current.delete(toastId);
    }

    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== toastId));
  }

  function showToast(message, type = 'success', title) {
    const toastId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setToasts(currentToasts => [...currentToasts, { id: toastId, message, type, title }]);

    const timerId = setTimeout(() => {
      setToasts(currentToasts => currentToasts.filter(toast => toast.id !== toastId));
      toastTimersRef.current.delete(toastId);
    }, 4500);

    toastTimersRef.current.set(toastId, timerId);
  }

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
      showToast(error instanceof Error ? error.message : 'Unable to rename assessment.', 'error', 'Rename failed');
    }
  }

  function handleArchiveAssessment(assessmentId = currentAssessment.id) {
    const assessment = assessments.find(entry => entry.id === assessmentId) ?? currentAssessment;
    if (!confirm(`Archive "${assessment.title}"? You can restore it later from the library.`)) {
      return;
    }

    try {
      archiveAssessment(assessmentId);
      if (assessmentId === currentAssessment.id) {
        setView('library');
      }
      showToast(`"${assessment.title}" is now in the archived list.`, 'success', 'Assessment archived');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to archive assessment.', 'error', 'Archive failed');
    }
  }

  function handleRestoreAssessment(assessmentId) {
    const assessment = assessments.find(entry => entry.id === assessmentId);
    if (!assessment) return;

    restoreAssessment(assessmentId);
    showToast(`"${assessment.title}" is active again.`, 'success', 'Assessment restored');
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
      setBusyMessage('Importing saved assessment...');
      await waitForNextPaint();
      const payload = JSON.parse(await file.text());
      importState(payload);
      showToast('Assessment data imported successfully.', 'success', 'Data imported');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to import that file.', 'error', 'Import failed');
    } finally {
      setBusyMessage('');
    }
  }

  async function handleCreateFromCsv(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    try {
      setBusyMessage(`Creating assessment from ${file.name}...`);
      await waitForNextPaint();
      const nextTitle = uploadTitle.trim() || buildDefaultAssessmentTitle();
      const importedAssessment = buildAssessmentFromCsv(await file.text(), file.name, {
        title: nextTitle,
      });
      createAssessment({
        title: importedAssessment.title,
        template: importedAssessment.template,
        state: importedAssessment.state,
        summary: importedAssessment.summary,
        source: 'csv',
      });
      setUploadTitle('');
      setView('assessment');
      showToast(`"${importedAssessment.title}" is ready to review.`, 'success', 'Assessment created');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to create an assessment from that CSV.', 'error', 'CSV upload failed');
    } finally {
      setBusyMessage('');
    }
  }

  function handleExport(exportAction, event) {
    exportAction();
    event.currentTarget.closest('details')?.removeAttribute('open');
  }

  function handleSampleDownload(variant, event) {
    downloadSampleCsv(variant);
    event.currentTarget.closest('details')?.removeAttribute('open');
  }

  if (view === 'library') {
    return (
      <>
        <Header
          title="Assessment Library"
          subtitle={`${activeAssessments.length} active assessments${archivedAssessments.length ? ` | ${archivedAssessments.length} archived` : ''}`}
          actions={(
            <button className="btn btn-data" onClick={() => csvImportRef.current?.click()} disabled={isBusy}>
              {isBusy ? 'Uploading...' : 'New from CSV'}
            </button>
          )}
        />
        <input
          ref={csvImportRef}
          className="visually-hidden"
          type="file"
          accept=".csv,text/csv"
          onChange={handleCreateFromCsv}
        />
        <AssessmentLibrary
          assessments={activeAssessments}
          archivedAssessments={archivedAssessments}
          currentAssessmentId={currentAssessment.id}
          uploadTitle={uploadTitle}
          onUploadTitleChange={setUploadTitle}
          onOpen={handleOpenAssessment}
          onRename={handleRenameAssessment}
          onArchive={handleArchiveAssessment}
          onRestore={handleRestoreAssessment}
          onCreate={() => csvImportRef.current?.click()}
          isUploading={isBusy}
          showArchived={showArchived}
          onToggleArchived={() => setShowArchived(current => !current)}
          onDownloadSample={handleSampleDownload}
        />
        {isBusy && (
          <div className="app-overlay" role="status" aria-live="polite">
            <div className="app-overlay-card">
              <div className="loading-spinner" />
              <p>{busyMessage}</p>
            </div>
          </div>
        )}
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
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
            {/* Desktop: individual buttons */}
            <button className="btn btn-import header-btn-secondary" onClick={() => handleRenameAssessment()}>Rename</button>
            {currentAssessment.source !== 'builtin' && (
              <button className="btn btn-reset header-btn-secondary" onClick={() => handleArchiveAssessment()}>
                Archive
              </button>
            )}
            <button className="btn btn-import header-btn-secondary" onClick={() => jsonImportRef.current?.click()}>Import Data</button>
            <details className="export-menu header-btn-secondary">
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
            <button className="btn btn-reset header-btn-secondary" onClick={handleReset}>Reset</button>
            {/* Mobile: overflow menu */}
            <details className="export-menu header-overflow-menu">
              <summary className="btn btn-import">More</summary>
              <div className="export-menu-list">
                <button
                  type="button"
                  className="export-menu-item"
                  onClick={event => { event.currentTarget.closest('details')?.removeAttribute('open'); handleRenameAssessment(); }}
                >
                  Rename
                </button>
                {currentAssessment.source !== 'builtin' && (
                  <button
                    type="button"
                    className="export-menu-item"
                    onClick={event => { event.currentTarget.closest('details')?.removeAttribute('open'); handleArchiveAssessment(); }}
                  >
                    Archive
                  </button>
                )}
                <button
                  type="button"
                  className="export-menu-item"
                  onClick={event => { event.currentTarget.closest('details')?.removeAttribute('open'); jsonImportRef.current?.click(); }}
                >
                  Import Data
                </button>
                <div className="export-menu-divider" />
                <button
                  type="button"
                  className="export-menu-item"
                  onClick={event => handleExport(() => exportAssessmentData(currentAssessment), event)}
                >
                  Export: JSON backup
                </button>
                <button
                  type="button"
                  className="export-menu-item"
                  onClick={event => handleExport(() => exportMarkdown(currentAssessment), event)}
                >
                  Export: Markdown
                </button>
                <button
                  type="button"
                  className="export-menu-item"
                  onClick={event => handleExport(() => exportCsv(currentAssessment), event)}
                >
                  Export: CSV
                </button>
                <div className="export-menu-divider" />
                <button
                  type="button"
                  className="export-menu-item export-menu-item-danger"
                  onClick={event => { event.currentTarget.closest('details')?.removeAttribute('open'); handleReset(); }}
                >
                  Reset
                </button>
              </div>
            </details>
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
      {isBusy && (
        <div className="app-overlay" role="status" aria-live="polite">
          <div className="app-overlay-card">
            <div className="loading-spinner" />
            <p>{busyMessage}</p>
          </div>
        </div>
      )}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
