import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Code, Copy, CheckCircle2, Shield, Plus, Trash2, Loader2 } from 'lucide-react';

interface DeveloperDashboardProps {
  user: any;
}

const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({ user }) => {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppRedirectUri, setNewAppRedirectUri] = useState('');
  const [error, setError] = useState('');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const appUrl = 'https://zippytype.vercel.app';

  useEffect(() => {
    if (user) {
      fetchApps();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchApps = async () => {
    try {
      const res = await fetch(`/api/oauth/apps?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setApps(data);
      }
    } catch (err) {
      console.error('Failed to fetch apps', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName || !newAppRedirectUri) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setCreating(true);
    try {
      const res = await fetch('/api/oauth/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: newAppName,
          redirectUris: [newAppRedirectUri]
        })
      });
      if (res.ok) {
        const newApp = await res.json();
        setApps([...apps, newApp]);
        setSelectedAppId(newApp.id);
        setNewAppName('');
        setNewAppRedirectUri('');
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to create app');
      }
    } catch (err) {
      setError('An error occurred while creating the app');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteApp = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this app? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/oauth/apps/${appId}?userId=${user.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setApps(apps.filter(app => app.id !== appId));
      }
    } catch (err) {
      console.error('Failed to delete app', err);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const selectedApp = apps.find(a => a.id === selectedAppId) || apps[0];
  const displayClientId = selectedApp?.client_id || 'YOUR_CLIENT_ID';
  const displayRedirectUri = selectedApp?.redirect_uris?.[0] || 'YOUR_REDIRECT_URI';

  const htmlSnippet = `<a href="${appUrl}/oauth/authorize?client_id=${displayClientId}&redirect_uri=${encodeURIComponent(displayRedirectUri)}&code_challenge=YOUR_CODE_CHALLENGE&code_challenge_method=S256" style="display: inline-flex; align-items: center; gap: 8px; background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-family: sans-serif; font-weight: bold;">
  <img src="https://ewdrrhdsxjrhxyzgjokg.supabase.co/storage/v1/object/public/assets/logos.png" alt="ZippyType Logo" width="24" height="24" style="border-radius: 4px;" />
  Sign in with ZippyType
</a>`;

  const reactSnippet = `import React from 'react';

const ZippyTypeLoginButton = () => {
  const handleLogin = () => {
    const clientId = '${displayClientId}';
    const redirectUri = '${displayRedirectUri}';
    const codeChallenge = 'YOUR_CODE_CHALLENGE'; // Generate this using PKCE
    
    window.location.href = \`${appUrl}/oauth/authorize?client_id=\${clientId}&redirect_uri=\${redirectUri}&code_challenge=\${codeChallenge}&code_challenge_method=S256\`;
  };

  return (
    <button 
      onClick={handleLogin}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#4f46e5',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '16px'
      }}
    >
      <img 
        src="https://ewdrrhdsxjrhxyzgjokg.supabase.co/storage/v1/object/public/assets/logos.png" 
        alt="ZippyType" 
        width={24} 
        height={24} 
        style={{ borderRadius: '4px' }}
      />
      Sign in with ZippyType
    </button>
  );
};

export default ZippyTypeLoginButton;`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
          <Code size={32} className="text-indigo-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Developer Dashboard</h1>
          <p className="text-slate-400">Integrate ZippyType authentication into your applications.</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* App Management Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-indigo-400" size={24} />
            <h2 className="text-xl font-bold text-white">Your OAuth Applications</h2>
          </div>

          {!user ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm">
              You must be signed in to manage OAuth applications.
            </div>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
          ) : (
            <div className="space-y-6">
              {apps.length > 0 ? (
                <div className="space-y-4">
                  {apps.map(app => (
                    <div key={app.id} className={`bg-slate-900/50 border rounded-xl p-5 relative group transition-all ${selectedAppId === app.id ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-slate-700'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-white">{app.name}</h3>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setSelectedAppId(app.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${selectedAppId === app.id ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                          >
                            {selectedAppId === app.id ? 'Selected' : 'Select for Snippets'}
                          </button>
                          <button 
                            onClick={() => handleDeleteApp(app.id)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete App"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Client ID</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 bg-black/40 px-3 py-2 rounded-lg text-indigo-300 text-sm font-mono break-all border border-white/5">
                              {app.client_id}
                            </code>
                            <button onClick={() => handleCopy(app.client_id, `client_id_${app.id}`)} className="p-2 text-slate-400 hover:text-white bg-black/40 rounded-lg border border-white/5">
                              {copiedText === `client_id_${app.id}` ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Client Secret</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 bg-black/40 px-3 py-2 rounded-lg text-rose-300 text-sm font-mono break-all border border-white/5">
                              {app.client_secret}
                            </code>
                            <button onClick={() => handleCopy(app.client_secret, `client_secret_${app.id}`)} className="p-2 text-slate-400 hover:text-white bg-black/40 rounded-lg border border-white/5">
                              {copiedText === `client_secret_${app.id}` ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Redirect URIs</p>
                          <div className="bg-black/40 px-3 py-2 rounded-lg border border-white/5">
                            {app.redirect_uris.map((uri: string, i: number) => (
                              <div key={i} className="text-slate-300 text-sm font-mono break-all">{uri}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  You haven't created any OAuth applications yet.
                </div>
              )}

              <div className="bg-slate-900/80 border border-indigo-500/30 rounded-xl p-5">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Plus size={18} className="text-indigo-400" />
                  Create New Application
                </h3>
                <form onSubmit={handleCreateApp} className="space-y-4">
                  {error && <div className="text-rose-400 text-sm bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">{error}</div>}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">App Name</label>
                    <input 
                      type="text" 
                      value={newAppName}
                      onChange={e => setNewAppName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
                      placeholder="My Awesome App"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Redirect URI</label>
                    <input 
                      type="url" 
                      value={newAppRedirectUri}
                      onChange={e => setNewAppRedirectUri(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
                      placeholder="https://myapp.com/auth/callback"
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={creating}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {creating ? <Loader2 className="animate-spin" size={18} /> : 'Create Application'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </motion.section>

        {/* Documentation Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="text-indigo-400" size={24} />
            <h2 className="text-xl font-bold text-white">OAuth 2.1 Flow (PKCE)</h2>
          </div>
          
          <div className="prose prose-invert max-w-none text-slate-300">
            <p className="mb-4">
              ZippyType provides a secure OAuth 2.1 authorization code flow with PKCE. Follow these steps to authenticate users and access their profile data.
            </p>
            
            <h3 className="text-lg font-bold text-white mt-6 mb-2">1. Authorization Request</h3>
            <p className="text-sm mb-2">Redirect the user to ZippyType's authorization endpoint. You must include a <code className="text-indigo-300">code_challenge</code> and <code className="text-indigo-300">code_challenge_method</code> (S256 recommended).</p>
            <code className="block bg-slate-900 p-3 rounded-xl mt-1 text-sm font-mono text-indigo-300 break-all border border-slate-700">
              GET {appUrl}/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&code_challenge=YOUR_CODE_CHALLENGE&code_challenge_method=S256
            </code>

            <h3 className="text-lg font-bold text-white mt-6 mb-2">2. Token Exchange</h3>
            <p className="text-sm mb-2">After the user approves, they will be redirected back to your <code className="text-indigo-300">redirect_uri</code> with a <code className="text-indigo-300">code</code> parameter. Exchange this code and your <code className="text-indigo-300">code_verifier</code> for an access token:</p>
            <code className="block bg-slate-900 p-3 rounded-xl mt-1 text-sm font-mono text-indigo-300 break-all border border-slate-700">
              POST {appUrl}/api/oauth/token<br/>
              Content-Type: application/json<br/><br/>
              {`{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "code": "CODE_FROM_URL",
  "code_verifier": "YOUR_CODE_VERIFIER",
  "grant_type": "authorization_code",
  "redirect_uri": "YOUR_REDIRECT_URI"
}`}
            </code>

            <h3 className="text-lg font-bold text-white mt-6 mb-2">3. Get User Data</h3>
            <p className="text-sm mb-2">Use the access token to fetch the user's profile information:</p>
            <code className="block bg-slate-900 p-3 rounded-xl mt-1 text-sm font-mono text-indigo-300 break-all border border-slate-700">
              GET {appUrl}/api/oauth/userinfo<br/>
              Authorization: Bearer YOUR_ACCESS_TOKEN
            </code>
            <p className="text-sm mt-2">Response format:</p>
            <code className="block bg-slate-900 p-3 rounded-xl mt-1 text-sm font-mono text-emerald-300 break-all border border-slate-700">
              {`{
  "sub": "user_id",
  "username": "PilotName",
  "handle": "pilot_handle",
  "avatar": "https://...",
  "is_pro": true
}`}
            </code>
          </div>
        </motion.section>

        {/* Login Buttons Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Code className="text-indigo-400" size={24} />
            <h2 className="text-xl font-bold text-white">Login Buttons</h2>
          </div>
          
          <p className="text-slate-400 mb-6">
            Use these pre-styled buttons to add "Sign in with ZippyType" to your application.
          </p>

          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-bold">HTML Snippet</h3>
                <button 
                  onClick={() => handleCopy(htmlSnippet, 'html')}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-sm transition-colors"
                >
                  {copiedText === 'html' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  {copiedText === 'html' ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto border border-slate-700">
                <pre className="text-sm text-slate-300 font-mono">
                  {htmlSnippet}
                </pre>
              </div>
              <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700 flex justify-center">
                <div dangerouslySetInnerHTML={{ __html: htmlSnippet.replace('YOUR_CODE_CHALLENGE', 'demo_challenge') }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-bold">React Component</h3>
                <button 
                  onClick={() => handleCopy(reactSnippet, 'react')}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-sm transition-colors"
                >
                  {copiedText === 'react' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  {copiedText === 'react' ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto border border-slate-700">
                <pre className="text-sm text-slate-300 font-mono">
                  {reactSnippet}
                </pre>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default DeveloperDashboard;
