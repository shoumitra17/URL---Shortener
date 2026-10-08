import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Analytics() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get(`/analytics/${code}`);
        setData(data);
      } catch (err) {
        setError(err.response?.data?.error ?? 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">⚡ SnapURL</h1>
        <Link to="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
          <p className="text-gray-400 text-sm mb-1">Short URL</p>
          <p className="text-blue-400 font-semibold text-lg">
            localhost:5000/{data.shortCode}
          </p>
          <p className="text-gray-400 text-sm mt-2 truncate">{data.originalUrl}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
            <p className="text-3xl font-bold text-blue-400">{data.totalClicks}</p>
            <p className="text-gray-400 text-sm mt-1">Total Clicks</p>
          </div>

          {Object.entries(data.byDevice).map(([device, count]) => (
            <div key={device} className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
              <p className="text-3xl font-bold text-green-400">{count}</p>
              <p className="text-gray-400 text-sm mt-1 capitalize">{device}</p>
            </div>
          ))}
        </div>

        {/* Last 7 Days */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
          <h2 className="text-lg font-semibold mb-4">Last 7 Days</h2>
          <div className="flex items-end gap-2 h-32">
            {data.last7Days.map((day) => {
              const max = Math.max(...data.last7Days.map((d) => d.clicks), 1);
              const height = (day.clicks / max) * 100;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-400">{day.clicks}</span>
                  <div
                    className="w-full bg-blue-600 rounded-t"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-xs text-gray-500">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Browser */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">By Browser</h2>
            {Object.entries(data.byBrowser).length === 0 ? (
              <p className="text-gray-400 text-sm">No data yet</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(data.byBrowser).map(([browser, count]) => (
                  <div key={browser} className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">{browser}</span>
                    <span className="text-blue-400 font-medium">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">By OS</h2>
            {Object.entries(data.byOs).length === 0 ? (
              <p className="text-gray-400 text-sm">No data yet</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(data.byOs).map(([os, count]) => (
                  <div key={os} className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">{os}</span>
                    <span className="text-blue-400 font-medium">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}