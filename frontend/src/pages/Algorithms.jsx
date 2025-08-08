import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useSearch } from '../contexts/SearchContext';
import { algorithmService } from '../services/algorithmService';
import { 
  Search, 
  BookOpen, 
  Target, 
  Play, 
  Filter,
  Grid,
  List,
  TrendingUp,
  Star,
  ChevronRight,
  Code,
  Brain,
  ChevronLeft
} from 'lucide-react';
import '../styles/TopicListPage.css';

const Algorithms = () => {
  const [algorithms, setAlgorithms] = useState([]);
  const [algoTypes, setAlgoTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // Default to list
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { searchQuery } = useSearch();
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
    const view = params.get('view') || 'list'; // Default to list
    const page = parseInt(params.get('page')) || 1;

    if (search) setSearchTerm(search);
    if (category) setSelectedCategory(category);
    if (difficulty) setSelectedDifficulty(difficulty);
    if (sort) setSortBy(sort);
    setViewMode(view);
    setCurrentPage(page);
  }, [location.search]);

  // Use global search query
  useEffect(() => {
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [searchQuery]);

  const updateURL = (params) => {
    const searchParams = new URLSearchParams(location.search);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '' && value !== 1) {
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
      setLoading(true);
      const [algorithmsData, typesResponse] = await Promise.all([
        algorithmService.getAll(1, 100),
        fetch('http://localhost:8000/algo-type')
      ]);
      
      if (typesResponse.ok) {
        const typesData = await typesResponse.json();
        setAlgoTypes(typesData);
      }
      
      // Process algorithms with search text
      const processedAlgorithms = algorithmsData.map((algo) => ({
        ...algo,
        searchableText: `${algo.name} ${algo.type_name || ''}`.toLowerCase(),
      }));

      setAlgorithms(processedAlgorithms);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load algorithms');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
    updateURL({ search: value, category: selectedCategory, difficulty: selectedDifficulty, sort: sortBy, view: viewMode, page: 1 });
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setCurrentPage(1);
    updateURL({ search: searchTerm, category: value, difficulty: selectedDifficulty, sort: sortBy, view: viewMode, page: 1 });
  };

  const handleDifficultyChange = (value) => {
    setSelectedDifficulty(value);
    setCurrentPage(1);
    updateURL({ search: searchTerm, category: selectedCategory, difficulty: value, sort: sortBy, view: viewMode, page: 1 });
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
    updateURL({ search: searchTerm, category: selectedCategory, difficulty: selectedDifficulty, sort: value, view: viewMode, page: 1 });
  };

  const handleViewChange = (value) => {
    setViewMode(value);
    updateURL({ search: searchTerm, category: selectedCategory, difficulty: selectedDifficulty, sort: sortBy, view: value, page: currentPage });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    updateURL({ search: searchTerm, category: selectedCategory, difficulty: selectedDifficulty, sort: sortBy, view: viewMode, page });
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

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedAlgorithms.length / itemsPerPage);
  const paginatedAlgorithms = filteredAndSortedAlgorithms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  if (error) {
    return (
      <div className="topics-page">
        <div className="cf-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="topics-page">
      {/* Header */}
      <div className="topics-header">
        <div className="topics-header-content">
          <div className="topics-title">
            <h1>
              <Code className="stat-icon" />
              All Algorithms
            </h1>
            <p>
              Discover and master algorithms with detailed explanations, visualizations, and practice problems.
            </p>
          </div>
        </div>
      </div>

      <div className="topics-content">
        {/* Categories Overview - Simple List */}
        <div className="categories-section">
          <h2 className="section-title">
            <Grid className="filter-icon" />
            Categories
          </h2>
          <div className="categories-simple-list">
            {algoTypes.map((category) => (
              <button
                key={category.id}
                className={`category-simple-btn ${selectedCategory === category.id.toString() ? 'active' : ''}`}
                onClick={() => handleCategoryChange(category.id.toString())}
              >
                {category.name}
              </button>
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
                placeholder="Search algorithms by name or category..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Filters */}
            <div className="filters-group">
              <div className="filter-group">
                <Filter className="filter-icon" />
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Categories</option>
                  {algoTypes.map((type) => (
                    <option key={type.id} value={type.id.toString()}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => handleDifficultyChange(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="filter-group">
                <TrendingUp className="filter-icon" />
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="filter-select"
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
          Showing {Math.min(itemsPerPage, filteredAndSortedAlgorithms.length - (currentPage - 1) * itemsPerPage)} of {filteredAndSortedAlgorithms.length} algorithms
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
            {paginatedAlgorithms.map((algorithm) => (
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
              </Link>
            ))}
          </div>
        ) : (
          <div className="algorithms-list">
            {paginatedAlgorithms.map((algorithm) => (
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
                </div>
                <ChevronRight className="algorithm-list-arrow" />
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              <ChevronLeft className="pagination-icon" />
              Previous
            </button>
            
            <div className="pagination-info">
              Page {currentPage} of {totalPages}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next
              <ChevronRight className="pagination-icon" />
            </button>
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

export default Algorithms;