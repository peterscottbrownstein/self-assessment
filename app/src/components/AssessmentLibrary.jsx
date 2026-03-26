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

export function AssessmentLibrary({
  assessments,
  currentAssessmentId,
  onOpen,
  onRename,
  onCreate,
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
        <button className="btn btn-data" onClick={onCreate}>New from CSV</button>
      </section>

      <section className="csv-help">
        <h3>CSV Format</h3>
        <p>
          Use either a single responsibility column or a category plus responsibility format.
          Header names like <code>responsibility</code>, <code>item</code>, <code>category</code>,
          and <code>pillar</code> are recognized automatically. Optional columns like
          <code> rating</code>, <code>note</code>, and <code>pillar_reflection</code> will also
          be imported when present.
        </p>
        <pre>{`responsibility
Defines a coherent technical strategy
Builds delivery visibility

category,responsibility,rating,note,pillar_reflection
Technical Vision,Defines a coherent technical strategy,4,"Clear direction across platform work","Strong strategic grounding with room to document more clearly"
Delivery,Builds delivery visibility,3,"Improved release clarity this year","Needs stronger measurement discipline"`}</pre>
      </section>

      <section className="library-grid">
        {assessments.map(assessment => {
          const responsibilityCount = assessment.template.pillars.reduce(
            (sum, pillar) => sum + pillar.items.length,
            0
          );

          return (
            <article
              key={assessment.id}
              className={`library-card ${assessment.id === currentAssessmentId ? 'is-current' : ''}`}
            >
              <div className="library-card-meta">
                <span className="library-card-source">{assessment.source === 'builtin' ? 'Built in' : 'CSV import'}</span>
                <span>{assessment.template.pillars.length} sections</span>
                <span>{responsibilityCount} responsibilities</span>
              </div>
              <h3>{assessment.title}</h3>
              <p className="library-card-subtitle">
                {assessment.template.subtitle || 'Custom assessment'}
              </p>
              <p className="library-card-date">Last saved: {formatDate(assessment.savedAt)}</p>
              <div className="library-card-actions">
                <button className="btn btn-save" onClick={() => onOpen(assessment.id)}>Open</button>
                <button className="btn btn-import" onClick={() => onRename(assessment.id)}>Rename</button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
