import React, { useEffect, useState } from 'react';

const DayButtons = ({ days, setDays }) => (
  <div className="segmented">
    {[1, 7, 30].map((d) => (
      <button
        key={d}
        className={`seg ${days === d ? 'active' : ''}`}
        onClick={() => setDays(d)}
        aria-pressed={days === d}
      >
        {d === 1 ? 'Next 24 hours' : `Next ${d} days`}
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
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.round((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
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

const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
);

const IconICPC = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 64 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="12" height="16" rx="2" fill="#2563eb"/>
    <rect x="18" y="4" width="12" height="16" rx="2" fill="#f59e0b"/>
    <rect x="34" y="4" width="12" height="16" rx="2" fill="#ef4444"/>
    <path d="M16 12h2" stroke="#fff" strokeWidth="2"/>
    <path d="M32 12h2" stroke="#fff" strokeWidth="2"/>
    <circle cx="56" cy="12" r="6" stroke="#94a3b8" strokeWidth="2" fill="none"/>
  </svg>
);

// ICPC card styled similarly to contest cards with a special accent
const IcpcCard = ({ ev, nowTick, formatCountdown }) => {
  const start = new Date(ev.start_time);
  // Countdown to 2 PM on start day (start + 14 hours)
  const target = new Date(start.getTime() + 14 * 60 * 60 * 1000);
  return (
    <li
      className="contest-card"
      style={{
        listStyle: 'none',
        marginBottom: 8,
        border: '1px solid rgba(14,165,233,0.40)',
        borderRadius: 8,
        background: 'var(--card-bg, #0c1424)'
      }}
    >
      <div
        className="contest-card-inner"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}
      >
        <div className="contest-card-left" style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
          <span className="icpc-logo" aria-hidden="true"><IconICPC size={22} /></span>
          <div style={{ width: '100%' }}>
            <div className="contest-name" style={{ fontWeight: 700 }}>{ev.name}</div>
            <div className="icpc-countdown-row" style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginTop: 6 }}>
              <span className="badge" style={{ background: '#0ea5e9', color: '#001018', padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>Starts In</span>
              <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 18, fontWeight: 800 }}>{formatCountdown(target.toISOString())}</span>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
const IconTimer = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 2h4"/><path d="M12 14V8"/><circle cx="12" cy="16" r="6"/></svg>
);

const ContestCard = ({ c, status, nowTick }) => {
  const start = new Date(c.start_time);
  const durationSec = Number(c.duration || 0);
  const end = new Date(start.getTime() + durationSec * 1000);
  // Recompute live label using nowTick (updates each second)
  const liveLabel = status === 'Upcoming' ? `${timeDiffLabel(start)}` : '';
  const key = (c.site || '').toLowerCase().includes('codeforces') ? 'cf'
    : (c.site || '').toLowerCase().includes('atcoder') ? 'atcoder'
    : (c.site || '').toLowerCase().includes('leetcode') ? 'leetcode'
    : (c.site || '').toLowerCase().includes('codechef') ? 'codechef'
    : (c.site || '').toLowerCase().includes('topcoder') ? 'topcoder'
    : (c.site || '').toLowerCase().includes('hacker') ? 'hackerearth'
    : 'other';

  // Generate editorial and standings links based on platform
  const getLinks = () => {
    const baseUrl = c.url.replace(/\/$/, '');
    if (key === 'cf') {
      return {
        editorial: `${baseUrl}/blog`,
        standings: `${baseUrl}/standings`
      };
    }
    if (key === 'atcoder') {
      return {
        editorial: `${baseUrl}/editorial`,
        standings: `${baseUrl}/standings`
      };
    }
    if (key === 'leetcode') {
      return {
        editorial: `${baseUrl}/editorial`,
        standings: `${baseUrl}/ranking`
      };
    }
    return null;
  };

  const links = status === 'Finished' ? getLinks() : null;

  return (
    <li className={`contest-card site-${key}`} tabIndex={0}>
      <span className="card-accent" aria-hidden="true" />
      <div className="contest-card-left">
        <div className="contest-title-row">
          <PlatformBadge site={c.site} />
          <a href={c.url} target="_blank" rel="noreferrer" className="contest-title">{c.name}</a>
          <span className={`badge ${status === 'Running' ? 'badge-success' : status === 'Finished' ? 'badge-finished' : 'badge-info'} badge-accent`}>{status}</span>
        </div>
        <div className="contest-platform">
          <span className="muted">{c.site}</span> • <IconTimer /> {fmtDuration(durationSec)} • <IconClock /> <b>{liveLabel || (status === 'Finished' ? 'Ended' : 'Started')}</b>
          {links && (
            <span className="contest-links">
              {links.editorial && (
                <> • <a href={links.editorial} target="_blank" rel="noreferrer" className="link-editorial">Editorial</a></>  
              )}
              {links.standings && (
                <> • <a href={links.standings} target="_blank" rel="noreferrer" className="link-standings">Standings</a></>  
              )}
            </span>
          )}
        </div>
      </div>
      <div className="contest-card-right">
        <div className="contest-time">
          <span className="label"><IconClock /> Starts:</span> {start.toLocaleString()}
        </div>
        <div className="contest-time">
          <span className="label"><IconClock /> Ends:</span> {end.toLocaleString()}
        </div>
      </div>
    </li>
  );
};

export default function ContestTracker() {
  const [tab, setTab] = useState('running');
  const [days, setDays] = useState(30);
  const [recentDays, setRecentDays] = useState(7);
  const [data, setData] = useState({ running: [], upcoming: [], recent: [] });
  const [cacheStatus, setCacheStatus] = useState({ isCached: false, timestamp: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [counts, setCounts] = useState({});
  const [nowTick, setNowTick] = useState(Date.now());
  const [lastFetchTime, setLastFetchTime] = useState(null);
  // Remove HackerEarth for now
  const ALL_SITES = ['cf','codechef','atcoder','leetcode','topcoder'];
  // Default selected platforms: CF, CodeChef, AtCoder
  const [sites, setSites] = useState(new Set(['cf','codechef','atcoder']));

  // Cache configuration
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const CACHE_KEY = 'contest_tracker_cache';

  // 1s ticker for live countdowns
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // ICPC contests (hardcoded)
  const ICPC_EVENTS = [
    {
      name: 'ICPC Dhaka Regional 2025 – Preliminary (BUBT Host)',
      site: 'ICPC',
      url: 'https://icpc.global/',
      start_time: '2025-10-24T00:00:00+06:00',
      duration: 2 * 24 * 60 * 60, // 2 days
    },
    {
      name: 'ICPC Dhaka Regional 2025 – On-site (BUBT Host)',
      site: 'ICPC',
      url: 'https://icpc.global/',
      start_time: '2025-12-19T00:00:00+06:00',
      duration: 2 * 24 * 60 * 60, // 2 days
    },
  ];

  // Determine next ICPC event relative to nowTick
  const nextIcpcEvent = (() => {
    const now = new Date(nowTick);
    // sort by start
    const sorted = [...ICPC_EVENTS].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    for (const ev of sorted) {
      const st = new Date(ev.start_time);
      const end = new Date(st.getTime() + (Number(ev.duration||0) * 1000));
      if (now <= end) return ev; // either before start or during preliminary -> then onsite later
    }
    return sorted[sorted.length - 1];
  })();

  const formatCountdown = (targetIso) => {
    const target = new Date(targetIso).getTime();
    const now = nowTick;
    let diff = Math.max(0, target - now);
    const sec = Math.floor(diff / 1000);
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // Load from localStorage cache
  const loadFromCache = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      if (age > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      return parsed;
    } catch (e) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  };

  // Save to localStorage cache
  const saveToCache = (data, counts, timestamp) => {
    try {
      const cacheData = {
        data,
        counts,
        timestamp: Date.now(),
        fetched_at: timestamp
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
      console.warn('Failed to save to cache:', e);
    }
  };

  const loadContests = async (forceRefresh = false) => {
    try {
      // Check if we should use cache
      if (!forceRefresh) {
        const cached = loadFromCache();
        if (cached) {
          setData(cached.data);
          setCounts(cached.counts);
          setCacheStatus({ 
            isCached: true, 
            timestamp: new Date(cached.fetched_at || cached.timestamp) 
          });
          setLastFetchTime(cached.timestamp);
          return;
        }
      }

      setLoading(true);
      setError('');
      const base = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:8000';
      const params = new URLSearchParams({ 
        days: String(days),
        recent_days: String(recentDays),
        include_running: 'true',
        include_recent: 'true',
        refresh: forceRefresh ? 'true' : 'false'
      });
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
      const recent = js.recent || [];
      const contestData = { running, upcoming, recent };
      const contestCounts = js.counts || {};
      
      setData(contestData);
      setCounts(contestCounts);
      
      // Set cache status
      const isCached = js.cached === true;
      const timestamp = js.fetched_at ? new Date(js.fetched_at) : new Date();
      setCacheStatus({ isCached, timestamp });
      setLastFetchTime(Date.now());
      
      // Save to localStorage cache
      saveToCache(contestData, contestCounts, timestamp);
      // Auto-pick a tab with data on first load or when current tab is empty.
      // Priority: running -> recent -> upcoming (default is 'running').
      setTimeout(() => {
        setTab((prev) => {
          if (prev === 'upcoming' && upcoming.length) return prev;
          if (prev === 'running' && running.length) return prev;
          if (prev === 'recent' && recent.length) return prev;
          const next = running.length ? 'running' : (recent.length ? 'recent' : 'upcoming');
          if (next === 'upcoming' && days !== 1) setDays(1);
          return next;
        });
      }, 0);
    } catch (e) {
      setError(e.message || 'Failed to load contests');
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    loadContests(true); // Force refresh from API
  };

  // Load contests on mount and when days/recentDays change
  useEffect(() => {
    loadContests(false); // Use cache if available
  }, [days, recentDays]);

  // Initial load from cache on component mount
  useEffect(() => {
    const cached = loadFromCache();
    if (cached) {
      setData(cached.data);
      setCounts(cached.counts);
      setCacheStatus({ 
        isCached: true, 
        timestamp: new Date(cached.fetched_at || cached.timestamp) 
      });
      setLastFetchTime(cached.timestamp);
    } else {
      loadContests(false);
    }
  }, []); // Only run on mount

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

  // grouped will be computed after filters are defined
  let grouped = null;

  // Judge filter helpers
  const siteKey = (site) => {
    const s = (site || '').toLowerCase();
    if (s.includes('codeforces')) return 'cf';
    if (s.includes('atcoder')) return 'atcoder';
    if (s.includes('leetcode')) return 'leetcode';
    if (s.includes('codechef')) return 'codechef';
    if (s.includes('topcoder')) return 'topcoder';
    if (s.includes('hacker')) return 'hackerearth';
    return 'other';
  };
  const matchesFilter = (c) => sites.has(siteKey(c.site));
  const filtered = {
    running: (data.running || []).filter(matchesFilter),
    upcoming: (data.upcoming || []).filter(matchesFilter),
    recent: (data.recent || []).filter(matchesFilter),
  };
  const toggleSite = (key) => {
    setSites((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };
  const setAll = () => setSites(new Set(ALL_SITES));
  const setNone = () => setSites(new Set());

  // Now that `filtered` is available, compute grouped upcoming (if needed)
  grouped = days >= 7 ? groupUpcoming(filtered.upcoming) : null;

  return (
    <div className="contest-tracker" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="contest-header sticky">
        <div className="contest-header-row">
          <h2 className="contest-heading">Contest Tracker</h2>
          <div className="contest-filter-row">
            {tab === 'upcoming' && (
              <DayButtons days={days} setDays={setDays} />
            )}
            <button 
              className="btn btn-refresh" 
              onClick={handleRefresh} 
              title="Refresh data from source"
              aria-label="Refresh contest data"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 01-9 9 9 9 0 01-9-9 9 9 0 019-9" />
                <path d="M21 3v9h-9" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="contest-header-row">
          <div className="contest-tabs">
            <button className={`tab ${tab === 'recent' ? 'active' : ''}`} onClick={() => setTab('recent')}>
              Recent ({filtered.recent.length})
            </button>
            <button className={`tab ${tab === 'running' ? 'active' : ''}`} onClick={() => setTab('running')}>
              Running ({filtered.running.length})
            </button>
            <button
              className={`tab ${tab === 'upcoming' ? 'active' : ''}`}
              onClick={() => { if (days !== 1) setDays(1); setTab('upcoming'); }}
            >
              Upcoming ({filtered.upcoming.length})
            </button>
            <button
              className={`tab ${tab === 'icpc' ? 'active' : ''}`}
              onClick={() => setTab('icpc')}
              title="International Collegiate Programming Contest"
              style={tab === 'icpc' ? { borderBottomColor: '#0ea5e9' } : {}}
            >
              <span className="icpc-logo" aria-hidden="true" style={{ marginRight: 6 }}><IconICPC /></span>
              ICPC
            </button>
          </div>
          
          {cacheStatus.timestamp && (
            <div className="cache-status" title={`Data ${cacheStatus.isCached ? 'from cache' : 'freshly loaded'}`}>
              <span className={`cache-indicator ${cacheStatus.isCached ? 'cached' : 'fresh'}`}></span>
              <span className="cache-text">
                {cacheStatus.isCached ? 'Cached' : 'Fresh'} • 
                {cacheStatus.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          )}
        </div>

        <div className="contest-filter-row" style={{ marginBottom: 8, overflowX: 'auto' }}>
          <div className="resource-filter" aria-label="Online judges filter">
            {[
              {k:'cf', label:'Codeforces'},
              {k:'codechef', label:'CodeChef'},
              {k:'atcoder', label:'AtCoder'},
              {k:'leetcode', label:'LeetCode'},
              {k:'topcoder', label:'Topcoder'},
            ].map(({k,label}) => (
            <button
              key={k}
              className={`resource-chip ${sites.has(k) ? 'active' : ''}`}
              onClick={() => toggleSite(k)}
              aria-pressed={sites.has(k)}
              title={label}
            >
              <span className="judge-logo" aria-hidden="true">
                {k === 'cf' ? <IconCF /> :
                 k === 'atcoder' ? <IconATC /> :
                 k === 'leetcode' ? <IconLC /> :
                 k === 'codechef' ? <IconCC /> :
                 /* Fallback: simple initial for others */
                 <span className="logo-initial">{label.slice(0,2).toUpperCase()}</span>
                }
              </span>
              <span>{label}</span>
            </button>
            ))}
          </div>
          <div className="actions">
            <button className="btn btn-ghost" onClick={setAll}>All</button>
            <button className="btn btn-ghost" onClick={setNone}>None</button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="contest-loading">Loading contests...</p>
      ) : error ? (
        <div className="contest-error">
          <p style={{ margin: 0 }}>Failed to load contests.</p>
          <code style={{ fontSize: '0.8rem' }}>{error}</code>
        </div>
      ) : tab === 'running' ? (
        filtered.running.length ? (
          <ul className="contest-list">
            {filtered.running.map((c, i) => (
              <ContestCard key={`${c.name}-${i}`} c={c} status="Running" nowTick={nowTick} />
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <p className="empty">No running contests right now.</p>
            <div className="actions"><button className="btn btn-primary" onClick={() => setTab('upcoming')}>View Upcoming</button></div>
          </div>
        )
      ) : tab === 'recent' ? (
        filtered.recent.length ? (
          <ul className="contest-list">
            {filtered.recent.map((c, i) => (
              <ContestCard key={`${c.name}-${i}`} c={c} status="Finished" nowTick={nowTick} />
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <p className="empty">No recent contests found.</p>
            <div className="actions">
              <button className="btn btn-ghost" onClick={() => setRecentDays(3)}>Last 3 days</button>
              <button className="btn btn-ghost" onClick={() => setRecentDays(7)}>Last 7 days</button>
              <button className="btn btn-ghost" onClick={() => setRecentDays(14)}>Last 14 days</button>
            </div>
          </div>
        )
      ) : tab === 'icpc' ? (
        <div className="icpc-pane" style={{ padding: 8 }}>
          {/* Two similar ICPC cards with consistent styling */}
          {ICPC_EVENTS.map((ev, i) => (
            <IcpcCard key={`icpc-card-${i}`} ev={ev} nowTick={nowTick} formatCountdown={formatCountdown} />
          ))}
        </div>
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
          {days === 30 && (
            <div className="group">
              <h3 className="group-title">Next 30 days</h3>
              {grouped.d30.length ? (
                <ul className="contest-list">{grouped.d30.map((c, i) => <ContestCard key={`d30-${i}`} c={c} status="Upcoming" nowTick={nowTick} />)}</ul>
              ) : (
                <p className="empty">No contests in this window.</p>
              )}
            </div>
          )}
        </div>
      ) : (
        filtered.upcoming.length ? (
          <ul className="contest-list">
            {filtered.upcoming.map((c, i) => (
              <ContestCard key={`${c.name}-${i}`} c={c} status="Upcoming" nowTick={nowTick} />
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <p className="empty">No upcoming contests found.</p>
            <div className="actions">
              <button className={`btn ${days === 1 ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setDays(1)}>Next 24 hours</button>
              <button className={`btn ${days === 7 ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setDays(7)}>Next 7 days</button>
              <button className={`btn ${days === 30 ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setDays(30)}>Next 30 days</button>
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
          --link: #60a5fa;         /* link blue */
          --link-hover: #93c5fd;   /* link hover */
          box-shadow: 0 1px 6px rgba(0,0,0,0.35);
        }
        .contest-header { position: sticky; top: 0; z-index: 30; backdrop-filter: saturate(120%) blur(6px); box-shadow: 0 2px 10px rgba(0,0,0,0.06); margin: -16px -16px 12px; padding: 12px 16px; border-bottom: 1px solid var(--border); background: color-mix(in srgb, var(--bg) 86%, transparent); }
        .contest-header-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
        .contest-heading { margin: 0; font-size: 1.125rem; font-weight: 700; }
        .contest-filter-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .contest-filter-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
        .btn { padding: 6px 10px; border-radius: 10px; border: 1px solid var(--border); cursor: pointer; font-size: 0.9rem; background: transparent; color: var(--text); display: inline-flex; align-items: center; gap: 6px; }
        .btn-ghost { background: transparent; }
        .btn-primary { background: var(--primary); color: #fff; border-color: var(--primary); }
        .btn-refresh { background: var(--chip); border-color: var(--border); transition: all 0.2s ease; }
        .btn-refresh:hover { background: var(--chip-active); border-color: var(--primary); }
        .btn-refresh svg { transition: transform 0.3s ease; }
        .btn-refresh:hover svg { transform: rotate(30deg); }
        .contest-tabs { display: flex; gap: 8px; margin-top: 0; margin-bottom: 0; }
        .tab { padding: 6px 10px; border-radius: 8px; background: var(--chip); cursor: pointer; border: 1px solid var(--border); color: var(--text); }
        .tab.active { background: var(--chip-active); border-color: var(--primary); font-weight: 600; }
        .contest-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; grid-template-columns: 1fr; }
        .contest-card { 
          display: flex; gap: 12px; justify-content: space-between; align-items: flex-start;
          border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; background: transparent;
          transition: background .2s ease, border-color .2s ease, box-shadow .2s ease, transform .12s ease;
          position: relative; overflow: hidden;
          animation: fadeIn .25s ease-out;
          backdrop-filter: blur(8px);
        }
        .card-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--border); }
        .site-cf .card-accent { background: #4e8df7; }
        .site-atcoder .card-accent { background: #10b981; }
        .site-leetcode .card-accent { background: #f59e0b; }
        .site-codechef .card-accent { background: #c084fc; }
        .site-topcoder .card-accent { background: #ef4444; }
        .site-hackerearth .card-accent { background: #22c55e; }
        .contest-card:hover { 
          border-color: var(--primary);
          background: rgba(78, 141, 247, 0.06);
          box-shadow: 0 6px 18px rgba(0,0,0,0.12);
          transform: translateY(-1px);
        }
        :root[data-theme='dark'] .contest-card:hover, .dark .contest-card:hover {
          background: rgba(78, 141, 247, 0.09);
          box-shadow: 0 8px 20px rgba(8, 14, 35, 0.6);
        }
        .contest-card-left { min-width: 0; }
        .contest-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .contest-title { font-weight: 700; color: var(--text); text-decoration: none; font-size: 1rem; max-width: min(64vw, 560px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .contest-title:hover { text-decoration: underline; }
        .contest-platform { font-size: 0.85rem; color: var(--muted); margin-top: 2px; }
        .contest-links { display: inline-flex; gap: 4px; align-items: center; }
        .link-editorial, .link-standings { color: var(--link, #3b82f6); text-decoration: none; font-weight: 500; transition: color 0.2s ease; }
        .link-editorial:hover, .link-standings:hover { color: var(--link-hover, #60a5fa); text-decoration: underline; }
        .contest-card-right { text-align: right; min-width: 240px; }
        .contest-time { font-size: 0.92rem; color: var(--text); line-height: 1.4; }
        .contest-time .label { color: #475569; font-weight: 600; margin-right: 6px; }
        .contest-time .muted { color: var(--muted); margin-left: 6px; }
        :root[data-theme='dark'] .contest-time .label, .dark .contest-time .label { color: #cbd5e1; }
        .badge { font-size: 0.72rem; padding: 3px 8px; border-radius: 999px; border: 1px solid transparent; font-weight: 700; }
        .badge-success { background: #103a2f; color: #b9f6e8; border-color: #1e6f5d; }
        .badge-info { background: #0f2d5f; color: #d6e6ff; border-color: #2a56a5; }
        .badge-finished { background: #1f2937; color: #9ca3af; border-color: #374151; }
        
        /* Cache status indicator */
        .cache-status { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--muted); background: var(--chip); padding: 4px 8px; border-radius: 999px; }
        .cache-indicator { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
        .cache-indicator.cached { background: #f59e0b; /* amber */ }
        .cache-indicator.fresh { background: #10b981; /* emerald */ }
        .cache-text { white-space: nowrap; }
        /* Accent badge background to match site color (high contrast for light theme) */
        .site-cf .badge-accent { background: #2563eb; color: #ffffff; border-color: #1e40af; }
        .site-atcoder .badge-accent { background: #059669; color: #ffffff; border-color: #065f46; }
        .site-leetcode .badge-accent { background: #d97706; color: #ffffff; border-color: #b45309; }
        .site-codechef .badge-accent { background: #7c3aed; color: #ffffff; border-color: #5b21b6; }
        .site-topcoder .badge-accent { background: #dc2626; color: #ffffff; border-color: #991b1b; }
        .site-hackerearth .badge-accent { background: #16a34a; color: #ffffff; border-color: #166534; }

        .plat { font-size: 0.72rem; font-weight: 800; padding: 4px 8px; border-radius: 999px; border: 1px solid var(--border); display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 1px 0 rgba(0,0,0,0.08) inset; }
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

        .resource-filter { display: flex; gap: 8px; flex-wrap: nowrap; align-items: center; }
        .resource-chip { display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 999px; border: 1px solid var(--border); background: var(--chip); color: var(--text); cursor: pointer; font-size: 0.82rem; white-space: nowrap; transition: background .2s ease, border-color .2s ease; }
        .resource-chip:hover { background: var(--chip-hover, rgba(255,255,255,0.04)); }
        .resource-chip.active { background: var(--chip-active); border-color: var(--border); font-weight: 600; }
        .judge-logo { display: inline-grid; place-items: center; width: 18px; height: 18px; border-radius: 6px; background: var(--card); border: 1px solid var(--border); font-size: 0.65rem; font-weight: 700; color: var(--muted); }
        .judge-logo svg { width: 14px; height: 14px; }
        .logo-initial { line-height: 1; }

        .segmented { display: inline-flex; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
        .seg { padding: 6px 10px; background: transparent; color: var(--text); border: 0; cursor: pointer; }
        .seg + .seg { border-left: 1px solid var(--border); }
        .seg.active { background: var(--chip-active); color: var(--text); font-weight: 600; }

        /* Focus rings for a11y */
        .btn:focus-visible, .tab:focus-visible, .resource-chip:focus-visible, .seg:focus-visible, .contest-card:focus-visible, .contest-title:focus-visible { outline: 2px solid #60a5fa; outline-offset: 2px; }

        @media (max-width: 640px) {
          .contest-card { flex-direction: column; align-items: stretch; }
          .contest-card-right { text-align: left; min-width: 0; }
          .contest-title { max-width: 100%; }
          .contest-header-row { align-items: flex-start; }
          .contest-tabs { overflow-x: auto; }
        }

        

        @keyframes fadeIn { from { opacity: 0; transform: translateY(2px);} to { opacity: 1; transform: translateY(0);} }
      `}</style>
    </div>
  );
}

