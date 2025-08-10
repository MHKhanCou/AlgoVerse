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
    <div className={`flex items-start gap-2 ${className}`}>
      <div className="flex flex-col">
        <div className="font-semibold text-primary-600">
          {loading ? 'Loading…' : error ? 'Unknown User' : data?.name}
        </div>
        {showDetails && !loading && !error && (
          <div className="text-sm text-gray-600">
            {data?.codeforces_handle && (
              <div>
                CF: <span className="font-mono">{data.codeforces_handle}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-1 mt-1">
              {(data?.topics_covered || []).slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 text-xs rounded-full bg-gray-100 border border-gray-200"
                >
                  {t}
                </span>
              ))}
              {data?.topics_covered?.length > 4 && (
                <span className="text-xs text-gray-500">+{data.topics_covered.length - 4} more</span>
              )}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Enrolled: {data?.total_algorithms_enrolled ?? 0} · Completed: {data?.total_algorithms_completed ?? 0}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (to && !loading && !error) {
    return (
      <a href={to} className="hover:underline">
        {content}
      </a>
    );
  }

  return content;
}
