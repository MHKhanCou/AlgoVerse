import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { algorithmService } from '../services/algorithmService';
import { userProgressService } from '../services/userProgressService';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import DOMPurify from 'dompurify';
import AlgorithmVisualizer from '../components/visualizer/AlgorithmVisualizer';
import RelatedProblems from '../components/RelatedProblems';
import AlgorithmDiscussionBoard from '../components/AlgorithmDiscussionBoard';
import '../styles/SingleAlgorithm.css';

const SingleAlgorithm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [algorithm, setAlgorithm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null);
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchAlgorithmData = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('Fetching algorithm with ID:', id);
        
        // Parse id to integer
        const algoId = parseInt(id, 10);
        if (isNaN(algoId)) {
          const errorMsg = `Invalid algorithm ID: ${id}`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }

        try {
          // Fetch algorithm details
          console.log(`Fetching algorithm details for ID: ${algoId}`);
          const data = await algorithmService.getById(algoId);
          console.log('Algorithm data received:', data);
          setAlgorithm(data);
        } catch (algoError) {
          console.error('Error fetching algorithm details:', algoError);
          throw new Error(`Failed to load algorithm: ${algoError.message}`);
        }

        // Handle progress for logged-in users
        if (user) {
          try {
            console.log('Fetching user progress for algorithm:', algoId);
            const entry = await userProgressService.getEntry(algoId);
            if (!entry) {
              console.log('No progress found, creating new progress entry');
              // Create new progress with status 'enrolled'
              const newProgress = await userProgressService.createProgress(algoId, 'enrolled');
              console.log('Created new progress:', newProgress);
              setProgress(newProgress);
            } else {
              console.log('Found existing progress:', entry);
              setProgress(entry);
              // Update last_accessed if progress exists
              console.log('Updating last accessed time');
              await userProgressService.updateLastAccessed(algoId);
            }
          } catch (progressError) {
            console.error('Error handling progress (non-fatal):', progressError);
            // Don't fail the whole page load for progress errors
          }
        }
      } catch (err) {
        const errorMsg = `Error loading algorithm: ${err.message}`;
        console.error(errorMsg, err);
        setError(errorMsg);
        toast.error(errorMsg, { position: 'top-center' });
      } finally {
        setLoading(false);
      }
    };
    fetchAlgorithmData();
  }, [id, user]);

  const handleMarkAsCompleted = async () => {
    if (!progress?.id) {
      toast.error('Progress tracking unavailable');
      return;
    }
    try {
      setUpdating(true);
      const updatedProgress = await userProgressService.updateProgress(progress.id, 'completed');
      setProgress(updatedProgress);
      toast.success('Progress marked as completed!');
    } catch (err) {
      setError(err.message || 'Failed to update progress');
      toast.error(err.message || 'Failed to update progress');
    } finally {
      setUpdating(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(algorithm?.code || '');
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="loading">Loading algorithm...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!algorithm) return null;

  return (
    <div className="algorithm-page">
      <nav className="breadcrumb">
        <Link to="/">Home</Link> {' > '} <Link to="/algorithms">Algorithms</Link> {' > '}
        {algorithm.name}
      </nav>

      <h1>{algorithm.name}</h1>
      <div className="meta">
        <span className={`tag difficulty ${algorithm.difficulty?.toLowerCase()}`}>
          {algorithm.difficulty}
        </span>
        <span className="tag complexity">{algorithm.complexity}</span>
        {algorithm.type_name && (
          <Link
            to={`/algorithms?type=${algorithm.type_id}`}
            className="tag type clickable"
          >
            {algorithm.type_name}
          </Link>
        )}
      </div>

      <section className="description">
        <p>{algorithm.description}</p>
      </section>

      <section className="explanation">
        <h2>🧠 Explanation</h2>
        {algorithm.explanation ? (
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(algorithm.explanation),
            }}
          />
        ) : (
          <p className="placeholder">Explanation is being written — stay tuned!</p>
        )}
      </section>

      <section className="code-snippet">
        <h2>💻 Code</h2>
        {algorithm.code ? (
          <>
            <button className="copy-btn" onClick={handleCopyCode}>
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
            <SyntaxHighlighter
              language="python"
              style={vscDarkPlus}
              showLineNumbers
            >
              {algorithm.code}
            </SyntaxHighlighter>
          </>
        ) : (
          <p className="placeholder">Code not available yet.</p>
        )}
      </section>

      <section className="visualizer">
        <div className="details-section">
          <h2>🎲 Visualizer</h2>
          <AlgorithmVisualizer algorithm={algorithm} />
        </div>
      </section>

      <section className="related-problems">
        <div className="details-section">
          <RelatedProblems algorithm={algorithm} user={user} />
        </div>
      </section>

      {user && progress && (
        <div className="progress-actions">
          <p>Status: {progress.status || 'Enrolled'}</p>
          {progress.status !== 'completed' && (
            <button
              onClick={handleMarkAsCompleted}
              disabled={updating}
              className="completed-btn"
            >
              {updating ? 'Updating...' : 'Mark as Completed'}
            </button>
          )}
        </div>
      )}
      {user && !progress && (
        <div className="progress-actions">
          <p>Progress tracking unavailable. Please try again later.</p>
        </div>
      )}

      <section className="discussion-board">
        <div className="details-section">
          <AlgorithmDiscussionBoard
            algorithmId={algorithm.id}
            user={user}
            algorithm={algorithm}
          />
        </div>
      </section>

      <Link className="back-link" to="/algorithms">
        ← Back to Algorithms
      </Link>
    </div>
  );
};

export default SingleAlgorithm;