import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Check, 
  X, 
  Search,
  Filter,
  Target,
  BookOpen,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

const RelatedProblemsManager = () => {
  const [problems, setProblems] = useState([]);
  const [algorithms, setAlgorithms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    platform: 'LeetCode',
    difficulty: 'easy',
    problem_url: '',
    problem_id: '',
    description: '',
    tags: '',
    algorithm_id: ''
  });

  const platforms = ['LeetCode', 'Codeforces', 'AtCoder', 'CodeChef', 'HackerRank', 'SPOJ', 'UVa', 'HackerEarth', 'TopCoder', 'GeeksforGeeks'];
  const difficulties = ['beginner', 'easy', 'medium', 'hard', 'expert'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [problemsRes, algorithmsRes] = await Promise.all([
        fetch('http://localhost:8000/api/problems/all', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch('http://localhost:8000/api/algorithms')
      ]);

      if (problemsRes.ok && algorithmsRes.ok) {
        const problemsData = await problemsRes.json();
        const algorithmsData = await algorithmsRes.json();
        setProblems(problemsData);
        setAlgorithms(algorithmsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingProblem 
        ? `http://localhost:8000/api/problems/${editingProblem.id}`
        : 'http://localhost:8000/api/problems/';
      
      const method = editingProblem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          algorithm_id: parseInt(formData.algorithm_id)
        })
      });

      if (response.ok) {
        toast.success(editingProblem ? 'Problem updated successfully!' : 'Problem added successfully!');
        resetForm();
        fetchData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to save problem');
      }
    } catch (error) {
      console.error('Error saving problem:', error);
      toast.error('Failed to save problem');
    }
  };

  const handleEdit = (problem) => {
    setEditingProblem(problem);
    setFormData({
      title: problem.title,
      platform: problem.platform,
      difficulty: problem.difficulty,
      problem_url: problem.problem_url,
      problem_id: problem.problem_id || '',
      description: problem.description || '',
      tags: problem.tags || '',
      algorithm_id: problem.algorithm_id.toString()
    });
    setShowAddForm(true);
  };

  const handleDelete = async (problemId) => {
    if (!window.confirm('Are you sure you want to delete this problem?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/problems/${problemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Problem deleted successfully!');
        fetchData();
      } else {
        toast.error('Failed to delete problem');
      }
    } catch (error) {
      console.error('Error deleting problem:', error);
      toast.error('Failed to delete problem');
    }
  };

  const handleStatusUpdate = async (problemId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:8000/api/problems/${problemId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success(`Problem ${newStatus} successfully!`);
        fetchData();
      } else {
        toast.error('Failed to update problem status');
      }
    } catch (error) {
      console.error('Error updating problem status:', error);
      toast.error('Failed to update problem status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      platform: 'LeetCode',
      difficulty: 'easy',
      problem_url: '',
      problem_id: '',
      description: '',
      tags: '',
      algorithm_id: ''
    });
    setEditingProblem(null);
    setShowAddForm(false);
  };

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         problem.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAlgorithm = selectedAlgorithm === 'all' || problem.algorithm_id.toString() === selectedAlgorithm;
    const matchesStatus = selectedStatus === 'all' || problem.status === selectedStatus;
    return matchesSearch && matchesAlgorithm && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPlatformColor = (platform) => {
    const colors = {
      'LeetCode': 'bg-orange-500 text-white',
      'Codeforces': 'bg-blue-500 text-white',
      'AtCoder': 'bg-gray-700 text-white',
      'CodeChef': 'bg-yellow-600 text-white',
      'HackerRank': 'bg-green-500 text-white',
      'SPOJ': 'bg-purple-500 text-white',
      'UVa': 'bg-red-500 text-white',
      'HackerEarth': 'bg-indigo-500 text-white',
      'TopCoder': 'bg-pink-500 text-white',
      'GeeksforGeeks': 'bg-emerald-600 text-white'
    };
    return colors[platform] || 'bg-gray-500 text-white';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading problems...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <Target className="w-6 h-6 text-blue-500 mr-2" />
            Related Problems Manager
          </h2>
          <p className="text-gray-600">
            Manage practice problems for algorithms
          </p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Problem
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-blue-600">{problems.length}</div>
          <div className="text-sm text-gray-600">Total Problems</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-green-600">
            {problems.filter(p => p.status === 'approved').length}
          </div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {problems.filter(p => p.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-red-600">
            {problems.filter(p => p.status === 'rejected').length}
          </div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Algorithms</option>
                {algorithms.map((algo) => (
                  <option key={algo.id} value={algo.id.toString()}>
                    {algo.name}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {editingProblem ? 'Edit Problem' : 'Add New Problem'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Algorithm *
                </label>
                <select
                  required
                  value={formData.algorithm_id}
                  onChange={(e) => setFormData({ ...formData, algorithm_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Algorithm</option>
                  {algorithms.map((algo) => (
                    <option key={algo.id} value={algo.id}>
                      {algo.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform *
                </label>
                <select
                  required
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {platforms.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty *
                </label>
                <select
                  required
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {difficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Problem URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.problem_url}
                  onChange={(e) => setFormData({ ...formData, problem_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Problem ID
                </label>
                <input
                  type="text"
                  value={formData.problem_id}
                  onChange={(e) => setFormData({ ...formData, problem_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="binary search, array, sorting"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingProblem ? 'Update Problem' : 'Add Problem'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Problems List */}
      <div className="space-y-4">
        {filteredProblems.map((problem) => (
          <div key={problem.id} className="bg-white rounded-lg border p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {problem.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(problem.status)}`}>
                    {problem.status}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlatformColor(problem.platform)}`}>
                    {problem.platform}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {problem.difficulty}
                  </span>
                  {problem.problem_id && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">
                      #{problem.problem_id}
                    </span>
                  )}
                  <span className="text-sm text-gray-600">
                    Algorithm: {algorithms.find(a => a.id === problem.algorithm_id)?.name}
                  </span>
                </div>

                {problem.description && (
                  <p className="text-gray-600 text-sm mb-3">
                    {problem.description}
                  </p>
                )}

                {problem.tags && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {problem.tags.split(',').map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href={problem.problem_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                View Problem
              </a>

              <button
                onClick={() => handleEdit(problem)}
                className="flex items-center gap-2 px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-3 h-3" />
                Edit
              </button>

              {problem.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(problem.id, 'approved')}
                    className="flex items-center gap-2 px-3 py-1 border border-green-500 text-green-600 rounded text-sm hover:bg-green-50 transition-colors"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(problem.id, 'rejected')}
                    className="flex items-center gap-2 px-3 py-1 border border-red-500 text-red-600 rounded text-sm hover:bg-red-50 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Reject
                  </button>
                </>
              )}

              <button
                onClick={() => handleDelete(problem.id)}
                className="flex items-center gap-2 px-3 py-1 border border-red-500 text-red-600 rounded text-sm hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProblems.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No problems found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedAlgorithm !== 'all' || selectedStatus !== 'all'
              ? 'Try adjusting your filters to find problems.'
              : 'Start by adding your first problem.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default RelatedProblemsManager;