function formatTime(iso) {
  if (!iso) return 'Not yet saved';
  return (
    'Last saved ' +
    new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  );
}

export function Header({
  savedAt,
  justSaved,
  onExportData,
  onImportData,
  onSave,
  onExportMarkdown,
  onReset,
}) {
  return (
    <header className="site-header">
      <div>
        <h1>Director of Engineering - Self Assessment</h1>
        <p>
          Navigator · Marcura &nbsp;·&nbsp; {formatTime(savedAt)}
        </p>
      </div>
      <div className="header-actions">
        <span className={`save-indicator ${justSaved ? 'show' : ''}`}>Saved</span>
        <button className="btn btn-save" onClick={onSave}>Save</button>
        <button className="btn btn-data" onClick={onExportData}>Export Data</button>
        <button className="btn btn-import" onClick={onImportData}>Import Data</button>
        <button className="btn btn-export" onClick={onExportMarkdown}>Export .md</button>
        <button className="btn btn-reset" onClick={onReset}>Reset</button>
      </div>
    </header>
  );
}
