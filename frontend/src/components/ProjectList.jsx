import { useState, useEffect, useRef } from 'react';
import './ProjectList.css';

const StageOrder = ['规划', '开发', '审查', '验收'];

function getStageStatus(stages, stageName) {
  const stage = stages?.find((s) => s.name === stageName);
  return stage?.status || 'pending';
}

export default function ProjectList({ categories = [], collapseKey, focusTrigger }) {
  const [expanded, setExpanded] = useState({});

  const toggle = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const listRef = useRef(null);

  // Collapse all when collapseKey changes
  useEffect(() => {
    setExpanded({});
  }, [collapseKey]);

  // Focus first category when focusTrigger changes
  useEffect(() => {
    if (listRef.current) {
      const firstHeader = listRef.current.querySelector('.category-header');
      if (firstHeader) {
        firstHeader.focus();
        firstHeader.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [focusTrigger]);

  return (
    <section className="project-list" ref={listRef}>
      <h2 className="section-title">Projects</h2>
      {categories.map((cat, ci) => (
        <div
          key={cat.id}
          className="category-card"
          style={{ '--stagger-offset': `${(ci % 2) * 24}px` }}
        >
          <div className="category-header" tabIndex={0} onClick={() => toggle(cat.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(cat.id); } }}>
            <div className="category-left">
              <span className="category-icon">{cat.name.charAt(0)}</span>
              <div>
                <div className="category-name">{cat.name}</div>
                <div className="category-meta tabular-nums">
                  {cat.done_tasks}/{cat.total_tasks} tasks · {cat.progress}%
                </div>
              </div>
            </div>
            <div className="category-right">
              <div className="category-progress">
                <div className="progress-track">
                  <div
                    className="progress-fill shimmer"
                    style={{ width: `${cat.progress}%` }}
                  />
                </div>
              </div>
              <span className={`expand-arrow${expanded[cat.id] ? ' open' : ''}`}>▸</span>
            </div>
          </div>

          <div className={`category-projects${expanded[cat.id] ? ' expanded' : ''}`}>
            {(cat.projects || []).map((proj, i) => (
              <div
                key={proj.id}
                className="project-card"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="project-top">
                  <div className="project-name">{proj.name}</div>
                  <span className="project-progress-badge tabular-nums">{proj.progress}%</span>
                </div>
                <div className="project-desc">{proj.desc}</div>

                <div className="project-stages">
                  {StageOrder.map((stage) => {
                    const status = getStageStatus(proj.stages, stage);
                    return (
                      <div key={stage} className={`stage-dot ${status}`} title={`${stage}: ${status}`} />
                    );
                  })}
                  <span className="stage-label">{proj.current_stage}</span>
                </div>

                <div className="project-footer">
                  <div className="project-agents">
                    {(proj.agents || []).map((a) => (
                      <span key={a.name} className="project-agent" style={{ '--agent-color': a.color }}>
                        {a.name.charAt(0)}{a.name.charAt(1) || ''} {a.name}
                      </span>
                    ))}
                  </div>
                  <span className="project-activity">{proj.last_activity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
