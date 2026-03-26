function formatDate(iso) {
  if (!iso) return 'Not yet saved';

  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DownloadIcon() {
  return (
    <svg
      className="template-menu-icon"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8 2.5v6.2m0 0 2.4-2.4M8 8.7 5.6 6.3M3 11.5h10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="template-menu-caret"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="m4.5 6.5 3.5 3.5 3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function AssessmentCard({
  assessment,
  isCurrent,
  onOpen,
  onRename,
  onArchive,
  onRestore,
  archived = false,
}) {
  const responsibilityCount = assessment.template.pillars.reduce(
    (sum, pillar) => sum + pillar.items.length,
    0
  );

  return (
    <article className={`library-card ${isCurrent ? 'is-current' : ''} ${archived ? 'is-archived' : ''}`.trim()}>
      <div className="library-card-meta">
        <span className="library-card-source">{assessment.source === 'builtin' ? 'Built in' : 'CSV import'}</span>
        <span>{assessment.template.pillars.length} sections</span>
        <span>{responsibilityCount} responsibilities</span>
        {archived && <span>Archived</span>}
      </div>
      <h3>{assessment.title}</h3>
      <p className="library-card-subtitle">
        {assessment.template.subtitle || 'Custom assessment'}
      </p>
      <p className="library-card-date">Last saved: {formatDate(assessment.savedAt)}</p>
      <div className="library-card-actions">
        <button className="btn btn-save" onClick={() => onOpen(assessment.id)}>
          {archived ? 'Open' : 'Continue'}
        </button>
        <button className="btn btn-import" onClick={() => onRename(assessment.id)}>Rename</button>
        {archived ? (
          <button className="btn btn-data" onClick={() => onRestore(assessment.id)}>Restore</button>
        ) : (
          assessment.source !== 'builtin' && (
            <button className="btn btn-reset" onClick={() => onArchive(assessment.id)}>Archive</button>
          )
        )}
      </div>
    </article>
  );
}

export function AssessmentLibrary({
  assessments,
  archivedAssessments,
  currentAssessmentId,
  uploadTitle,
  onUploadTitleChange,
  onOpen,
  onRename,
  onArchive,
  onRestore,
  onCreate,
  isUploading = false,
  showArchived = false,
  onToggleArchived,
  onDownloadSample,
}) {
  return (
    <main className="main">
      <section className="library-hero">
        <div>
          <p className="library-kicker">Assessment Library</p>
          <h2>Create and revisit assessment sets</h2>
          <p>
            Upload a CSV of responsibilities as a plain list or grouped by category. Each upload
            becomes its own reusable assessment with saved ratings, notes, and reflections.
          </p>
        </div>
        <div className="library-create">
          <label className="library-upload-title">
            <span>Assessment title (optional)</span>
            <input
              type="text"
              value={uploadTitle}
              onChange={event => onUploadTitleChange(event.target.value)}
              placeholder="Self-Assessment 03/26/2026"
              disabled={isUploading}
            />
          </label>
          <button className="btn btn-data" onClick={onCreate} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'New from CSV'}
          </button>
          <details className="template-menu">
            <summary className="btn btn-import template-menu-trigger">
              <span className="template-menu-label">
                <DownloadIcon />
                Download CSV Template
              </span>
              <ChevronIcon />
            </summary>
            <div className="template-menu-list">
              <button
                type="button"
                className="template-menu-item"
                onClick={event => onDownloadSample('responsibilities_only', event)}
                disabled={isUploading}
              >
                Responsibilities only
              </button>
              <button
                type="button"
                className="template-menu-item"
                onClick={event => onDownloadSample('categories_and_responsibilities', event)}
                disabled={isUploading}
              >
                Categories + responsibilities
              </button>
              <button
                type="button"
                className="template-menu-item"
                onClick={event => onDownloadSample('categories_with_ratings', event)}
                disabled={isUploading}
              >
                With ratings
              </button>
              <button
                type="button"
                className="template-menu-item"
                onClick={event => onDownloadSample('categories_with_notes', event)}
                disabled={isUploading}
              >
                With ratings + notes
              </button>
            </div>
          </details>
        </div>
      </section>

      <details className="csv-help">
        <summary className="csv-help-summary">
          <span>CSV format guide</span>
          <span className="csv-help-summary-hint">Show example</span>
        </summary>
        <div className="csv-help-body">
          <p>
            Use either a single responsibility column or a category plus responsibility format.
            Add an optional assessment title in the field above when you upload. Header names like
            <code>responsibility</code>, <code>item</code>, <code>category</code>, and <code>pillar</code>
            are recognized automatically. Optional columns like
            <code> rating</code>, <code>note</code>, and <code>pillar_reflection</code> will also
            be imported when present.
          </p>
          <pre>{`responsibility
Defines a coherent technical strategy
Builds delivery visibility

category,responsibility,rating,note,pillar_reflection
Technical Vision,Defines a coherent technical strategy,4,"Clear direction across platform work","Strong strategic grounding with room to document more clearly"
Delivery,Builds delivery visibility,3,"Improved release clarity this year","Needs stronger measurement discipline"`}</pre>
        </div>
      </details>

      <section className="library-section">
        <div className="library-section-header">
          <h3>Active Assessments</h3>
          <span>{assessments.length}</span>
        </div>
        <div className="library-grid">
          {assessments.map(assessment => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              isCurrent={assessment.id === currentAssessmentId}
              onOpen={onOpen}
              onRename={onRename}
              onArchive={onArchive}
              onRestore={onRestore}
            />
          ))}
        </div>
      </section>

      {archivedAssessments.length > 0 && (
        <section className="library-section">
          <div className="library-section-header">
            <h3>Archived Assessments</h3>
            <button className="library-toggle" onClick={onToggleArchived}>
              {showArchived ? 'Hide archived' : `Show archived (${archivedAssessments.length})`}
            </button>
          </div>
          {showArchived && (
            <div className="library-grid">
              {archivedAssessments.map(assessment => (
                <AssessmentCard
                  key={assessment.id}
                  assessment={assessment}
                  isCurrent={assessment.id === currentAssessmentId}
                  onOpen={onOpen}
                  onRename={onRename}
                  onArchive={onArchive}
                  onRestore={onRestore}
                  archived
                />
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
