import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  BookOpen, 
  Target, 
  Play, 
  Grid,
  List,
  Star,
  ChevronRight,
  
} from 'lucide-react';

import '../styles/TopicListPage.css';

const TopicListPage = () => {
  const [algorithms, setAlgorithms] = useState([]);
  const [algoTypes, setAlgoTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('name');
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchData();
  }, []);

  // URL search params integration
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search');
    const category = params.get('category');
    const difficulty = params.get('difficulty');
    const sort = params.get('sort');
    const view = params.get('view');

    if (search) setSearchTerm(search);
    if (category) setSelectedCategory(category);
    if (difficulty) setSelectedDifficulty(difficulty);
    if (sort) setSortBy(sort);
    if (view) setViewMode(view);
  }, [location.search]);

  const updateURL = (params) => {
    const searchParams = new URLSearchParams(location.search);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        searchParams.set(key, value);
      } else {
        searchParams.delete(key);
      }
    });

    const newSearch = searchParams.toString();
    const newPath = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
    
    if (newPath !== `${location.pathname}${location.search}`) {
      navigate(newPath, { replace: true });
    }
  };

  const fetchData = async () => {
    try {
      const [algorithmsRes, typesRes] = await Promise.all([
        fetch('http://localhost:8000/algorithms?limit=100'),
        fetch('http://localhost:8000/algo-type')
      ]);

      if (algorithmsRes.ok && typesRes.ok) {
        const algorithmsData = await algorithmsRes.json();
        const typesData = await typesRes.json();
        
        // Process algorithms with search text
        const processedAlgorithms = algorithmsData.map((algo) => ({
          ...algo,
          searchableText: `${algo.name} ${algo.description} ${algo.type_name || ''}`.toLowerCase(),
        }));

        setAlgorithms(processedAlgorithms);
        setAlgoTypes(typesData);

        // Default category to 'Sorting' if none selected via URL
        const params = new URLSearchParams(location.search);
        const categoryFromURL = params.get('category');
        if (!categoryFromURL) {
          const sortingType = typesData.find(
            (t) => t.name && t.name.toLowerCase() === 'sorting'
          );
          if (sortingType) {
            setSelectedCategory(sortingType.id.toString());
            updateURL({
              search: searchTerm,
              category: sortingType.id.toString(),
              difficulty: selectedDifficulty,
              sort: sortBy,
              view: viewMode,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    updateURL({ search: value, category: selectedCategory, difficulty: selectedDifficulty, sort: sortBy, view: viewMode });
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    updateURL({ search: searchTerm, category: value, difficulty: selectedDifficulty, sort: sortBy, view: viewMode });
  };

  const handleDifficultyChange = (value) => {
    setSelectedDifficulty(value);
    updateURL({ search: searchTerm, category: selectedCategory, difficulty: value, sort: sortBy, view: viewMode });
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    updateURL({ search: searchTerm, category: selectedCategory, difficulty: selectedDifficulty, sort: value, view: viewMode });
  };

  const handleViewChange = (value) => {
    setViewMode(value);
    updateURL({ search: searchTerm, category: selectedCategory, difficulty: selectedDifficulty, sort: sortBy, view: value });
  };

  // Enhanced search functionality with fuzzy matching
  const filteredAndSortedAlgorithms = useMemo(() => {
    let filtered = algorithms.filter(algo => {
      // Enhanced search functionality
      const searchTerms = searchTerm.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0);
      
      let matchesSearch = true;
      if (searchTerms.length > 0) {
        // Fuzzy search - check if any search term partially matches
        matchesSearch = searchTerms.some(term => {
          return algo.name.toLowerCase().includes(term) ||
                 algo.description?.toLowerCase().includes(term) ||
                 algo.type_name?.toLowerCase().includes(term) ||
                 algo.searchableText.includes(term);
        });
      }

      // Category filter
      const matchesCategory = selectedCategory === 'all' || algo.type_id.toString() === selectedCategory;
      
      // Difficulty filter
      const matchesDifficulty = selectedDifficulty === 'all' || algo.difficulty === selectedDifficulty;

      return matchesSearch && matchesCategory && matchesDifficulty;
    });

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          return (difficultyOrder[a.difficulty] || 2) - (difficultyOrder[b.difficulty] || 2);
        case 'type':
          return (a.type_name || '').localeCompare(b.type_name || '');
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [algorithms, searchTerm, selectedCategory, selectedDifficulty, sortBy]);

  const categoryStats = useMemo(() => {
    return algoTypes.map(type => {
      const categoryAlgos = algorithms.filter(algo => algo.type_id === type.id);
      return {
        ...type,
        algorithmCount: categoryAlgos.length
      };
    });
  }, [algorithms, algoTypes]);

  const getDifficultyClass = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'difficulty-easy';
      case 'medium': return 'difficulty-medium';
      case 'hard': return 'difficulty-hard';
      default: return 'difficulty-medium';
    }
  };

  if (loading) {
    return (
      <div className="topics-page">
        <div className="loading-state">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading algorithms...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="topics-page">
      <div className="topics-content">
        {/* Categories Overview */}
        <div className="categories-section">
          <h2 className="section-title">
            <Grid className="filter-icon" />
            Categories
          </h2>
          <div className="categories-grid">
            {categoryStats.map((category) => (
              <div
                key={category.id}
                className="category-card"
                onClick={() => handleCategoryChange(category.id.toString())}
              >
                <div className="category-header">
                  <h3 className="category-title">{category.name}</h3>
                  <ChevronRight className="category-arrow" />
                </div>
                <p className="category-description">
                  {category.description}
                </p>
                <div className="category-stats">
                  <div className="category-stat">
                    <div className="category-stat-number">{category.algorithmCount}</div>
                    <div className="category-stat-label">Algorithms</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="search-filters">
          <div className="search-filters-content">
            {/* Search */}
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search algorithms by name, description, or category..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Filters */}
            <div className="filters-group">
              <div className="filter-group select-with-icon">
                <span className="select-leading-icon">
                  <BookOpen />
                </span>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="filter-select has-icon"
                >
                  <option value="all">All Categories</option>
                  {algoTypes.map((type) => (
                    <option key={type.id} value={type.id.toString()}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group select-with-icon">
                <span className="select-leading-icon">
                  <Target />
                </span>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => handleDifficultyChange(e.target.value)}
                  className="filter-select has-icon"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="filter-group select-with-icon">
                <span className="select-leading-icon">
                  <Star />
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="filter-select has-icon"
                >
                  <option value="name">Sort by Name</option>
                  <option value="difficulty">Sort by Difficulty</option>
                  <option value="type">Sort by Category</option>
                </select>
              </div>

              <div className="view-toggle">
                <button
                  onClick={() => handleViewChange('grid')}
                  className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                >
                  <Grid />
                </button>
                <button
                  onClick={() => handleViewChange('list')}
                  className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                >
                  <List />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="results-info">
          Showing {Math.min(10, filteredAndSortedAlgorithms.length)} of {filteredAndSortedAlgorithms.length} algorithms
          {selectedCategory !== 'all' && (
            <span>
              {' '}in <strong>{algoTypes.find(t => t.id.toString() === selectedCategory)?.name}</strong>
            </span>
          )}
          {selectedDifficulty !== 'all' && (
            <span>
              {' '}with <strong>{selectedDifficulty}</strong> difficulty
            </span>
          )}
          {searchTerm && (
            <span>
              {' '}matching "<strong>{searchTerm}</strong>"
            </span>
          )}
        </div>

        {/* Algorithms Grid/List */}
        {viewMode === 'grid' ? (
          <div className="algorithms-grid">
            {filteredAndSortedAlgorithms.slice(0, 10).map((algorithm) => (
              <Link
                key={algorithm.id}
                to={`/algorithms/${algorithm.id}`}
                className="algorithm-card"
              >
                <div className="algorithm-header">
                  <div className="algorithm-info">
                    <h3 className="algorithm-title">{algorithm.name}</h3>
                    <div className="algorithm-badges">
                      <span className={`difficulty-badge ${getDifficultyClass(algorithm.difficulty)}`}>
                        {algorithm.difficulty}
                      </span>
                      <span className="category-badge">
                        {algorithm.type_name}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="category-arrow" />
                </div>

                <p className="algorithm-description">
                  {algorithm.description}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="algorithms-list">
            {filteredAndSortedAlgorithms.slice(0, 10).map((algorithm) => (
              <Link
                key={algorithm.id}
                to={`/algorithms/${algorithm.id}`}
                className="algorithm-list-item"
              >
                <div className="algorithm-list-content">
                  <div className="algorithm-list-header">
                    <h3 className="algorithm-list-title">{algorithm.name}</h3>
                    <div className="algorithm-list-stats">
                      <span className={`difficulty-badge ${getDifficultyClass(algorithm.difficulty)}`}>
                        {algorithm.difficulty}
                      </span>
                      <span className="category-badge">
                        {algorithm.type_name}
                      </span>
                    </div>
                  </div>
                  <p className="algorithm-list-description">
                    {algorithm.description}
                  </p>
                </div>
                <ChevronRight className="algorithm-list-arrow" />
              </Link>
            ))}
          </div>
        )}

        {filteredAndSortedAlgorithms.length === 0 && (
          <div className="empty-state">
            <Search />
            <h3>No algorithms found</h3>
            <p>
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicListPage;