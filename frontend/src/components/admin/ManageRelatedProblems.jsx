import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, X, ExternalLink, Filter, Search, Zap } from 'lucide-react';
import { toast } from 'react-toastify';

const ManageRelatedProblems = () => {
  const [problems, setProblems] = useState([]);
  const [pendingProblems, setPendingProblems] = useState([]);
  const [algorithms, setAlgorithms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form state
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
      setLoading(true);
      await Promise.all([
        fetchProblems(),
        fetchPendingProblems(),
        fetchAlgorithms()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProblems = async () => {
    try {
      const response = await fetch('/api/problems/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProblems(data);
      }
    } catch (error) {
      console.error('Error fetching problems:', error);
    }
  };

  const fetchPendingProblems = async () => {
    try {
      const response = await fetch('/api/problems/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingProblems(data);
      }
    } catch (error) {
      console.error('Error fetching pending problems:', error);
    }
  };

  const fetchAlgorithms = async () => {
    try {
      const response = await fetch('/api/algorithms');
      if (response.ok) {
        const data = await response.json();
        setAlgorithms(data);
      }
    } catch (error) {
      console.error('Error fetching algorithms:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingProblem ? `/api/problems/${editingProblem.id}` : '/api/problems/';
      const method = editingProblem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(`Problem ${editingProblem ? 'updated' : 'created'} successfully`);
        setShowAddModal(false);
        setEditingProblem(null);
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save problem');
      }
    } catch (error) {
      console.error('Error saving problem:', error);
      toast.error('Failed to save problem');
    }
  };

  const handleDelete = async (problemId) => {
    if (!window.confirm('Are you sure you want to delete this problem?')) {
      return;
    }

    try {
      const response = await fetch(`/api/problems/${problemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Problem deleted successfully');
        fetchData();
      } else {
        toast.error('Failed to delete problem');
      }
    } catch (error) {
      console.error('Error deleting problem:', error);
      toast.error('Failed to delete problem');
    }
  };

  const handleApprovalAction = async (problemId, action) => {
    try {
      const response = await fetch(`/api/problems/${problemId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: action })
      });

      if (response.ok) {
        toast.success(`Problem ${action} successfully`);
        fetchData();
      } else {
        toast.error(`Failed to ${action} problem`);
      }
    } catch (error) {
      console.error(`Error ${action} problem:`, error);
      toast.error(`Failed to ${action} problem`);
    }
  };

  const handleAutoSuggest = async (algorithmId) => {
    try {
      const response = await fetch(`/api/problems/auto-suggest/${algorithmId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        fetchData();
      } else {
        toast.error('Failed to auto-suggest problems');
      }
    } catch (error) {
      console.error('Error auto-suggesting problems:', error);
      toast.error('Failed to auto-suggest problems');
    }
  };

  const handleSyncAll = async () => {
    try {
      toast.info('Starting sync with YouKnowWho Academy... This may take a moment.');
      
      const response = await fetch('/api/problems/sync-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          toast.success(result.message);
        } else {
          toast.info(result.message);
        }
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to sync algorithms');
      }
    } catch (error) {
      console.error('Error syncing algorithms:', error);
      toast.error('Failed to sync algorithms with YouKnowWho Academy');
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
  };

  const openEditModal = (problem) => {
    setFormData({
      title: problem.title,
      platform: problem.platform,
      difficulty: problem.difficulty,
      problem_url: problem.problem_url,
      problem_id: problem.problem_id || '',
      description: problem.description || '',
      tags: problem.tags || '',
      algorithm_id: problem.algorithm_id
    });
    setEditingProblem(problem);
    setShowAddModal(true);
  };

  const getPlatformColor = (platform) => {
    const colors = {
      'LeetCode': 'bg-orange-100 text-orange-800',
      'Codeforces': 'bg-blue-100 text-blue-800',
      'AtCoder': 'bg-gray-100 text-gray-800',
      'CodeChef': 'bg-yellow-100 text-yellow-800',
      'HackerRank': 'bg-green-100 text-green-800',
    };
    return colors[platform] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'beginner': 'bg-green-100 text-green-800',
      'easy': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'hard': 'bg-red-100 text-red-800',
      'expert': 'bg-purple-100 text-purple-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         problem.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAlgorithm = !selectedAlgorithm || problem.algorithm_id.toString() === selectedAlgorithm;
    const matchesStatus = statusFilter === 'all' || problem.status === statusFilter;
    
    return matchesSearch && matchesAlgorithm && matchesStatus;
  });

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Related Problems</h1>
          <p className="text-gray-600">Add, edit, and manage algorithm practice problems</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingProblem(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Problem
        </button>
      </div>

      {/* Pending Approvals */}
      {pendingProblems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800 mb-4">
            Pending Approvals ({pendingProblems.length})
          </h2>
          <div className="space-y-3">
            {pendingProblems.map((problem) => (
              <div key={problem.id} className="flex items-center justify-between bg-white p-4 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900">{problem.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${getPlatformColor(problem.platform)}`}>
                      {problem.platform}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{problem.description}</p>
                  <div className="text-xs text-gray-500">
                    Source: {problem.source} | Algorithm: {algorithms.find(a => a.id === problem.algorithm_id)?.name}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprovalAction(problem.id, 'approved')}
                    className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleApprovalAction(problem.id, 'rejected')}
                    className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <select
          value={selectedAlgorithm}
          onChange={(e) => setSelectedAlgorithm(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Algorithms</option>
          {algorithms.map((algorithm) => (
            <option key={algorithm.id} value={algorithm.id}>
              {algorithm.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>

        <button
          onClick={() => {
            if (selectedAlgorithm) {
              handleAutoSuggest(selectedAlgorithm);
            } else {
              toast.error('Please select an algorithm first');
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Filter className="w-4 h-4" />
          Auto-Suggest
        </button>
        
        <button
          onClick={handleSyncAll}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Zap className="w-4 h-4" />
          Sync All Algorithms
        </button>
      </div>

      {/* Problems Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Problem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Algorithm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProblems.map((problem) => (
                <tr key={problem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{problem.title}</div>
                      {problem.problem_id && (
                        <div className="text-sm text-gray-500">#{problem.problem_id}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${getPlatformColor(problem.platform)}`}>
                      {problem.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {algorithms.find(a => a.id === problem.algorithm_id)?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${
                      problem.status === 'approved' ? 'bg-green-100 text-green-800' :
                      problem.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {problem.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <a
                        href={problem.problem_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => openEditModal(problem)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(problem.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingProblem ? 'Edit Problem' : 'Add New Problem'}
              </h2>
              
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
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Problem ID
                    </label>
                    <input
                      type="text"
                      value={formData.problem_id}
                      onChange={(e) => setFormData({...formData, problem_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Platform *
                    </label>
                    <select
                      required
                      value={formData.platform}
                      onChange={(e) => setFormData({...formData, platform: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {platforms.map(platform => (
                        <option key={platform} value={platform}>{platform}</option>
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
                      onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {difficulties.map(difficulty => (
                        <option key={difficulty} value={difficulty}>{difficulty}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Algorithm *
                    </label>
                    <select
                      required
                      value={formData.algorithm_id}
                      onChange={(e) => setFormData({...formData, algorithm_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Algorithm</option>
                      {algorithms.map(algorithm => (
                        <option key={algorithm.id} value={algorithm.id}>
                          {algorithm.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Problem URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.problem_url}
                    onChange={(e) => setFormData({...formData, problem_url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Array, Binary Search, Dynamic Programming"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingProblem ? 'Update Problem' : 'Add Problem'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingProblem(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRelatedProblems;
