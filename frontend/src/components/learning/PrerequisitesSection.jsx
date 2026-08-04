import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';
import './PrerequisitesSection.css';

/**
 * AlgoVerse V2 — Prerequisites Section
 *
 * Shows prerequisites and related algorithms.
 */
const PrerequisitesSection = ({ prerequisites = [], related = [] }) => {
  if (!prerequisites.length && !related.length) return null;

  return (
    <div className="prerequisites-section">
      {prerequisites.length > 0 && (
        <div className="prerequisites-group">
          <h4 className="prerequisites-title">
            <BookOpen size={14} /> Prerequisites
          </h4>
          <div className="prerequisites-list">
            {prerequisites.map((algo, i) => (
              <Link key={i} to={`/algorithms/${algo.id || algo.slug}`} className="prerequisite-link">
                <span className="prerequisite-name">{algo.name}</span>
                <ArrowRight size={12} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <div className="prerequisites-group">
          <h4 className="prerequisites-title">
            <BookOpen size={14} /> Related Algorithms
          </h4>
          <div className="prerequisites-list">
            {related.map((algo, i) => (
              <Link key={i} to={`/algorithms/${algo.id || algo.slug}`} className="prerequisite-link">
                <span className="prerequisite-name">{algo.name}</span>
                <ArrowRight size={12} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrerequisitesSection;
