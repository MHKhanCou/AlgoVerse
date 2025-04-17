import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { algorithmService } from '../services/algorithmService';
import { userProgressService } from '../services/userProgressService';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import DOMPurify from 'dompurify';
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
        // Parse id to integer
        const algoId = parseInt(id, 10);
        if (isNaN(algoId)) {
          throw new Error('Invalid algorithm ID');
        }

        // Fetch algorithm details
        const data = await algorithmService.getById(algoId);
        setAlgorithm(data);

        // Handle progress for logged-in users
        if (user) {
          try {
            const entry = await userProgressService.getEntry(algoId);
            if (!entry) {
              // Create new progress with status 'enrolled'
              const newProgress = await userProgressService.createProgress(algoId, 'enrolled');
              setProgress(newProgress);
            } else {
              setProgress(entry);
              // Update last_accessed if progress exists
              await userProgressService.updateLastAccessed(algoId);
            }
          } catch (progressError) {
            // Log the error and show it to the user, but don't set a fallback progress
            console.error('Progress error:', progressError);
            toast.error(progressError.message || 'Failed to initialize progress tracking');
            // Optionally, prevent rendering progress-related UI
            setProgress(null);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load algorithm details');
        toast.error(err.message || 'Failed to load algorithm details');
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
          <div className="visualizer-placeholder">
            <p>🚀 Visualizer under construction.</p>
            <small>This feature will arrive in future updates!</small>
          </div>
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
              Mark as Completed
            </button>
          )}
        </div>
      )}
      {user && !progress && (
        <div className="progress-actions">
          <p>Progress tracking unavailable. Please try again later.</p>
        </div>
      )}

      <Link className="back-link" to="/algorithms">
        ← Back to Algorithms
      </Link>
    </div>
  );
};

export default SingleAlgorithm;