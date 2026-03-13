
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { OAuthApp } from '../types';
import { Plus, Trash2, Copy, Check, ExternalLink, Code, Shield, Globe } from 'lucide-react';
import { motion } from 'motion/react';

interface DeveloperDashboardProps {
  user: any;
}

const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({ user }) => {
  const [apps, setApps] = useState<OAuthApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRedirectUris, setNewRedirectUris] = useState('');
  const [editingApp, setEditingApp] = useState<OAuthApp | null>(null);
  const [editName, setEditName] = useState('');
  const [editRedirectUris, setEditRedirectUris] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchApps();
  }, [user]);

  const fetchApps = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/oauth/apps?userId=${user.id}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setApps(data);
      } else {
        console.error('Expected array of apps, got:', data);
        setApps([]);
      }
    } catch (error) {
      console.error('Error fetching apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newRedirectUris) return;

    try {
      const response = await fetch('/api/oauth/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: newName,
          redirectUris: newRedirectUris.split(',').map(u => u.trim())
        })
      });
      const data = await response.json();
      setApps([...apps, data]);
      setShowCreate(false);
      setNewName('');
      setNewRedirectUris('');
    } catch (error) {
      console.error('Error creating app:', error);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp || !editName || !editRedirectUris) return;

    try {
      const response = await fetch(`/api/oauth/apps/${editingApp.id}?userId=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          redirectUris: editRedirectUris.split(',').map(u => u.trim())
        })
      });
      const data = await response.json();
      setApps(apps.map(a => a.id === editingApp.id ? data : a));
      setEditingApp(null);
      setEditName('');
      setEditRedirectUris('');
    } catch (error) {
      console.error('Error editing app:', error);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this OAuth app?')) return;
    try {
      await fetch(`/api/oauth/apps/${id}?userId=${user.id}`, { method: 'DELETE' });
      setApps(apps.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting app:', error);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getButtonCode = (clientId: string) => {
    const baseUrl = window.location.origin;
    return `<a href="${baseUrl}/oauth/authorize?client_id=${clientId}&redirect_uri=YOUR_REDIRECT_URI&response_type=code" 
   style="background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-family: sans-serif; display: inline-flex; align-items: center; gap: 8px;">
   <img src="${baseUrl}/api/icon.png" style="width: 20px; height: 20px;" />
   Login with ZippyType
</a>`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Developer Dashboard</h1>
          <p className="text-slate-400 text-sm">Create and manage OAuth applications to use ZippyType as an identity provider.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Create App
        </button>
      </div>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-4">New OAuth Application</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase mb-2">App Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="My Awesome App"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Redirect URIs (comma separated)</label>
              <input
                type="text"
                value={newRedirectUris}
                onChange={(e) => setNewRedirectUris(e.target.value)}
                placeholder="https://myapp.com/callback, http://localhost:3000/callback"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                Create Application
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {editingApp && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-4">Edit OAuth Application</h2>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase mb-2">App Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Redirect URIs (comma separated)</label>
              <input
                type="text"
                value={editRedirectUris}
                onChange={(e) => setEditRedirectUris(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditingApp(null)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/30 border border-dashed border-slate-700 rounded-xl">
          <Shield className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-xl font-bold text-white mb-2">No Applications Yet</h3>
          <p className="text-slate-400">Create your first OAuth app to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {apps.map(app => (
            <div key={app.id} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-slate-700 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{app.name}</h3>
                  <p className="text-slate-400 text-xs font-mono">ID: {app.id}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingApp(app);
                      setEditName(app.name);
                      setEditRedirectUris(app.redirect_uris.join(', '));
                    }}
                    className="text-slate-500 hover:text-indigo-500 transition-colors"
                  >
                    <Code size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(app.id)}
                    className="text-slate-500 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Client ID</label>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-slate-900 px-3 py-2 rounded border border-slate-700 text-indigo-300 text-xs break-all">
                        {app.client_id}
                      </code>
                      <button
                        onClick={() => copyToClipboard(app.client_id, app.id + 'id')}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
                      >
                        {copiedId === app.id + 'id' ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Client Secret</label>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-slate-900 px-3 py-2 rounded border border-slate-700 text-indigo-300 text-xs break-all">
                        {app.client_secret}
                      </code>
                      <button
                        onClick={() => copyToClipboard(app.client_secret, app.id + 'secret')}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
                      >
                        {copiedId === app.id + 'secret' ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Redirect URIs</label>
                  <div className="space-y-1">
                    {app.redirect_uris.map((uri, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                        <Globe size={14} className="text-slate-500" />
                        {uri}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                      <Code size={16} />
                      Login Button Code
                    </div>
                    <button
                      onClick={() => copyToClipboard(getButtonCode(app.client_id), app.id + 'code')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedId === app.id + 'code' ? <Check size={12} /> : <Copy size={12} />}
                      {copiedId === app.id + 'code' ? 'Copied!' : 'Copy Snippet'}
                    </button>
                  </div>
                  <pre className="text-[10px] text-slate-500 overflow-x-auto p-3 bg-black/30 rounded border border-slate-800 font-mono">
                    {getButtonCode(app.client_id)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeveloperDashboard;
