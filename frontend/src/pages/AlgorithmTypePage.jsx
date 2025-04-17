import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { algorithmService } from '../services/algorithmService';
import { toast } from 'react-toastify'; // Added for error notifications
import '../styles/Algorithms.css';

const AlgorithmTypePage = () => {
  const { typeId } = useParams();
  const [algorithms, setAlgorithms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeName, setTypeName] = useState(''); // State for type name

  useEffect(() => {
    const fetchByType = async () => {
      try {
        // Parse typeId to integer
        const parsedTypeId = parseInt(typeId, 10);
        if (isNaN(parsedTypeId)) {
          throw new Error('Invalid type ID');
        }

        const data = await algorithmService.getByType(parsedTypeId);
        setAlgorithms(data);

        // Set type name based on the fetched data
        if (data.length > 0) {
          setTypeName(data[0].type_name || 'Unknown Type');
        } else {
          setTypeName('Unknown Type');
        }
      } catch (err) {
        const errorMessage = err.message || 'Failed to fetch algorithms.';
        setError(errorMessage);
        toast.error(errorMessage); // Notify user of the error
      } finally {
        setLoading(false);
      }
    };

    fetchByType();
  }, [typeId]);

  if (loading) return <div className="loading">Loading algorithms...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="algorithms-container">
      <h1>{typeName} Algorithms</h1>
      <div className="algorithms-grid">
        {algorithms.length > 0 ? (
          algorithms.map(algo => (
            <div key={algo.id} className="algo-card">
              <h2>{algo.name}</h2>
              <p>{algo.description}</p>
              <div className="algo-meta">
                <span className={`tag difficulty ${algo.difficulty?.toLowerCase()}`}>
                  {algo.difficulty}
                </span>
                {algo.complexity && (
                  <span className="tag complexity">{algo.complexity}</span>
                )}
              </div>
              <Link to={`/algorithms/${algo.id}`} className="read-more">
                Learn More →
              </Link>
            </div>
          ))
        ) : (
          <p>No algorithms found for this type.</p>
        )}
      </div>
      <Link to="/algorithms" className="back-link">
        ← Back to All Algorithms
      </Link>
    </div>
  );
};

export default AlgorithmTypePage;