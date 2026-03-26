import { useEffect, useRef } from 'react';

function formatTime(iso) {
  if (!iso) return 'Not yet saved';

  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function Header({
  title,
  subtitle,
  savedAt,
  justSaved,
  onBack,
  actions,
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
      <div className="site-header-copy">
        {onBack && (
          <button className="header-back" onClick={onBack}>
            All Assessments
          </button>
        )}
        <h1>{title}</h1>
        <p>
          {subtitle}
          {savedAt ? ` | Last saved ${formatTime(savedAt)}` : ''}
        </p>
      </div>
      <div className="header-actions">
        {savedAt != null && <span className={`save-indicator ${justSaved ? 'show' : ''}`}>Saved</span>}
        {actions}
      </div>
    </header>
  );
}
