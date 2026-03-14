
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseService';
import { Shield, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface OAuthAuthorizeProps {
  user: any;
}

const OAuthAuthorize: React.FC<OAuthAuthorizeProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState<{ name: string; redirect_uris: string[] } | null>(null);
  const [authorizing, setAuthorizing] = useState(false);

  const query = new URLSearchParams(location.search);
  const clientId = query.get('client_id');
  const redirectUri = query.get('redirect_uri');
  const responseType = query.get('response_type');

  useEffect(() => {
    if (!clientId) {
      setError('Missing client_id parameter.');
      setLoading(false);
      return;
    }

    fetchClientInfo();
  }, [clientId]);

  const fetchClientInfo = async () => {
    try {
      const response = await fetch(`/api/oauth/client-info?client_id=${clientId}`);
      if (!response.ok) throw new Error('Application not found');
      const data = await response.json();
      
      // If redirectUri is provided, validate it. 
      // If not, we'll use the first one from the app's registered URIs during authorization.
      if (redirectUri && !data.redirect_uris.includes(redirectUri)) {
        throw new Error('Redirect URI mismatch');
      }
      
      setClientInfo(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async () => {
    if (!user) return;

    const finalRedirectUri = redirectUri || (clientInfo?.redirect_uris && clientInfo.redirect_uris[0]);
    
    if (!finalRedirectUri) {
      setError('No redirect URI specified or found for this application.');
      return;
    }

    setAuthorizing(true);
    try {
      const response = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: finalRedirectUri,
          userId: user.id
        })
      });
      
      const data = await response.json();
      if (data.code) {
        const url = new URL(finalRedirectUri);
        url.searchParams.append('code', data.code);
        window.location.href = url.toString();
      } else {
        throw new Error(data.error || 'Authorization failed');
      }
    } catch (err: any) {
      setError(err.message);
      setAuthorizing(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Shield size={64} className="text-indigo-500 mb-6 animate-pulse" />
        <h1 className="text-2xl font-bold text-white mb-4">Login Required</h1>
        <p className="text-slate-400 mb-8 max-w-md">You need to be logged in to ZippyType to authorize this application.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl backdrop-blur-xl"
      >
        {loading ? (
          <div className="flex flex-col items-center py-12">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
            <p className="text-slate-400">Loading application details...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
            <h2 className="text-xl font-bold text-white mb-2">OAuth Error</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="text-indigo-400 hover:text-indigo-300 font-bold"
            >
              Return to ZippyType
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                <Shield size={40} className="text-indigo-500" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white text-center mb-2">Authorize {clientInfo?.name}</h1>
            <p className="text-slate-400 text-center text-sm mb-8">
              This application would like to access your ZippyType profile information.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <Check size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white text-sm font-bold">Read Profile</p>
                  <p className="text-slate-500 text-xs">Access your username, handle, and avatar.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <Check size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white text-sm font-bold">Pro Status</p>
                  <p className="text-slate-500 text-xs">Verify if you have an active ZippyType Pro subscription.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleAuthorize}
                disabled={authorizing}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                {authorizing ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                Authorize Application
              </button>
              <button
                onClick={() => navigate('/')}
                disabled={authorizing}
                className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <X size={20} />
                Cancel
              </button>
            </div>

            <p className="mt-6 text-[10px] text-slate-500 text-center uppercase tracking-widest font-bold">
              Secure Login via ZippyType
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default OAuthAuthorize;
