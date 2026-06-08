import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import AgentCards from './components/AgentCards';
import ProjectList from './components/ProjectList';
import ActiveTasks from './components/ActiveTasks';
import Settings from './components/Settings';
import './App.css';

export default function App() {
  const [data, setData] = useState({ categories: [], agents_status: [] });
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [collapseKey, setCollapseKey] = useState(0);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [toast, setToast] = useState(null);
  const [config, setConfig] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch /api/data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetch('/api/config').then(r => r.json()).then(setConfig).catch(() => {});
  }, [fetchData]);

  // 主题切换
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', config.theme || 'dark');
  }, [config.theme]);

  useWebSocket(fetchData);

  const toastTimer = useRef(null);

  // Show toast with auto-dismiss after 2 seconds
  const showToast = useCallback((message) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const isMeta = e.metaKey || e.ctrlKey;

      // ⌘K / Ctrl+K — focus first category in project list
      if (isMeta && e.key === 'k') {
        e.preventDefault();
        setFocusTrigger((n) => n + 1);
        return;
      }

      // ⌘, — open settings
      if (isMeta && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(true);
        return;
      }

      // Esc — close settings or collapse all
      if (e.key === 'Escape') {
        if (settingsOpen) {
          setSettingsOpen(false);
        } else {
          setCollapseKey((n) => n + 1);
        }
        return;
      }

      // ? — show keyboard shortcuts toast
      if (e.key === '?') {
        showToast('⌘K 搜索  ·  ⌘, 设置  ·  Esc 折叠关闭  ·  ? 快捷键');
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settingsOpen, showToast]);

  const activeProjects = data.categories
    .flatMap((c) => c.projects || [])
    .filter((p) => p.progress < 100);

  // Cleanup toast timer on unmount
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  // 合并 agents_status 和 config.agents，新增 Agent 立即显示
  const enrichedAgents = (() => {
    const cfgAgents = config.agents || {};
    const seen = new Set();
    const result = [];
    // 1. API 返回的 agents_status（包含工作状态）
    for (const a of data.agents_status) {
      const cfg = cfgAgents[a.id] || {};
      result.push({
        ...a,
        name: cfg.name ?? a.name,
        role: cfg.role ?? a.role,
        icon: cfg.icon ?? a.icon,
        color: cfg.color ?? a.color,
        desc: cfg.desc ?? a.desc,
        model: cfg.model ?? a.model,
        provider: cfg.provider ?? a.provider,
        active: cfg.active !== false,
      });
      seen.add(a.id);
    }
    // 2. config 中有但 agents_status 中没有的 Agent（新添加的，显示为空闲）
    for (const [id, cfg] of Object.entries(cfgAgents)) {
      if (!seen.has(id)) {
        result.push({
          id, name: cfg.name, role: cfg.role, icon: cfg.icon, color: cfg.color,
          status: 'idle', task: '', project: '',
          desc: cfg.desc, model: cfg.model, provider: cfg.provider,
          active: cfg.active !== false,
        });
      }
    }
    return result;
  })();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <span className="status-dot" />
          <h1>OPC Team Dashboard</h1>
        </div>
        <div className="header-right">
          <span className="header-subtitle">
            {loading ? 'Connecting…' : `${data.categories.length} categories · ${activeProjects.length} active`}
          </span>
          <button className="btn-settings" onClick={() => setSettingsOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </button>
        </div>
      </header>

      <AgentCards agents={enrichedAgents} />

      <div className="dashboard-grid">
        <ProjectList categories={data.categories} collapseKey={collapseKey} focusTrigger={focusTrigger} />
        <ActiveTasks projects={activeProjects} collapseKey={collapseKey} />
      </div>

      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)}
        config={config} onSave={(c) => { setConfig(c); setSettingsOpen(false); }} />

      {toast && (
        <div className='shortcut-toast visible'>
          <div className="shortcut-toast-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg>
          </div>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
