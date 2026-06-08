import { useState, useEffect, useCallback } from 'react';
import './Settings.css';

const TABS = ['通用', '外观', 'Agent', '分类', '数据源', '关于'];

export default function Settings({ isOpen, onClose, config, onSave }) {
  const [local, setLocal] = useState(config || {});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('通用');
  const [scanned, setScanned] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // ── 打开设置时重新获取最新 config ──
  useEffect(() => {
    if (isOpen) {
      fetch('/api/config')
        .then(r => r.json())
        .then(cfg => { setLocal(cfg); })
        .catch(() => {});
      // 检测 WebSocket 连接状态
      setWsConnected(!!window._wsReady);
    }
  }, [isOpen]);

  // ── 监听 WebSocket 状态 ──
  useEffect(() => {
    const check = () => setWsConnected(!!window._wsReady);
    const id = setInterval(check, 3000);
    return () => clearInterval(id);
  }, []);

  if (!isOpen) return null;

  const update = (section, key, value) => {
    setLocal(prev => {
      const next = { ...prev };
      if (section) { next[section] = { ...(next[section] || {}), [key]: value }; }
      else { next[key] = value; }
      return next;
    });
  };

  const saveNow = async (data) => {
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const merged = await res.json();
        setLocal(merged);
        if (onSave) onSave(merged);
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  // ── 单个 Agent 字段保存（即时生效） ──
  const saveAgentField = async (id, field, value) => {
    try {
      await fetch(`/api/agent/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
    } catch (e) { console.error(e); }
  };

  const doScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/scan');
      const data = await res.json();
      setScanned(data.agents || []);
    } catch (e) { console.error(e); }
    setScanning(false);
  };

  const addScannedAgent = (agent) => {
    const existing = Object.values(local.agents || {}).find(a => a.name === agent.name);
    if (existing) return;
    const newId = agent.id + '-' + Date.now();
    const next = {
      ...(local.agents || {}),
      [newId]: {
        name: agent.name, role: agent.role, icon: agent.icon, color: agent.color,
        model: agent.model, provider: agent.provider, desc: '', active: false,
      }
    };
    saveNow({ ...local, agents: next });
  };

  const removeAgent = async (id) => {
    const next = { ...(local.agents || {}) };
    delete next[id];
    // 同时调用 deactivate 清理 wiki
    await fetch('/api/deactivate-agent', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {});
    saveNow({ ...local, agents: next });
  };

  const agents = local.agents || {};
  const categories = local.categories || [];

  return (
    <>
      <div className="settings-overlay" onClick={onClose} />
      <div className="settings-panel">
        <div className="settings-header">
          <h2>设置</h2>
          <button className="settings-close" onClick={onClose}>×</button>
        </div>
        <div className="settings-tabs">
          {TABS.map(t => (
            <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <div className="settings-body">
          {tab === '通用' && (
            <>
              <section className="settings-group"><h3>服务器</h3>
                <div className="setting-row"><label>端口</label><input type="number" value={local.port || 8090} className="input-sm" onChange={e => update(null, 'port', parseInt(e.target.value))} /></div>
                <div className="setting-row"><label>主机地址</label><input value={local.host || '0.0.0.0'} onChange={e => update(null, 'host', e.target.value)} /></div>
                <div className="setting-row"><label>刷新间隔</label><select value={local.refresh_interval || 2} onChange={e => update(null, 'refresh_interval', parseInt(e.target.value))}><option value={1}>1 秒</option><option value={2}>2 秒</option><option value={5}>5 秒</option><option value={10}>10 秒</option><option value={30}>30 秒</option></select></div>
              </section>
              <section className="settings-group"><h3>连接状态</h3>
                <div className="setting-row"><label>WebSocket</label><span className={`status-badge ${wsConnected ? 'on' : 'off'}`}>{wsConnected ? '已连接' : '未连接'}</span></div>
                <div className="setting-row"><label>自动同步</label><span className="status-badge on">运行中</span></div>
              </section>
            </>
          )}
          {tab === '外观' && (
            <section className="settings-group">
              <div className="setting-row"><label>主题</label><select value={local.theme || 'dark'} onChange={e => update(null, 'theme', e.target.value)}><option value="dark">深色</option><option value="light">浅色</option></select></div>
              <div className="setting-row"><label>动画效果</label><select value={local.animations !== false ? 'on' : 'off'} onChange={e => update(null, 'animations', e.target.value === 'on')}><option value="on">开启</option><option value="off">关闭</option></select></div>
            </section>
          )}
          {tab === 'Agent' && (
            <>
              <section className="settings-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>已添加 ({Object.keys(agents).length})</h3>
                  <button className="btn-scan" onClick={doScan} disabled={scanning}>
                    {scanning ? '扫描中…' : '🔍 扫描本地 Agent'}
                  </button>
                </div>
                <p className="hint-text">修改后即时保存。拖拽排序、添加/移除 Agent。</p>

                {Object.entries(agents).map(([id, agent]) => (
                  <div key={id} className="agent-config-card">
                    {/* 顶行：名称 + 颜色 + active 开关 + 删除 */}
                    <div className="agent-config-top">
                      <span className="agent-color-dot" style={{ background: agent.color }} />
                      <span className="agent-emoji" style={{ fontSize: 18 }}>{agent.icon}</span>
                      <input
                        className="agent-name-input"
                        value={agent.name}
                        placeholder="名称"
                        onChange={e => {
                          update('agents', id, { ...agent, name: e.target.value });
                          saveAgentField(id, 'name', e.target.value);
                        }}
                      />
                      <input
                        className="agent-role-input"
                        value={agent.role}
                        placeholder="角色"
                        onChange={e => {
                          update('agents', id, { ...agent, role: e.target.value });
                          saveAgentField(id, 'role', e.target.value);
                        }}
                      />
                      <label className={`agent-active-toggle ${agent.active ? 'on' : 'off'}`} title={agent.active ? '已激活 · 点击退出' : '未激活 · 点击接入'}>
                        <input type="checkbox" checked={agent.active !== false}
                          onChange={async e => {
                            const v = e.target.checked;
                            update('agents', id, { ...agent, active: v });
                            if (v) {
                              await fetch('/api/setup-agent', {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id, name: agent.name }),
                              });
                            } else {
                              await fetch('/api/deactivate-agent', {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id }),
                              });
                            }
                          }}
                        />
                        <span className="toggle-track">
                          <span className="toggle-thumb" />
                        </span>
                        <span className="toggle-label">{agent.active !== false ? 'ACTIVE' : 'OFF'}</span>
                      </label>
                      <button className="btn-remove" title="移除" onClick={() => removeAgent(id)}>×</button>
                    </div>
                    {/* 详情行：desc + model + provider */}
                    <div className="agent-config-details">
                      <input
                        className="agent-desc-input"
                        value={agent.desc || ''}
                        placeholder="一句话描述这个 Agent 的职责…"
                        onChange={e => {
                          update('agents', id, { ...agent, desc: e.target.value });
                          saveAgentField(id, 'desc', e.target.value);
                        }}
                      />
                      <input
                        className="agent-model-input"
                        value={agent.model || ''}
                        placeholder="模型"
                        onChange={e => {
                          update('agents', id, { ...agent, model: e.target.value });
                          saveAgentField(id, 'model', e.target.value);
                        }}
                      />
                      <input
                        className="agent-provider-input"
                        value={agent.provider || ''}
                        placeholder="API 提供商"
                        onChange={e => {
                          update('agents', id, { ...agent, provider: e.target.value });
                          saveAgentField(id, 'provider', e.target.value);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </section>
              {scanned && scanned.length > 0 && (
                <section className="settings-group">
                  <h3>扫描结果 — 可添加的 Agent</h3>
                  <p className="hint-text">点击即可添加。已添加的不会重复。</p>
                  <div className="scanned-list">
                    {scanned.map(a => {
                      const alreadyAdded = Object.values(agents).find(x => x.name === a.name);
                      return (
                        <button key={a.id} className={`scanned-item${alreadyAdded ? ' added' : ''}`}
                          onClick={() => !alreadyAdded && addScannedAgent(a)}
                          disabled={!!alreadyAdded}>
                          <span style={{ fontSize: 16 }}>{a.icon}</span>
                          <span className="scanned-name">{a.name}</span>
                          <span className="scanned-role">{a.role}</span>
                          <span className="scanned-model">{a.runtime}{a.model !== '—' ? ` · ${a.model}` : ''}</span>
                          <span className="scanned-status">{alreadyAdded ? '已添加' : a.status}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
          {tab === '分类' && (
            <section className="settings-group">
              <p className="hint-text">管理项目分类。</p>
              {categories.map((cat, i) => (
                <div key={cat.id} className="cat-config-row">
                  <input className="cat-icon-input" value={cat.icon} maxLength={2} placeholder="图标" onChange={e => { const next = [...categories]; next[i] = { ...cat, icon: e.target.value }; setLocal(prev => ({ ...prev, categories: next })); }} />
                  <input value={cat.name} placeholder="分类名称" onChange={e => { const next = [...categories]; next[i] = { ...cat, name: e.target.value }; setLocal(prev => ({ ...prev, categories: next })); }} />
                </div>
              ))}
              <button className="btn-add" onClick={() => { const next = [...categories, { id: 'cat' + (categories.length + 1), name: '新分类', icon: 'N' }]; setLocal(prev => ({ ...prev, categories: next })); }}>＋ 添加分类</button>
            </section>
          )}
          {tab === '数据源' && (
            <section className="settings-group">
              <div className="setting-row"><label>数据来源</label><select value={local.project_source || 'share-space'} onChange={e => update(null, 'project_source', e.target.value)}><option value="share-space">Share space</option><option value="local">本地文件</option><option value="api">远程 API</option></select></div>
              {local.project_source === 'share-space' && <div className="setting-row"><label>路径</label><input value={local.share_space_path || '~/Documents/Share space/projects.json'} onChange={e => update(null, 'share_space_path', e.target.value)} /></div>}
              <div className="setting-row"><label>自动同步</label><select value={local.auto_sync !== false ? 'on' : 'off'} onChange={e => update(null, 'auto_sync', e.target.value === 'on')}><option value="on">开启</option><option value="off">关闭</option></select></div>
              <div className="setting-row"><label>同步状态</label><span className={`status-badge ${wsConnected ? 'on' : 'off'}`}>{wsConnected ? '实时同步' : '文件监听中'}</span></div>
            </section>
          )}
          {tab === '关于' && (
            <section className="settings-group">
              <p className="about-text"><strong>OPC Dashboard</strong> v1.0.0</p>
              <p className="about-text">多 Agent 团队协作工作空间</p>
              <p className="about-text" style={{ marginTop: 12, color: '#666' }}>FastAPI + React + taste-skill</p>
            </section>
          )}
        </div>
        <div className="settings-footer">
          <p className="footer-hint" style={{ flex: 1, color: '#666', fontSize: 11, margin: 0, alignSelf: 'center' }}>
            Agent 字段修改即时保存。服务器配置需点击按钮。
          </p>
          <button className="btn-save" onClick={() => saveNow(local)} disabled={saving}>
            {saving ? '保存中…' : '保存设置'}
          </button>
        </div>
      </div>
    </>
  );
}
