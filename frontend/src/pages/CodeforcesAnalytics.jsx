import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CodeforcesDashboard from '../components/CodeforcesDashboard';
import { User, Search, Save, ExternalLink, Info } from 'lucide-react';
import { toast } from 'react-toastify';

const CodeforcesAnalytics = () => {
  const { user } = useAuth();
  const [handle, setHandle] = useState('');
  const [savedHandle, setSavedHandle] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    // Load saved handle from localStorage or user profile
    const saved = localStorage.getItem('codeforces_handle');
    if (saved) {
      setSavedHandle(saved);
      setHandle(saved);
      setShowDashboard(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!handle.trim()) {
      toast.error('Please enter a valid Codeforces handle');
      return;
    }

    // Save handle to localStorage
    localStorage.setItem('codeforces_handle', handle.trim());
    setSavedHandle(handle.trim());
    setShowDashboard(true);
    toast.success('Codeforces handle saved!');
  };

  const handleClear = () => {
    localStorage.removeItem('codeforces_handle');
    setSavedHandle('');
    setHandle('');
    setShowDashboard(false);
    toast.info('Codeforces handle cleared');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            Codeforces Analytics
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Analyze your Codeforces performance with detailed statistics, problem-solving patterns, 
            and progress tracking similar to CFViz.
          </p>
        </div>

        {/* Handle Input Form */}
        <div className="bg-white rounded-lg border p-6 mb-8 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="handle" className="block text-sm font-medium text-gray-700 mb-2">
                Codeforces Handle
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="handle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="Enter your Codeforces handle (e.g., tourist, Benq)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Your handle is the username you use on Codeforces (case-sensitive)
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Save className="w-4 h-4" />
                Analyze Profile
              </button>

              {savedHandle && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Clear Handle
                </button>
              )}

              <a
                href="https://codeforces.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Visit Codeforces
              </a>
            </div>
          </form>

          {/* Info Section */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">What you'll see:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Comprehensive problem-solving statistics</li>
                  <li>• Rating progress and contest performance</li>
                  <li>• Problem difficulty and tag analysis</li>
                  <li>• Submission patterns and language usage</li>
                  <li>• Recent activity and achievements</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        {showDashboard && savedHandle && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Analytics for: <span className="text-blue-600">{savedHandle}</span>
              </h2>
              <p className="text-gray-600">
                Data fetched from Codeforces API • Updates in real-time
              </p>
            </div>
            
            <CodeforcesDashboard handle={savedHandle} />
          </div>
        )}

        {/* Sample Handles for Demo */}
        {!showDashboard && (
          <div className="bg-white rounded-lg border p-6 max-w-2xl mx-auto">
            <h3 className="font-medium text-gray-900 mb-3">Try with sample handles:</h3>
            <div className="flex flex-wrap gap-2">
              {['tourist', 'Benq', 'jiangly', 'Um_nik', 'Radewoosh'].map((sampleHandle) => (
                <button
                  key={sampleHandle}
                  onClick={() => {
                    setHandle(sampleHandle);
                    localStorage.setItem('codeforces_handle', sampleHandle);
                    setSavedHandle(sampleHandle);
                    setShowDashboard(true);
                  }}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  {sampleHandle}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeforcesAnalytics;