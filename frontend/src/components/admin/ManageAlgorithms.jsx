import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import '../../styles/ManageAlgorithms.css';

const ManageAlgorithms = ({ algorithms, algoTypes, fetchAlgorithms, adminService }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: '',
    complexity: '',
    type_id: '',
    code: '',
    explanation: '',
  });
  const [editAlgo, setEditAlgo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCreateInline, setShowCreateInline] = useState(false);
  const inlineCreateRef = useRef(null);
  const [inlineMaxHeight, setInlineMaxHeight] = useState(0);

  // Complexity options matching the backend AlgoComplexity enum
  const complexityOptions = [
    'O(1)',
    'O(logn)',
    'O(n)',
    'O(nlogn)',
    'O(n^2)',
    'O(n^3)',
    'O(2^n)',
    'O(n!)',
  ];

  const difficultyOptions = ['Easy', 'Medium', 'Hard'];

  // Validation function
  const isFormValid = (data) =>
    data.name.trim() &&
    data.description.trim() &&
    difficultyOptions.includes(data.difficulty) &&
    complexityOptions.includes(data.complexity) &&
    data.type_id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid(formData)) {
      toast.error('Please fill in all required fields correctly', { theme: 'dark' });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      difficulty: formData.difficulty,
      complexity: formData.complexity, // Now matches backend enum
      type_id: parseInt(formData.type_id, 10), // Ensure integer
      code: formData.code.trim() || null,
      explanation: formData.explanation.trim() || null,
    };

    console.log('Creating Algorithm with payload:', payload);

    try {
      await adminService.createAlgorithm(payload);
      await fetchAlgorithms();
      setFormData({
        name: '',
        description: '',
        difficulty: '',
        complexity: '',
        type_id: '',
        code: '',
        explanation: '',
      });
      toast.success('Algorithm created successfully', { theme: 'dark' });
    } catch (error) {
      console.error('Algorithm creation error:', error);
      toast.error(error.message || 'Failed to create algorithm', { theme: 'dark' });
    }
  };

  const openEditModal = (algo) => {
    setEditAlgo({
      id: algo.id,
      name: algo.name || '',
      description: algo.description || '',
      difficulty: algo.difficulty || '',
      complexity: algo.complexity || '', // Ensure backend enum value
      type_id: algo.type_id ? algo.type_id.toString() : '',
      code: algo.code || '',
      explanation: algo.explanation || '',
    });
    setIsModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!isFormValid(editAlgo)) {
      toast.error('Please fill in all required fields correctly', { theme: 'dark' });
      return;
    }

    const payload = {
      name: editAlgo.name.trim(),
      description: editAlgo.description.trim(),
      difficulty: editAlgo.difficulty,
      complexity: editAlgo.complexity, // Now matches backend enum
      type_id: parseInt(editAlgo.type_id, 10), // Ensure integer
      code: editAlgo.code.trim() || null,
      explanation: editAlgo.explanation.trim() || null,
    };

    console.log('Updating Algorithm with payload:', payload);

    try {
      await adminService.updateAlgorithm(editAlgo.id, payload);
      await fetchAlgorithms();
      setIsModalOpen(false);
      setEditAlgo(null);
      toast.success('Algorithm updated successfully', { theme: 'dark' });
    } catch (error) {
      console.error('Algorithm update error:', error);
      toast.error(error.message || 'Failed to update algorithm', { theme: 'dark' });
    }
  };

  const deleteAlgorithm = async (algoId) => {
    if (window.confirm('Are you sure you want to delete this algorithm?')) {
      try {
        await adminService.deleteAlgorithm(algoId);
        await fetchAlgorithms();
        toast.success('Algorithm deleted successfully', { theme: 'dark' });
      } catch (error) {
        console.error('Algorithm deletion error:', error);
        toast.error(error.message || 'Failed to delete algorithm', { theme: 'dark' });
      }
    }
  };

  // Measure inline create form height for smooth expand/collapse
  useEffect(() => {
    const el = inlineCreateRef.current;
    if (!el) return;
    let ro;
    if (showCreateInline) {
      const updateHeight = () => setInlineMaxHeight(el.scrollHeight + 16);
      requestAnimationFrame(updateHeight);
      ro = new ResizeObserver(() => updateHeight());
      ro.observe(el);
    } else {
      setInlineMaxHeight(0);
    }
    return () => { if (ro) ro.disconnect(); };
  }, [showCreateInline]);

  return (
    <section className="manage-section">
      <div className="manage-header">
        <h2>Manage Algorithms</h2>
        <button
          type="button"
          className="cta-button add-inline"
          onClick={() => setShowCreateInline(prev => !prev)}
        >
          {showCreateInline ? 'Close' : 'Create Algorithm'}
        </button>
      </div>

      <div
        className={`inline-add-form ${showCreateInline ? 'open' : ''}`}
        style={{ maxHeight: `${inlineMaxHeight}px` }}
      >
        {showCreateInline && (
          <div className="inline-form-content" ref={inlineCreateRef}>
            <form onSubmit={handleSubmit} className="create-form">
              <input
                type="text"
                placeholder="Algorithm Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
              <textarea
                placeholder="Algorithm Code (optional)"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
              <textarea
                placeholder="Algorithm Explanation (optional)"
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              />
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                required
              >
                <option value="">Select Difficulty</option>
                {difficultyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={formData.complexity}
                onChange={(e) => setFormData({ ...formData, complexity: e.target.value })}
                required
              >
                <option value="">Select Complexity</option>
                {complexityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={formData.type_id}
                onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
                required
              >
                <option value="">Select Algorithm Type</option>
                {algoTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name || 'Unknown'}
                  </option>
                ))}
              </select>
              <div className="form-actions">
                <button
                  type="button"
                  className="cta-button secondary"
                  onClick={() => setShowCreateInline(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="cta-button primary" disabled={!isFormValid(formData)}>
                  Create
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Algorithm</h3>
            <form onSubmit={handleUpdate}>
              <input
                type="text"
                placeholder="Algorithm Name"
                value={editAlgo.name}
                onChange={(e) => setEditAlgo({ ...editAlgo, name: e.target.value })}
                required
              />
              <textarea
                placeholder="Description"
                value={editAlgo.description}
                onChange={(e) => setEditAlgo({ ...editAlgo, description: e.target.value })}
                required
              />
              <textarea
                placeholder="Algorithm Code (optional)"
                value={editAlgo.code}
                onChange={(e) => setEditAlgo({ ...editAlgo, code: e.target.value })}
              />
              <textarea
                placeholder="Algorithm Explanation (optional)"
                value={editAlgo.explanation}
                onChange={(e) => setEditAlgo({ ...editAlgo, explanation: e.target.value })}
              />
              <select
                value={editAlgo.difficulty}
                onChange={(e) => setEditAlgo({ ...editAlgo, difficulty: e.target.value })}
                required
              >
                <option value="">Select Difficulty</option>
                {difficultyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={editAlgo.complexity}
                onChange={(e) => setEditAlgo({ ...editAlgo, complexity: e.target.value })}
                required
              >
                <option value="">Select Complexity</option>
                {complexityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={editAlgo.type_id}
                onChange={(e) => setEditAlgo({ ...editAlgo, type_id: e.target.value })}
                required
              >
                <option value="">Select Algorithm Type</option>
                {algoTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name || 'Unknown'}
                  </option>
                ))}
              </select>
              <div className="modal-buttons">
                <button type="submit" className="cta-button primary">
                  Save
                </button>
                <button
                  type="button"
                  className="cta-button secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="dashboard-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Type</th>
            <th>Difficulty</th>
            <th>Complexity</th>
            <th className="actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {algorithms.length > 0 ? (
            algorithms.map((algo) => (
              <tr key={algo.id}>
                <td>{algo.id}</td>
                <td>{algo.name || 'N/A'}</td>
                <td>{algo.type_name || 'Unknown'}</td>
                <td>{algo.difficulty || 'N/A'}</td>
                <td>{algo.complexity || 'N/A'}</td>
                <td className="actions">
                  <div className="table-actions">
                    <button
                      onClick={() => openEditModal(algo)}
                      className="cta-button primary sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteAlgorithm(algo.id)}
                      className="cta-button danger sm"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">No algorithms found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
};

export default ManageAlgorithms;