import React, { useEffect, useState } from 'react';

const DayButtons = ({ days, setDays }) => (
  <div className="contest-filter-buttons">
    {[1, 7, 30].map((d) => (
      <button
        key={d}
        className={`btn ${days === d ? 'btn-primary' : 'btn-ghost'}`}
        onClick={() => setDays(d)}
      >
        Next {d} day{d > 1 ? 's' : ''}
      </button>
    ))}
  </div>
);

const StatusBadge = ({ status }) => (
  <span className={`badge ${status === 'Running' ? 'badge-success' : 'badge-info'}`}>{status}</span>
);

const IconCF = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#64a5ff"><rect x="3" y="10" width="4" height="10" rx="1"/><rect x="10" y="4" width="4" height="16" rx="1"/><rect x="17" y="8" width="4" height="12" rx="1"/></svg>
);
const IconATC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#34d399"><path d="M12 3l9 18H3L12 3z"/></svg>
);
const IconCC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#fde68a"><path d="M12 4a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 110 12A6 6 0 0112 6z"/></svg>
);
const IconLC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24"><path d="M10 3h4v4h-4zM4 10h4v4H4zM16 10h4v4h-4zM10 17h4v4h-4z"/></svg>
);

const PlatformBadge = ({ site }) => {
  const s = (site || '').toLowerCase();
  let label = 'OJ';
  let cls = 'plat-generic';
  let Icon = null;
  if (s.includes('codeforces')) { label = 'CF'; cls = 'plat-cf'; }
  else if (s.includes('atcoder')) { label = 'ATC'; cls = 'plat-atc'; }
  else if (s.includes('codechef')) { label = 'CC'; cls = 'plat-cc'; }
  else if (s.includes('leetcode')) { label = 'LC'; cls = 'plat-lc'; }
  else if (s.includes('hackerrank')) { label = 'HR'; cls = 'plat-hr'; }
  else if (s.includes('topcoder')) { label = 'TC'; cls = 'plat-tc'; }
  if (label === 'CF') Icon = IconCF;
  if (label === 'ATC') Icon = IconATC;
  if (label === 'CC') Icon = IconCC;
  if (label === 'LC') Icon = IconLC;
  return <span className={`plat ${cls}`}>{Icon ? <Icon /> : null}<span style={{ marginLeft: 4 }}>{label}</span></span>;
};

const fmtDuration = (sec) => {
  if (!sec || isNaN(sec)) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const timeDiffLabel = (start) => {
  const now = Date.now();
  const diffMs = start.getTime() - now;
  if (diffMs <= 0) return 'Started';
  const min = Math.floor(diffMs / 60000);
  if (min < 60) return `in ${min}m`;
  const hr = Math.floor(min / 60);
  const rm = min % 60;
  if (hr < 24) return `in ${hr}h ${rm}m`;
  const d = Math.floor(hr / 24);
  const rh = hr % 24;
  return `in ${d}d ${rh}h`;
};

const ContestCard = ({ c, status, nowTick }) => {
  const start = new Date(c.start_time);
  const durationSec = Number(c.duration || 0);
  const end = new Date(start.getTime() + durationSec * 1000);
  // Recompute live label using nowTick (updates each second)
  const liveLabel = status === 'Upcoming' ? `(${timeDiffLabel(start)})` : '';
  return (
    <li className="contest-card">
      <div className="contest-card-left">
        <div className="contest-title-row">
          <PlatformBadge site={c.site} />
          <a href={c.url} target="_blank" rel="noreferrer" className="contest-title">{c.name}</a>
          <StatusBadge status={status} />
        </div>
        <div className="contest-platform">{c.site} • {fmtDuration(durationSec)}</div>
      </div>
      <div className="contest-card-right">
        <div className="contest-time">
          <span className="label">Starts:</span> {start.toLocaleString()} <span className="muted">{liveLabel}</span>
        </div>
        <div className="contest-time">
          <span className="label">Ends:</span> {end.toLocaleString()}
        </div>
      </div>
    </li>
  );
};

export default function ContestTracker() {
  const [tab, setTab] = useState('running');
  const [days, setDays] = useState(30);
  const [data, setData] = useState({ running: [], upcoming: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [counts, setCounts] = useState({});
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const base = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:8000';
        const params = new URLSearchParams({ days: String(days), include_running: 'true' });
        const url = `${base}/api/contests?${params.toString()}`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        const ct = (res.headers && res.headers.get && res.headers.get('content-type')) || '';
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status}: ${txt?.slice(0, 200) || res.statusText}`);
        }
        let js;
        if (ct.includes('application/json')) {
          js = await res.json();
        } else {
          const txt = await res.text();
          throw new Error(`Unexpected response type: ${ct || 'unknown'}; Body: ${txt?.slice(0, 200)}`);
        }
        if (js.status !== 'success') throw new Error(js.message || 'Failed to fetch contests');
        const running = js.running || [];
        const upcoming = js.upcoming || [];
        setData({ running, upcoming });
        setCounts(js.counts || {});
        // Auto-pick a tab with data on first load or when current tab is empty
        setTimeout(() => {
          setTab((prev) => {
            if (prev === 'upcoming' && upcoming.length) return prev;
            if (prev === 'running' && running.length) return prev;
            return upcoming.length ? 'upcoming' : 'running';
          });
        }, 0);
      } catch (e) {
        setError(e.message || 'Failed to load contests');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [days]);

  // Live countdown ticker (1s)
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Group upcoming into buckets when days >= 7
  const groupUpcoming = (items) => {
    const now = Date.now();
    const inHours = (ms) => ms / 3600000;
    const buckets = { h24: [], d7: [], d30: [] };
    items.forEach((c) => {
      try {
        const start = new Date(c.start_time).getTime();
        const diffH = inHours(start - now);
        if (diffH <= 24) buckets.h24.push(c);
        else if (diffH <= 24 * 7) buckets.d7.push(c);
        else buckets.d30.push(c);
      } catch (_) {}
    });
    return buckets;
  };

  const grouped = days >= 7 ? groupUpcoming(data.upcoming) : null;

  // removed CLIST resource filtering

  return (
    <div className="contest-tracker" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="contest-header-row">
        <h2 className="contest-heading">Contest Tracker</h2>
        <div className="contest-filter-row">
          <DayButtons days={days} setDays={setDays} />
        </div>
      </div>

      <div className="contest-tabs">
        <button className={`tab ${tab === 'running' ? 'active' : ''}`} onClick={() => setTab('running')}>
          Running ({data.running.length})
        </button>
        <button className={`tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>
          Upcoming ({data.upcoming.length})
        </button>
      </div>

      {loading ? (
        <p className="contest-loading">Loading contests...</p>
      ) : error ? (
        <div className="contest-error">
          <p style={{ margin: 0 }}>Failed to load contests.</p>
          <code style={{ fontSize: '0.8rem' }}>{error}</code>
        </div>
      ) : tab === 'running' ? (
        data.running.length ? (
          <ul className="contest-list">
            {data.running.map((c, i) => (
              <ContestCard key={`${c.name}-${i}`} c={c} status="Running" nowTick={nowTick} />
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <p className="empty">No running contests right now.</p>
            <div className="actions"><button className="btn btn-primary" onClick={() => setTab('upcoming')}>View Upcoming</button></div>
          </div>
        )
      ) : grouped ? (
        <div className="grouped-lists">
          <div className="group">
            <h3 className="group-title">Next 24 hours</h3>
            {grouped.h24.length ? (
              <ul className="contest-list">{grouped.h24.map((c, i) => <ContestCard key={`h24-${i}`} c={c} status="Upcoming" nowTick={nowTick} />)}</ul>
            ) : (
              <p className="empty">No contests in next 24 hours.</p>
            )}
          </div>
          <div className="group">
            <h3 className="group-title">Next 7 days</h3>
            {grouped.d7.length ? (
              <ul className="contest-list">{grouped.d7.map((c, i) => <ContestCard key={`d7-${i}`} c={c} status="Upcoming" nowTick={nowTick} />)}</ul>
            ) : (
              <p className="empty">No contests in this window.</p>
            )}
          </div>
          <div className="group">
            <h3 className="group-title">Next 30 days</h3>
            {grouped.d30.length ? (
              <ul className="contest-list">{grouped.d30.map((c, i) => <ContestCard key={`d30-${i}`} c={c} status="Upcoming" nowTick={nowTick} />)}</ul>
            ) : (
              <div className="empty-state">
                <p className="empty">No contests in this window.</p>
                <div className="actions"><button className="btn btn-ghost" onClick={() => setDays(30)}>Try 30 days</button></div>
              </div>
            )}
          </div>
        </div>
      ) : (
        data.upcoming.length ? (
          <ul className="contest-list">
            {data.upcoming.map((c, i) => (
              <ContestCard key={`${c.name}-${i}`} c={c} status="Upcoming" nowTick={nowTick} />
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <p className="empty">No upcoming contests found.</p>
            <div className="actions">
              <button className={`btn ${days === 30 ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setDays(30)}>Next 30 days</button>
              <button className={`btn ${days === 7 ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setDays(7)}>Next 7 days</button>
              <button className={`btn ${days === 1 ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setDays(1)}>Next 1 day</button>
            </div>
          </div>
        )
      )}

      <style>{`
        /* Light/Dark theme via CSS vars with fallbacks */
        .contest-tracker { 
          --bg: var(--card-bg, #fff);
          --text: var(--text-color, #111827);
          --muted: var(--muted-color, #6b7280);
          --border: var(--card-border, #e5e7eb);
          --chip: #f3f4f6;
          --chip-active: #e0ebff;
          --primary: #3b82f6;
          background: var(--bg);
          color: var(--text);
          border-radius: 12px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        :root[data-theme='dark'] .contest-tracker, .dark .contest-tracker {
          /* Bluish dark theme */
          --bg: #0b1220;           /* deep navy */
          --text: #e6f0ff;         /* very light blue */
          --muted: #8aa2c4;        /* desaturated blue */
          --border: #1b2a4a;       /* navy border */
          --chip: #0a1a33;         /* chip bg */
          --chip-active: #14284d;  /* active chip */
          --primary: #4e8df7;      /* primary blue */
          box-shadow: 0 1px 6px rgba(0,0,0,0.35);
        }
        .contest-header-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .contest-heading { margin: 0; font-size: 1.125rem; font-weight: 700; }
        .contest-filter-row { display: flex; gap: 12px; align-items: center; }
        .contest-filter-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
        .btn { padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border); cursor: pointer; font-size: 0.9rem; background: transparent; color: var(--text); }
        .btn-ghost { background: transparent; }
        .btn-primary { background: var(--primary); color: #fff; border-color: var(--primary); }
        .contest-tabs { display: flex; gap: 8px; margin-top: 12px; margin-bottom: 12px; }
        .tab { padding: 6px 10px; border-radius: 8px; background: var(--chip); cursor: pointer; border: 1px solid var(--border); color: var(--text); }
        .tab.active { background: var(--chip-active); border-color: var(--primary); font-weight: 600; }
        .contest-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
        .contest-card { display: flex; gap: 12px; justify-content: space-between; align-items: flex-start; border: 1px solid var(--border); border-radius: 10px; padding: 12px; background: transparent; }
        .contest-card-left { min-width: 0; }
        .contest-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .contest-title { font-weight: 600; color: var(--text); text-decoration: none; }
        .contest-title:hover { text-decoration: underline; }
        .contest-platform { font-size: 0.85rem; color: var(--muted); margin-top: 2px; }
        .contest-card-right { text-align: right; }
        .contest-time { font-size: 0.9rem; color: var(--text); }
        .contest-time .label { color: var(--muted); margin-right: 6px; }
        .contest-time .muted { color: var(--muted); margin-left: 6px; }
        .badge { font-size: 0.75rem; padding: 2px 6px; border-radius: 999px; border: 1px solid transparent; }
        .badge-success { background: #0f3a2e; color: #b9f6e8; border-color: #1f7a65; }
        .badge-info { background: #153a7a; color: #cfe4ff; border-color: var(--primary); }

        .plat { font-size: 0.72rem; font-weight: 700; padding: 3px 6px; border-radius: 999px; border: 1px solid var(--border); display: inline-flex; align-items: center; gap: 4px; }
        .plat-cf { background: #0e1a33; color: #9cc0ff; border-color: #1c2f57; }
        .plat-atc { background: #0e1a33; color: #a7f3d0; border-color: #1c2f57; }
        .plat-cc { background: #0e1a33; color: #fde68a; border-color: #1c2f57; }
        .plat-lc { background: #0e1a33; color: #fbbf24; border-color: #1c2f57; }
        .plat-hr { background: #0e1a33; color: #34d399; border-color: #1c2f57; }
        .plat-tc { background: #0e1a33; color: #f87171; border-color: #1c2f57; }
        .plat-generic { background: var(--chip); color: var(--text); }

        .grouped-lists { display: grid; gap: 16px; }
        .group-title { margin: 0 0 8px; font-size: 1rem; font-weight: 700; color: var(--text); }
        .empty { color: var(--muted); font-size: 0.9rem; }
        .empty-state { display: grid; gap: 10px; }
        .actions { display: flex; gap: 8px; flex-wrap: wrap; }

        .resource-filter { display: flex; gap: 6px; flex-wrap: wrap; }
        .resource-chip { padding: 4px 8px; border-radius: 999px; border: 1px solid var(--border); background: var(--chip); color: var(--text); cursor: pointer; font-size: 0.82rem; }
        .resource-chip.active { background: var(--chip-active); border-color: var(--primary); }

        @media (max-width: 640px) {
          .contest-card { flex-direction: column; align-items: stretch; }
          .contest-card-right { text-align: left; }
          .contest-header-row { align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}

