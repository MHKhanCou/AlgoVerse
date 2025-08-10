import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { userService } from '../services/userService';
import '../styles/UserPublicPage.css';
import { useAuth } from '../contexts/AuthContext';

export default function UserPublicPage() {
  const { id } = useParams();
  const { user: authUser, isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cf, setCf] = useState(null); // { rating, rank, maxRating, maxRank }
  const [blogs, setBlogs] = useState([]);
  const [allBlogs, setAllBlogs] = useState([]);
  const [showAllBlogs, setShowAllBlogs] = useState(false);
  const [pageSkip, setPageSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    userService
      .getPublicProfile(id)
      .then((res) => {
        if (!active) return;
        setData(res);
        setError(null);
      })
      .catch((e) => {
        if (!active) return;
        setError(e?.message || 'Failed to load user');
      })
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [id]);

  // Fetch Codeforces basic info if handle exists
  useEffect(() => {
    let active = true;
    const handle = data?.codeforces_handle?.trim();
    if (!handle) return;
    (async () => {
      try {
        const resp = await fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`);
        const json = await resp.json();
        if (!active) return;
        if (json.status === 'OK' && Array.isArray(json.result) && json.result.length) {
          const u = json.result[0];
          setCf({
            rating: u.rating,
            rank: u.rank,
            maxRating: u.maxRating,
            maxRank: u.maxRank,
          });
        } else {
          setCf(null);
        }
      } catch (e) {
        // Silent fail; CF API may be rate limited
        setCf(null);
      }
    })();
    return () => { active = false; };
  }, [data?.codeforces_handle]);

  // Fetch recent approved blogs for this author (backend pagination endpoint)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const resp = await axios.get(`http://localhost:8000/blogs/user/${id}`, { params: { skip: 0, limit: 5 } });
        if (!active) return;
        const items = Array.isArray(resp.data) ? resp.data : [];
        setBlogs(items);
      } catch (e) {
        setBlogs([]);
      }
    })();
    return () => { active = false; };
  }, [id]);

  // Modal: fetch next page of user blogs
  const fetchMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const resp = await axios.get(`http://localhost:8000/blogs/user/${id}`, { params: { skip: pageSkip, limit: 10 } });
      const items = Array.isArray(resp.data) ? resp.data : [];
      setAllBlogs((prev) => [...prev, ...items]);
      setHasMore(items.length === 10);
      setPageSkip((prev) => prev + items.length);
    } catch (e) {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // When opening modal first time, load initial page
  useEffect(() => {
    if (showAllBlogs && allBlogs.length === 0 && hasMore && !loadingMore) {
      // reset pagination when opening fresh
      setPageSkip(0);
      setHasMore(true);
      (async () => {
        try {
          const resp = await axios.get(`http://localhost:8000/blogs/user/${id}`, { params: { skip: 0, limit: 10 } });
          const items = Array.isArray(resp.data) ? resp.data : [];
          setAllBlogs(items);
          setHasMore(items.length === 10);
          setPageSkip(items.length);
        } catch (e) {
          setAllBlogs([]);
          setHasMore(false);
        }
      })();
    }
  }, [showAllBlogs]);

  // Infinite scroll observer in modal
  useEffect(() => {
    if (!showAllBlogs) return;
    const el = observerRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting) {
        fetchMore();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [showAllBlogs, observerRef.current, hasMore, loadingMore, pageSkip]);

  if (loading) return <div className="user-public container">Loading…</div>;
  if (error) return <div className="user-public container error-text">{error}</div>;
  if (!data) return <div className="user-public container">No data</div>;

  return (
    <div className="user-public container">
      <div className="up-card">
        <div className="up-header">
          <div className="up-avatar" aria-hidden>
            {String(data.name || '?').slice(0, 1).toUpperCase()}
          </div>
          <div className="up-title">
            <h1 className="up-name">{data.name}</h1>
            {data.joined_at && (
              <div className="up-joined">Joined {new Date(data.joined_at).toLocaleDateString()}</div>
            )}
          </div>
          {data.codeforces_handle && (
            <div className="up-actions">
              <a
                className="up-btn"
                href={`https://codeforces.com/profile/${encodeURIComponent(data.codeforces_handle)}`}
                target="_blank" rel="noreferrer"
              >
                View on Codeforces
              </a>
              <Link
                className="up-btn secondary"
                to={`/codeforces-analyzer?handles=${encodeURIComponent(data.codeforces_handle)}`}
              >
                Open CF Analyzer
              </Link>
              {isAuthenticated && authUser?.codeforces_handle && (
                <Link
                  className="up-btn secondary"
                  to={`/codeforces-analyzer?handles=${encodeURIComponent(data.codeforces_handle)},${encodeURIComponent(authUser.codeforces_handle)}`}
                >
                  Compare with me
                </Link>
              )}
            </div>
          )}
        </div>

        {data.codeforces_handle && (
          <div className="up-section up-cf">
            <div className="up-section-title">Codeforces</div>
            <div className="up-cf-row">
              <div className="up-cf-handle">@{data.codeforces_handle}</div>
              {cf ? (
                <div className="up-cf-stats">
                  <span className="badge">Rating: {cf.rating ?? '—'}</span>
                  <span className="badge">Rank: {cf.rank ?? '—'}</span>
                  <span className="badge subtle">Max: {cf.maxRating ?? '—'} ({cf.maxRank ?? '—'})</span>
                </div>
              ) : (
                <div className="up-cf-stats subtle">Rating info not available</div>
              )}
            </div>
          </div>
        )}

        <div className="up-grid">
          <div className="up-section">
            <div className="up-section-title">Topics</div>
            <div className="chips">
              {(data.topics_covered || []).map((t) => (
                <span className="chip" key={t}>{t}</span>
              ))}
              {(!data.topics_covered || data.topics_covered.length === 0) && (
                <span className="muted">No topics yet</span>
              )}
            </div>
          </div>
          <div className="up-section">
            <div className="up-section-title">Progress</div>
            <div className="stats">
              <div className="stat">
                <div className="stat-number">{data.total_algorithms_enrolled ?? 0}</div>
                <div className="stat-label">Enrolled</div>
              </div>
              <div className="stat">
                <div className="stat-number">{data.total_algorithms_completed ?? 0}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
          </div>
        </div>

        <div className="up-section">
          <div className="up-section-title">Recent Blogs</div>
          {blogs.length === 0 ? (
            <div className="muted">No recent posts</div>
          ) : (
            <ul className="blog-list">
              {blogs.map((b) => (
                <li key={b.id} className="blog-item">
                  <Link to={`/blogs/${b.id}`} className="blog-title-link">{b.title}</Link>
                  <div className="blog-meta">{new Date(b.created_at).toLocaleDateString()}</div>
                </li>
              ))}
            </ul>
          )}
          {allBlogs.length > blogs.length && (
            <div className="up-actions" style={{ marginTop: 12 }}>
              <button className="up-btn secondary" onClick={() => setShowAllBlogs(true)}>View all ({allBlogs.length})</button>
            </div>
          )}
        </div>

        {/* Recent Learning Activity (derived) */}
        <div className="up-section">
          <div className="up-section-title">Recent Learning Activity</div>
          <ul className="activity-list">
            {data.joined_at && (
              <li className="activity-item">Joined on {new Date(data.joined_at).toLocaleDateString()}</li>
            )}
            <li className="activity-item">Currently enrolled in {data.total_algorithms_enrolled ?? 0} algorithm(s)</li>
            <li className="activity-item">Completed {data.total_algorithms_completed ?? 0} algorithm(s)</li>
            {data.topics_covered?.length ? (
              <li className="activity-item">Exploring topics: {data.topics_covered.slice(0, 5).join(', ')}{data.topics_covered.length > 5 ? '…' : ''}</li>
            ) : (
              <li className="activity-item muted">No topic activity yet</li>
            )}
          </ul>
        </div>
      </div>

      {/* All Blogs Modal */}
      {showAllBlogs && (
        <div className="up-modal" role="dialog" aria-modal="true">
          <div className="up-modal-backdrop" onClick={() => setShowAllBlogs(false)} />
          <div className="up-modal-card">
            <div className="up-modal-header">
              <div className="up-modal-title">All Blogs by {data.name}</div>
              <button className="up-modal-close" aria-label="Close" onClick={() => setShowAllBlogs(false)}>✕</button>
            </div>
            <div className="up-modal-body">
              {allBlogs.length === 0 ? (
                <div className="muted">No posts</div>
              ) : (
                <ul className="blog-list">
                  {allBlogs.map((b) => (
                    <li key={b.id} className="blog-item">
                      <Link to={`/blogs/${b.id}`} className="blog-title-link">{b.title}</Link>
                      <div className="blog-meta">{new Date(b.created_at).toLocaleDateString()}</div>
                    </li>
                  ))}
                </ul>
              )}
              {hasMore && (
                <div ref={observerRef} className="up-infinite-sentinel">
                  {loadingMore ? 'Loading…' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
