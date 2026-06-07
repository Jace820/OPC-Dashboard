import { useState } from 'react';
import './AgentCards.css';

const AGENT_META = {
  Bojack:  { color: 'var(--color-bojack)',  initial: 'BJ' },
  Athena:  { color: 'var(--color-athena)',  initial: 'AT' },
  Mercury: { color: 'var(--color-mercury)', initial: 'MC' },
  Codex:   { color: 'var(--color-codex)',   initial: 'CX' },
};

export default function AgentCards({ agents = [] }) {
  const [settingUp, setSettingUp] = useState(null);
  const [deactivating, setDeactivating] = useState(null);
  const [agentActive, setAgentActive] = useState({});

  if (!agents || agents.length === 0) return null;

  const handleSetup = async (agent) => {
    setSettingUp(agent.id);
    try {
      await fetch('/api/setup-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agent.id, name: agent.name }),
      });
      // Reload to refresh config
      setTimeout(() => window.location.reload(), 500);
    } catch (e) {
      console.error(e);
      setSettingUp(null);
    }
  };

  const handleDeactivate = async (agent) => {
    setDeactivating(agent.id);
    try {
      const res = await fetch('/api/deactivate-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agent.id }),
      });
      const data = await res.json();
      if (data.ok) {
        setAgentActive(prev => ({ ...prev, [agent.id]: false }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeactivating(null);
    }
  };

  return (
    <div className="agents-row">
      {agents.map((agent) => {
        const meta = AGENT_META[agent.name] || { color: '#888', initial: 'AG' };
        const working = agent.status === 'working';
        const active = agentActive[agent.id] !== undefined ? agentActive[agent.id] : agent.active !== false;
        return (
          <div
            key={agent.id || agent.name}
            className={`agent-card${working ? ' working' : ''}${!active ? ' inactive' : ''}`}
            style={{ '--agent-color': active ? meta.color : '#555' }}
          >
            <div className="agent-particle-bg" />
            <div className="agent-top">
              <div className="agent-avatar" style={{ background: `${meta.color}1a`, borderColor: active ? `${meta.color}40` : '#555' }}>
                <span className="agent-initial">{meta.initial}</span>
              </div>
              <div className="agent-info">
                <div className="agent-name">{agent.name}</div>
                <div className="agent-role">{agent.role}</div>
              </div>
              <div className={`agent-active-toggle ${active ? 'on' : 'off'}`} title={active ? '已激活' : '未激活'}>
                {active ? '⚡' : '⏻'}
              </div>
            </div>

            {!active && (
              <button
                className="btn-setup-agent"
                onClick={() => handleSetup(agent)}
                disabled={settingUp === agent.id}
              >
                {settingUp === agent.id ? '接入中…' : '🔧 一键接入 OPC'}
              </button>
            )}

            <div className="agent-status-badge">
              <span className={`status-indicator ${agent.status}`}>
                {working && <span className="status-ring" />}
              </span>
              <span className="agent-status-text">{active ? (working ? '工作中' : '空闲') : '未激活'}</span>
            </div>

            {active && (
              <button
                className="btn-deactivate-agent"
                onClick={() => handleDeactivate(agent)}
                disabled={deactivating === agent.id}
              >
                {deactivating === agent.id ? '退出中…' : '退出工作流'}
              </button>
            )}

            {active && agent.desc && (
              <div className="agent-desc">{agent.desc}</div>
            )}
            {active && (
              <div className="agent-tech">
                <span className="tech-label">{agent.provider}</span>
                <span className="tech-model">{agent.model}</span>
              </div>
            )}
            {active && working && agent.task && (
              <div className="agent-task">{agent.task}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
