import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSearch } from '../contexts/SearchContext';
import { algorithmService } from '../services/algorithmService';
import '../styles/Algorithms.css';

const Algorithms = () => {
  const [algorithms, setAlgorithms] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 5;
  const { searchQuery } = useSearch();
  const [searchParams] = useSearchParams();
  const typeId = searchParams.get('type');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let algos;
        if (typeId) {
          algos = await algorithmService.getByType(parseInt(typeId), page, limit);
        } else {
          algos = await algorithmService.getAll(page, limit);
        }
        setAlgorithms(algos);
        setHasMore(algos.length === limit);
        const uniqueTypes = [
          ...new Map(algos.map((item) => [item.type_id, item])).values(),
        ];
        setTypes(uniqueTypes);
        setError('');
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load algorithms');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [typeId, page]);

  const filteredAlgorithms = algorithms.filter(
    (algo) =>
      algo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      algo.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (hasMore) setPage(page + 1);
  };

  return (
    <div className="algorithms-container">
      <h1>Algorithms</h1>

      <section className="algorithm-types-list">
        <h3>View by Types:</h3>
        {types.map((type) => (
          <Link
            key={type.type_id}
            to={`/algorithms?type=${type.type_id}`}
            className="type-link"
            onClick={() => setPage(1)}
          >
            {type.type_name}
          </Link>
        ))}
      </section>

      {loading && <div className="loading">Loading algorithms...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <>
          <div className="algorithms-list">
            {filteredAlgorithms.length > 0 ? (
              filteredAlgorithms.map((algo) => (
                <div key={algo.id} className="algo-card">
                  <h2>{algo.name}</h2>
                  <p>{algo.description}</p>
                  <div className="algo-meta">
                    <span
                      className={`tag difficulty ${algo.difficulty?.toLowerCase()}`}
                    >
                      {algo.difficulty}
                    </span>
                    {algo.complexity && (
                      <span className="tag complexity">{algo.complexity}</span>
                    )}
                    {algo.type_name && (
                      <Link
                        to={`/algorithms?type=${algo.type_id}`}
                        className="tag type"
                      >
                        {algo.type_name}
                      </Link>
                    )}
                  </div>
                  <Link to={`/algorithms/${algo.id}`} className="read-more">
                    Learn More →
                  </Link>
                </div>
              ))
            ) : (
              <p className="no-results">
                No algorithms found matching "{searchQuery}"
              </p>
            )}
          </div>
          <div className="pagination">
            <button
              onClick={handlePrevPage}
              disabled={page === 1}
              className="cta-button secondary"
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              onClick={handleNextPage}
              disabled={!hasMore}
              className="cta-button secondary"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Algorithms;