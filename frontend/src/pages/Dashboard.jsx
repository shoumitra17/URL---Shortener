import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUrls();
  }, [user]);

  const fetchUrls = async () => {
    try {
      const { data } = await api.get('/urls');
      setUrls(data.urls);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShorten = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCreating(true);
    try {
      const { data } = await api.post('/urls', {
        url,
        customAlias: customAlias || undefined,
      });
      setSuccess(`Created: ${data.shortUrl}`);
      setUrl('');
      setCustomAlias('');
      fetchUrls();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to shorten URL');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (shortCode) => {
    if (!confirm('Deactivate this link?')) return;
    try {
      await api.delete(`/urls/${shortCode}`);
      fetchUrls();
    } catch (err) {
      alert(err.response?.data?.error ?? 'Failed to deactivate');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">⚡ SnapURL</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">Hi, {user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Shorten Form */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-8">
          <h2 className="text-lg font-semibold mb-4">Shorten a URL</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleShorten} className="space-y-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              placeholder="https://example.com/very-long-url"
              required
            />
            <div className="flex gap-3">
              <input
                type="text"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                placeholder="Custom alias (optional)"
              />
              <button
                type="submit"
                disabled={creating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50"
              >
                {creating ? 'Shortening...' : 'Shorten'}
              </button>
            </div>
          </form>
        </div>

        {/* URLs List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Your Links</h2>

          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : urls.length === 0 ? (
            <div className="text-center text-gray-400 py-8 bg-gray-900 rounded-2xl border border-gray-800">
              No links yet — shorten your first URL above!
            </div>
          ) : (
            <div className="space-y-3">
              {urls.map((u) => (
                <div
                  key={u._id}
                  className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-blue-400 font-medium">
                        localhost:5000/{u.shortCode}
                      </span>
                      {!u.isActive && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm truncate">{u.originalUrl}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {u.clickCount} clicks · {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => copyToClipboard(`http://localhost:5000/${u.shortCode}`)}
                      className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition"
                    >
                      Copy
                    </button>
                    <Link
                      to={`/analytics/${u.shortCode}`}
                      className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition"
                    >
                      Stats
                    </Link>
                    <button
                      onClick={() => handleDelete(u.shortCode)}
                      className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}