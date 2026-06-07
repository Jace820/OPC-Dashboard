import { useState, useEffect } from 'react';
import './ActiveTasks.css';

export default function ActiveTasks({ projects = [], collapseKey }) {
  const [expanded, setExpanded] = useState({});

  const toggle = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Collapse all when collapseKey changes
  useEffect(() => {
    setExpanded({});
  }, [collapseKey]);

  return (
    <section className="active-tasks">
      <h2 className="section-title">Active Tasks</h2>
      {projects.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-dot" />
          <span>No active tasks</span>
        </div>
      )}
      {projects.map((proj) => (
        <div key={proj.id} className="task-card" onClick={() => toggle(proj.id)}>
          <div className="task-header">
            <div>
              <div className="task-name">{proj.name}</div>
              <div className="task-category">{proj.category_name}</div>
            </div>
            <div className="task-progress-badge tabular-nums">
              <div className="task-stream-bar">
                <div
                  className="task-stream-fill"
                  style={{ width: `${proj.progress}%` }}
                />
              </div>
              <span>{proj.progress}%</span>
            </div>
          </div>

          <div className={`task-detail${expanded[proj.id] ? ' open' : ''}`}>
            <div className="task-detail-inner">
              <div className="task-agents">
                {(proj.agents || []).map((a) => (
                  <div key={a.name} className="task-agent">
                    <span className="task-agent-dot" style={{ background: a.color }} />
                    <span>{a.name}</span>
                  </div>
                ))}
              </div>
              <div className="task-meta-row">
                <span>Last: {proj.last_activity}</span>
                <span>{proj.done}/{proj.total} done</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
