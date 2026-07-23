import React, { useEffect, useState } from 'react';
import { userService } from '../../services/userService';

/**
 * UserLink
 * Renders a user's public-facing info (no auth required) and links to a user route if provided.
 *
 * Props:
 * - userId: number (required) – target user id to fetch
 * - to: string (optional) – href to navigate on click (e.g., `/users/${userId}`); if not provided, renders as plain text
 * - className: string (optional) – extra classes for wrapper
 * - showDetails: boolean (optional, default: true) – whether to show mini details (cf handle, topics, counts)
 */
export default function UserLink({ userId, to, className = '', showDetails = true }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    userService
      .getPublicProfile(userId)
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

    return () => {
      active = false;
    };
  }, [userId]);

  const content = (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }} className={className}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
          {loading ? 'Loading…' : error ? 'Unknown User' : data?.name}
        </div>
        {showDetails && !loading && !error && (
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {data?.codeforces_handle && (
              <div>
                CF: <span style={{ fontFamily: 'monospace' }}>{data.codeforces_handle}</span>
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
              {(data?.topics_covered || []).slice(0, 4).map((t) => (
                <span
                  key={t}
                  style={{
                    padding: '0.125rem 0.5rem',
                    fontSize: '0.75rem',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {t}
                </span>
              ))}
              {data?.topics_covered?.length > 4 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  +{data.topics_covered.length - 4} more
                </span>
              )}
            </div>
            <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Enrolled: {data?.total_algorithms_enrolled ?? 0} · Completed: {data?.total_algorithms_completed ?? 0}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (to && !loading && !error) {
    return (
      <a href={to} style={{ textDecoration: 'none' }}>
        {content}
      </a>
    );
  }

  return content;
}
