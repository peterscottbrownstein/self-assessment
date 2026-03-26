export function PillarSummary({ pillarTitle, value, onChange }) {
  return (
    <div className="pillar-summary">
      <div className="pillar-summary-header">
        <h3>Pillar Summary</h3>
        <p>
          Capture what you are seeing in {pillarTitle}, why you rated it this way,
          and what you want to strengthen next.
        </p>
      </div>
      <textarea
        placeholder="Summarize the themes, strengths, gaps, and next steps for this pillar."
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </div>
  );
}
