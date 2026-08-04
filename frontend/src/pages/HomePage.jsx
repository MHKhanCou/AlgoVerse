import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Play, BookOpen, Code, GitBranch, BarChart3, Users, ArrowRight, Sparkles } from 'lucide-react';
import '../styles/HomePage.css';

const FEATURES = [
  {
    icon: <Play size={24} />,
    title: 'Interactive Visualization',
    description: 'Watch algorithms come alive with step-by-step animations. Pause, step through, and understand every move.',
    link: '/algorithms',
  },
  {
    icon: <Code size={24} />,
    title: 'Code Synchronization',
    description: 'See exactly which line of code corresponds to each visualization step. Learn by doing.',
    link: '/algorithms',
  },
  {
    icon: <GitBranch size={24} />,
    title: 'Graph Editor',
    description: 'Create your own graphs and run BFS, DFS, Dijkstra on them. Interactive and hands-on.',
    link: '/demo',
  },
  {
    icon: <BookOpen size={24} />,
    title: 'Deep Explanations',
    description: 'Complexity analysis, prerequisites, common mistakes, and when to use each algorithm.',
    link: '/algorithms',
  },
  {
    icon: <BarChart3 size={24} />,
    title: 'Performance Metrics',
    description: 'Track comparisons, swaps, and accesses in real-time. Understand algorithm efficiency.',
    link: '/demo',
  },
  {
    icon: <Users size={24} />,
    title: 'Community',
    description: 'Read and write blogs about algorithms. Discuss with other learners.',
    link: '/blogs',
  },
];

const ALGORITHM_PREVIEWS = [
  { name: 'Merge Sort', type: 'Sorting', difficulty: 'Medium', color: 'var(--algo-sorting, #a78bfa)' },
  { name: 'Binary Search', type: 'Searching', difficulty: 'Easy', color: 'var(--algo-search, #f87171)' },
  { name: 'BFS', type: 'Graph', difficulty: 'Medium', color: 'var(--algo-graph, #34d399)' },
  { name: 'Dijkstra', type: 'Graph', difficulty: 'Hard', color: 'var(--algo-graph, #34d399)' },
  { name: 'Quick Sort', type: 'Sorting', difficulty: 'Medium', color: 'var(--algo-sorting, #a78bfa)' },
  { name: 'Knapsack', type: 'DP', difficulty: 'Hard', color: 'var(--algo-dp, #f59e0b)' },
];

const HomePage = () => {
  // eslint-disable-next-line no-unused-vars
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <Sparkles size={14} />
          <span>Interactive Algorithm Learning</span>
        </div>
        <h1 className="hero-title">
          Master Algorithms<br />
          <span className="hero-gradient">Through Visualization</span>
        </h1>
        <p className="hero-subtitle">
          Watch algorithms come alive. Understand every step. Practice with interactive code.
        </p>
        <div className="cta-buttons">
          {!isAuthenticated ? (
            <>
              <Link to="/algorithms" className="cta-button primary">
                Explore Algorithms <ArrowRight size={16} />
              </Link>
              <Link to="/signup" className="cta-button secondary">
                Create Account
              </Link>
            </>
          ) : (
            <>
              <Link to="/algorithms" className="cta-button primary">
                Explore Algorithms <ArrowRight size={16} />
              </Link>
              <Link to="/demo" className="cta-button secondary">
                Try Demo
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <h2 className="section-title">Why AlgoVerse?</h2>
        <div className="features-grid">
          {FEATURES.map((feature, i) => (
            <Link key={i} to={feature.link} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Algorithm Previews */}
      <section className="previews-section">
        <h2 className="section-title">Popular Algorithms</h2>
        <div className="previews-grid">
          {ALGORITHM_PREVIEWS.map((algo, i) => (
            <Link key={i} to="/algorithms" className="preview-card">
              <div className="preview-color" style={{ backgroundColor: algo.color }} />
              <div className="preview-info">
                <span className="preview-name">{algo.name}</span>
                <span className="preview-meta">{algo.type} · {algo.difficulty}</span>
              </div>
            </Link>
          ))}
        </div>
        <Link to="/algorithms" className="previews-cta">
          View All Algorithms <ArrowRight size={16} />
        </Link>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Master Algorithms?</h2>
        <p>Join thousands of developers learning algorithms through interactive visualization.</p>
        <Link to={isAuthenticated ? '/algorithms' : '/signup'} className="cta-button primary large">
          {isAuthenticated ? 'Start Learning' : 'Get Started Free'} <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
};

export default HomePage;
