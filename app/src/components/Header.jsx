import { useEffect, useRef } from 'react';

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
  const headerRef = useRef(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;

    const updateHeight = () => {
      document.documentElement.style.setProperty('--site-header-height', `${header.offsetHeight}px`);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    window.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  return (
    <header ref={headerRef} className="site-header">
      <div>
        <h1>Director of Engineering - Self Assessment</h1>
        <p>
          Navigator | Marcura &nbsp;|&nbsp; {formatTime(savedAt)}
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
