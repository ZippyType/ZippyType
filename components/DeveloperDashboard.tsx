
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { OAuthApp } from '../types';
import { Plus, Trash2, Copy, Check, ExternalLink, Code, Shield, Globe, BookOpen } from 'lucide-react';
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
  const [showDocs, setShowDocs] = useState(false);

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
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create app');
      }
      setApps([...apps, data]);
      setShowCreate(false);
      setNewName('');
      setNewRedirectUris('');
    } catch (error: any) {
      console.error('Error creating app:', error);
      alert('Error creating app: ' + error.message + '\n\nPlease ensure the oauth_apps table exists in your Supabase database.');
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
      if (!response.ok) {
        throw new Error(data.error || 'Failed to edit app');
      }
      setApps(apps.map(a => a.id === editingApp.id ? data : a));
      setEditingApp(null);
      setEditName('');
      setEditRedirectUris('');
    } catch (error: any) {
      console.error('Error editing app:', error);
      alert('Error editing app: ' + error.message);
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

  const getHtmlButtonCode = (clientId: string) => {
    const baseUrl = "https://zippytype.vercel.app";
    return `<!-- HTML -->
<a href="${baseUrl}/oauth/authorize?client_id=${clientId}" 
   style="background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-family: sans-serif; display: inline-flex; align-items: center; gap: 8px; font-weight: bold;">
   <img src="${baseUrl}/oauth/logo/logo.png" style="width: 20px; height: 20px;" alt="ZippyType Logo" />
   Sign in with ZippyType
</a>`;
  };

  const getReactButtonCode = (clientId: string) => {
    const baseUrl = "https://zippytype.vercel.app";
    return `// React / Next.js
const ZippyTypeLogin = () => {
  const loginUrl = "${baseUrl}/oauth/authorize?client_id=${clientId}";
  
  return (
    <a 
      href={loginUrl}
      style={{
        background: '#6366f1', color: 'white', padding: '10px 20px', 
        borderRadius: '8px', textDecoration: 'none', fontFamily: 'sans-serif', 
        display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 'bold'
      }}
    >
      <img src="${baseUrl}/oauth/logo/logo.png" style={{ width: 20, height: 20 }} alt="ZippyType Logo" />
      Sign in with ZippyType
    </a>
  );
};`;
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Shield size={64} className="text-indigo-500 mb-6 animate-pulse" />
        <h1 className="text-2xl font-bold text-white mb-4">Developer Access</h1>
        <p className="text-slate-400 mb-8 max-w-md">You need to be logged in to ZippyType to access the Developer Dashboard.</p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Developer Dashboard</h1>
          <p className="text-slate-400 text-sm">Create and manage OAuth applications to use ZippyType as an identity provider.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDocs(!showDocs)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <BookOpen size={20} />
            {showDocs ? 'My Apps' : 'Documentation'}
          </button>
          {!showDocs && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Create App
            </button>
          )}
        </div>
      </div>

      {showDocs ? (
        <div className="space-y-8">
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">How ZippyType OAuth Works</h2>
            <p className="text-slate-300 mb-4 text-sm leading-relaxed">
              ZippyType implements a standard OAuth 2.0 Authorization Code flow. This is the modern, secure standard for authorization, allowing third-party applications (like your own app, or AI agents using the Model Context Protocol) to safely access a user's ZippyType profile data without ever seeing their password.
            </p>
            
            <div className="space-y-8 mt-8">
              <div>
                <h3 className="text-lg font-bold text-indigo-400 mb-2">1. The Authorization Request</h3>
                <p className="text-slate-300 mb-2 text-sm">
                  Redirect the user to ZippyType's authorization endpoint. You can use the HTML or React snippets provided in your app's dashboard.
                </p>
                <pre className="text-[11px] text-slate-400 p-4 bg-black/40 rounded-xl border border-slate-800 font-mono overflow-x-auto">
                  GET https://zippytype.vercel.app/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-bold text-indigo-400 mb-2">2. Handling the Callback</h3>
                <p className="text-slate-300 mb-2 text-sm">
                  After the user approves your app on the Consent Screen, they will be redirected back to your <code>redirect_uri</code> with a <code>code</code> parameter in the URL.
                </p>
                <pre className="text-[11px] text-slate-400 p-4 bg-black/40 rounded-xl border border-slate-800 font-mono overflow-x-auto">
                  https://your-app.com/callback?code=abc123xyz...
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-bold text-indigo-400 mb-2">3. Exchanging the Code for a Token</h3>
                <p className="text-slate-300 mb-2 text-sm">
                  Make a server-side POST request to exchange the authorization code for an access token. <strong>Do not do this on the frontend</strong> to keep your client secret safe.
                </p>
                <pre className="text-[11px] text-slate-400 p-4 bg-black/40 rounded-xl border border-slate-800 font-mono overflow-x-auto">
{`POST https://zippytype.vercel.app/api/oauth/token
Content-Type: application/json

{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "code": "THE_CODE_FROM_URL",
  "grant_type": "authorization_code"
}`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-bold text-indigo-400 mb-2">4. Fetching User Data</h3>
                <p className="text-slate-300 mb-2 text-sm">
                  Use the access token to fetch the user's ZippyType profile information via a standard REST API request.
                </p>
                <pre className="text-[11px] text-slate-400 p-4 bg-black/40 rounded-xl border border-slate-800 font-mono overflow-x-auto">
{`GET https://zippytype.vercel.app/api/oauth/userinfo
Authorization: Bearer YOUR_ACCESS_TOKEN`}
                </pre>
                <p className="text-slate-300 mt-4 mb-2 text-sm font-bold">Example Response:</p>
                <pre className="text-[11px] text-slate-400 p-4 bg-black/40 rounded-xl border border-slate-800 font-mono overflow-x-auto">
{`{
  "id": "user-uuid...",
  "username": "TypeMaster99",
  "handle": "typemaster99",
  "avatar_url": "https://...",
  "is_pro": true
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
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
                      setEditRedirectUris((app.redirect_uris || []).join(', '));
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
                    {(app.redirect_uris || []).map((uri, i) => (
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
                      Sign in with ZippyType (HTML)
                    </div>
                    <button
                      onClick={() => copyToClipboard(getHtmlButtonCode(app.client_id), app.id + 'htmlcode')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedId === app.id + 'htmlcode' ? <Check size={12} /> : <Copy size={12} />}
                      {copiedId === app.id + 'htmlcode' ? 'Copied!' : 'Copy HTML'}
                    </button>
                  </div>
                  <pre className="text-[10px] text-slate-500 overflow-x-auto p-3 bg-black/30 rounded border border-slate-800 font-mono mb-4">
                    {getHtmlButtonCode(app.client_id)}
                  </pre>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                      <Code size={16} />
                      Sign in with ZippyType (React)
                    </div>
                    <button
                      onClick={() => copyToClipboard(getReactButtonCode(app.client_id), app.id + 'reactcode')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedId === app.id + 'reactcode' ? <Check size={12} /> : <Copy size={12} />}
                      {copiedId === app.id + 'reactcode' ? 'Copied!' : 'Copy React'}
                    </button>
                  </div>
                  <pre className="text-[10px] text-slate-500 overflow-x-auto p-3 bg-black/30 rounded border border-slate-800 font-mono">
                    {getReactButtonCode(app.client_id)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default DeveloperDashboard;
