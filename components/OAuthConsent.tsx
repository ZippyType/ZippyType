import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { Shield, Check, X } from 'lucide-react';
import { motion } from 'motion/react';

const OAuthConsent: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authDetails, setAuthDetails] = useState<any>(null);
  const [authorizationId, setAuthorizationId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const authId = params.get('authorization_id');

        if (!authId) {
          throw new Error('Missing authorization_id parameter');
        }
        setAuthorizationId(authId);

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // Redirect to login, preserving the authorization_id
          window.location.href = `/?redirect=/oauth/consent?authorization_id=${authId}`;
          return;
        }

        const { data, error: detailsError } = await supabase.auth.oauth.getAuthorizationDetails(authId);

        if (detailsError || !data) {
          throw new Error(detailsError?.message || 'Invalid authorization request');
        }

        setAuthDetails(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleApprove = async () => {
    if (!authorizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.oauth.approveAuthorization(authorizationId);
      if (error) throw error;
      if (data?.redirect_to) {
        window.location.href = data.redirect_to;
      } else {
        throw new Error('No redirect URL provided by Supabase');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!authorizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.oauth.denyAuthorization(authorizationId);
      if (error) throw error;
      if (data?.redirect_to) {
        window.location.href = data.redirect_to;
      } else {
        throw new Error('No redirect URL provided by Supabase');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
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

  if (!authDetails) return null;

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
          Authorize <span className="text-indigo-400">{authDetails.client?.name || 'Application'}</span>
        </h1>
        <p className="text-slate-400 text-center text-sm mb-8">
          This application would like to access your ZippyType account.
        </p>

        <div className="space-y-4 mb-8">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
            <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Client</p>
            <p className="text-white font-medium">{authDetails.client?.name || 'Unknown Client'}</p>
          </div>
          
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
            <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Redirect URI</p>
            <p className="text-slate-300 text-sm break-all">{authDetails.redirect_uri}</p>
          </div>

          {authDetails.scope && authDetails.scope.trim() && (
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-3">Requested Permissions</p>
              <ul className="space-y-2">
                {authDetails.scope.split(' ').map((scopeItem: string) => (
                  <li key={scopeItem} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span>{scopeItem}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
