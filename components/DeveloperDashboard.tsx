import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Code, Copy, CheckCircle2, ExternalLink, Shield } from 'lucide-react';

const DeveloperDashboard: React.FC = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';

  const htmlSnippet = `<a href="${supabaseUrl}/auth/v1/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&code_challenge=YOUR_CODE_CHALLENGE&code_challenge_method=S256" style="display: inline-flex; items-center; gap: 8px; background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-family: sans-serif; font-weight: bold;">
  <img src="https://zippytype.com/oauth/logo/logo.png" alt="ZippyType Logo" width="24" height="24" style="border-radius: 4px;" />
  Sign in with ZippyType
</a>`;

  const reactSnippet = `import React from 'react';

const ZippyTypeLoginButton = () => {
  const handleLogin = () => {
    // Generate PKCE code verifier and challenge first
    // Then redirect to Supabase OAuth endpoint
    const clientId = 'YOUR_CLIENT_ID';
    const redirectUri = 'YOUR_REDIRECT_URI';
    const codeChallenge = 'YOUR_CODE_CHALLENGE';
    
    window.location.href = \`${supabaseUrl}/auth/v1/oauth/authorize?client_id=\${clientId}&redirect_uri=\${redirectUri}&response_type=code&code_challenge=\${codeChallenge}&code_challenge_method=S256\`;
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
        src="https://zippytype.com/oauth/logo/logo.png" 
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
          <h1 className="text-3xl font-bold text-white">Developer Documentation</h1>
          <p className="text-slate-400">Integrate ZippyType authentication into your applications.</p>
        </div>
      </div>

      <div className="space-y-8">
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="text-indigo-400" size={24} />
            <h2 className="text-xl font-bold text-white">OAuth 2.1 & PKCE Flow</h2>
          </div>
          
          <div className="prose prose-invert max-w-none text-slate-300">
            <p className="mb-4">
              ZippyType uses Supabase's built-in OAuth 2.1 server with PKCE (Proof Key for Code Exchange). This is the modern, secure standard for authorization.
            </p>
            
            <h3 className="text-lg font-bold text-white mt-6 mb-2">How the Flow Works</h3>
            <ol className="list-decimal pl-5 space-y-3 mb-6">
              <li>
                <strong className="text-white">Authorization Request:</strong> Your app redirects the user to the ZippyType authorization endpoint.
                <code className="block bg-slate-900 p-2 rounded mt-1 text-xs text-indigo-300 break-all">
                  GET {supabaseUrl}/auth/v1/oauth/authorize?client_id=...&redirect_uri=...&response_type=code&code_challenge=...&code_challenge_method=S256
                </code>
              </li>
              <li>
                <strong className="text-white">User Authentication:</strong> If the user is not logged in, they are prompted to sign in to ZippyType.
              </li>
              <li>
                <strong className="text-white">Consent Screen:</strong> The user is shown a consent UI asking them to approve your app's access to their data.
              </li>
              <li>
                <strong className="text-white">Authorization Code:</strong> Upon approval, ZippyType redirects back to your <code className="text-indigo-300">redirect_uri</code> with an authorization <code className="text-indigo-300">code</code>.
              </li>
              <li>
                <strong className="text-white">Token Exchange:</strong> Your server exchanges the code and your <code className="text-indigo-300">code_verifier</code> for an access token.
                <code className="block bg-slate-900 p-2 rounded mt-1 text-xs text-indigo-300 break-all">
                  POST {supabaseUrl}/auth/v1/oauth/token
                </code>
              </li>
              <li>
                <strong className="text-white">Get User Data:</strong> Use the access token to fetch the user's profile information.
                <code className="block bg-slate-900 p-2 rounded mt-1 text-xs text-indigo-300 break-all">
                  GET {supabaseUrl}/auth/v1/user
                </code>
              </li>
            </ol>

            <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-4 flex items-start gap-3 mt-6">
              <Shield className="text-indigo-400 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-white font-bold mb-1">Registering your App</h4>
                <p className="text-sm">
                  To get a <code className="text-indigo-300">client_id</code>, you need to register your application in the Supabase Dashboard under Authentication &gt; OAuth Server.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Code className="text-indigo-400" size={24} />
            <h2 className="text-xl font-bold text-white">Login Buttons</h2>
          </div>
          
          <p className="text-slate-400 mb-6">
            Use these pre-styled buttons to add "Sign in with ZippyType" to your application. The logo is served securely via our CDN.
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
                <div dangerouslySetInnerHTML={{ __html: htmlSnippet.replace('YOUR_CLIENT_ID', '').replace('YOUR_REDIRECT_URI', '').replace('YOUR_CODE_CHALLENGE', '') }} />
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
