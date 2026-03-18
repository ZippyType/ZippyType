import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { Shield, Check, X } from 'lucide-react';
import { motion } from 'motion/react';

const OAuthConsent: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [redirectUri, setRedirectUri] = useState<string | null>(null);
  const [codeChallenge, setCodeChallenge] = useState<string | null>(null);
  const [codeChallengeMethod, setCodeChallengeMethod] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const cId = params.get('client_id');
        const rUri = params.get('redirect_uri');
        const cChallenge = params.get('code_challenge');
        const cChallengeMethod = params.get('code_challenge_method');

        if (!cId || !rUri) {
          throw new Error('Missing client_id or redirect_uri parameters');
        }

        if (!cChallenge) {
          throw new Error('OAuth 2.1 requires code_challenge parameter');
        }

        setClientId(cId);
        setRedirectUri(rUri);
        setCodeChallenge(cChallenge);
        setCodeChallengeMethod(cChallengeMethod || 'plain');

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // Redirect to login, preserving the current URL
          window.location.href = `/?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          return;
        }
        setUserId(user.id);

        // Fetch client info from our custom API
        const response = await fetch(`/api/oauth/client-info?client_id=${cId}`);
        const contentType = response.headers.get('content-type');
        
        if (!response.ok) {
          if (contentType && contentType.includes('application/json')) {
            const errData = await response.json();
            throw new Error(errData.error || 'Invalid client_id');
          } else {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }
        }
        
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response. Please check your backend configuration.');
        }

        const data = await response.json();
        
        // Validate redirect URI
        if (!data.redirect_uris.includes(rUri)) {
          throw new Error('Invalid redirect_uri for this client');
        }

        setClientInfo(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleApprove = async () => {
    if (!clientId || !redirectUri || !userId) return;
    setLoading(true);
    try {
      const response = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          code_challenge: codeChallenge,
          code_challenge_method: codeChallengeMethod,
          userId: userId
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to authorize');
      }

      const data = await response.json();
      
      // Redirect back to the client with the code
      const url = new URL(redirectUri);
      url.searchParams.set('code', data.code);
      window.location.href = url.toString();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDeny = () => {
    if (!redirectUri) return;
    const url = new URL(redirectUri);
    url.searchParams.set('error', 'access_denied');
    window.location.href = url.toString();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-slate-400">Loading authorization details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="text-rose-500 mb-4">
          <Shield size={64} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">OAuth Error</h2>
        <p className="text-slate-400 mb-6 max-w-md">{error}</p>
        <button
          onClick={() => window.location.href = '/'}
          className="text-indigo-400 hover:text-indigo-300 font-bold"
        >
          Return to ZippyType
        </button>
      </div>
    );
  }

  if (!clientInfo) return null;

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-700"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
            <Shield size={40} className="text-indigo-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-white mb-2">
          Authorize <span className="text-indigo-400">{clientInfo.name || 'Application'}</span>
        </h1>
        <p className="text-slate-400 text-center text-sm mb-8">
          This application would like to access your ZippyType account.
        </p>

        <div className="space-y-4 mb-8">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
            <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Client</p>
            <p className="text-white font-medium">{clientInfo.name || 'Unknown Client'}</p>
          </div>
          
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
            <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Redirect URI</p>
            <p className="text-slate-300 text-sm break-all">{redirectUri}</p>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
            <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-3">Requested Permissions</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-slate-300">
                <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>Read your profile information (username, handle, avatar)</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-300">
                <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>Verify your Pro status</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={handleApprove}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <Check size={20} />
            Approve Access
          </button>
          <button 
            onClick={handleDeny}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <X size={20} />
            Deny
          </button>
        </div>

        <p className="mt-6 text-[10px] text-slate-500 text-center uppercase tracking-widest font-bold">
          Secure Login via ZippyType
        </p>
      </motion.div>
    </div>
  );
};

export default OAuthConsent;
