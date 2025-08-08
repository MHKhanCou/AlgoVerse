import React from 'react';
import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';

const FilterSection = ({
  selectedDifficulty,
  selectedPlatform,
  selectedStatus,
  searchQuery,
  onDifficultyChange,
  onPlatformChange,
  onStatusChange,
  onSearchChange,
  onClearFilters,
  problemCounts = {},
  className = ""
}) => {
  const difficulties = [
    { value: 'all', label: 'All Difficulties', count: problemCounts.total || 0 },
    { value: 'beginner', label: 'Beginner', count: problemCounts.beginner || 0 },
    { value: 'easy', label: 'Easy', count: problemCounts.easy || 0 },
    { value: 'medium', label: 'Medium', count: problemCounts.medium || 0 },
    { value: 'hard', label: 'Hard', count: problemCounts.hard || 0 },
    { value: 'expert', label: 'Expert', count: problemCounts.expert || 0 }
  ];

  const platforms = [
    { value: 'all', label: 'All Platforms', count: problemCounts.total || 0 },
    { value: 'LeetCode', label: 'LeetCode', count: problemCounts.leetcode || 0 },
    { value: 'Codeforces', label: 'Codeforces', count: problemCounts.codeforces || 0 },
    { value: 'AtCoder', label: 'AtCoder', count: problemCounts.atcoder || 0 },
    { value: 'CodeChef', label: 'CodeChef', count: problemCounts.codechef || 0 },
    { value: 'HackerRank', label: 'HackerRank', count: problemCounts.hackerrank || 0 },
    { value: 'SPOJ', label: 'SPOJ', count: problemCounts.spoj || 0 }
  ];

  const statuses = [
    { value: 'all', label: 'All Problems', count: problemCounts.total || 0 },
    { value: 'solved', label: 'Solved', count: problemCounts.solved || 0 },
    { value: 'attempted', label: 'Attempted', count: problemCounts.attempted || 0 },
    { value: 'not_started', label: 'Not Started', count: problemCounts.not_started || 0 }
  ];

  const hasActiveFilters = selectedDifficulty !== 'all' || 
                          selectedPlatform !== 'all' || 
                          selectedStatus !== 'all' || 
                          searchQuery.trim() !== '';

  return (
    <div className={`filters-section ${className}`}>
      {/* Header */}
      <div className="filters-header">
        <div className="filters-title">
          <SlidersHorizontal className="w-5 h-5" />
          <span>Filter Problems</span>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="clear-filters-btn"
            title="Clear all filters"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search problems by title or tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="search-clear-btn"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Grid */}
      <div className="filters-grid">
        {/* Difficulty Filter */}
        <div className="filter-group">
          <label className="filter-label">
            <Filter className="w-4 h-4" />
            Difficulty
          </label>
          <select
            value={selectedDifficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="filter-select"
          >
            {difficulties.map(diff => (
              <option key={diff.value} value={diff.value}>
                {diff.label} {diff.count > 0 && `(${diff.count})`}
              </option>
            ))}
          </select>
        </div>

        {/* Platform Filter */}
        <div className="filter-group">
          <label className="filter-label">
            <Filter className="w-4 h-4" />
            Platform
          </label>
          <select
            value={selectedPlatform}
            onChange={(e) => onPlatformChange(e.target.value)}
            className="filter-select"
          >
            {platforms.map(platform => (
              <option key={platform.value} value={platform.value}>
                {platform.label} {platform.count > 0 && `(${platform.count})`}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="filter-group">
          <label className="filter-label">
            <Filter className="w-4 h-4" />
            Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="filter-select"
          >
            {statuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label} {status.count > 0 && `(${status.count})`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="active-filters">
          <span className="active-filters-label">Active filters:</span>
          <div className="active-filters-list">
            {selectedDifficulty !== 'all' && (
              <span className="active-filter-tag">
                Difficulty: {selectedDifficulty}
                <button onClick={() => onDifficultyChange('all')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {selectedPlatform !== 'all' && (
              <span className="active-filter-tag">
                Platform: {selectedPlatform}
                <button onClick={() => onPlatformChange('all')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {selectedStatus !== 'all' && (
              <span className="active-filter-tag">
                Status: {selectedStatus.replace('_', ' ')}
                <button onClick={() => onStatusChange('all')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {searchQuery.trim() && (
              <span className="active-filter-tag">
                Search: "{searchQuery}"
                <button onClick={() => onSearchChange('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSection;