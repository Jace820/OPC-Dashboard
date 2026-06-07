import './Timeline.css';

export default function Timeline({ projects = [] }) {
  const entries = projects
    .filter((p) => p.last_activity)
    .sort((a, b) => (a.synced_at < b.synced_at ? 1 : -1))
    .slice(0, 8);

  return (
    <section className="timeline">
      <h2 className="section-title">Recent Activity</h2>
      <div className="timeline-track">
        {entries.map((proj, i) => (
          <div
            key={proj.id}
            className="timeline-entry"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="timeline-dot" />
            <div className="timeline-content">
              <div className="timeline-project">{proj.name}</div>
              <div className="timeline-activity">{proj.last_activity}</div>
            </div>
            {proj.synced_at && (
              <div className="timeline-time">
                {formatTime(proj.synced_at)}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '';
  }
}
