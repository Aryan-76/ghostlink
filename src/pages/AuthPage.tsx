import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Mail, Lock, Fingerprint, Layout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuthStore();

  React.useEffect(() => {
    if (!isAuthLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isAuthLoading, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update Firebase Auth profile
        await updateProfile(user, { displayName });

        // Sync to Firestore users collection
        const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        await setDoc(doc(db, 'users', user.uid), {
          userId: user.uid,
          email: user.email,
          displayName: displayName,
          role: 'user',
          status: 'Active',
          avatarUrl: '',
          updatedAt: serverTimestamp()
        });
      }
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      let message = "Authentication failed. Please try again.";
      
      switch (err.code) {
        case 'auth/invalid-credential':
          message = "Invalid email or password. Please check your credentials.";
          break;
        case 'auth/user-not-found':
          message = "No account found with this email.";
          break;
        case 'auth/wrong-password':
          message = "Incorrect password. Please try again.";
          break;
        case 'auth/email-already-in-use':
          message = "An account already exists with this email.";
          break;
        case 'auth/operation-not-allowed':
          message = "This sign-in method is currently disabled.";
          break;
        case 'auth/weak-password':
          message = "Password must be at least 6 characters long.";
          break;
      }
      
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    console.log("[Auth] Google Login START");
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      console.log("[Auth] Google Login SUCCESS:", user.uid);

      // Ensure user exists in Firestore
      const { setDoc, doc, getDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        console.log("[Auth] Initializing new user profile in Firestore");
        await setDoc(doc(db, 'users', user.uid), {
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || 'Anonymous',
          role: 'user',
          status: 'Active',
          avatarUrl: user.photoURL || '',
          theme: 'dark',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error("[Auth] Google Login FAILURE:", err);
      if (err.code !== 'auth/popup-closed-by-user') {
        const currentDomain = window.location.hostname;
        console.error(`[Auth Diagnostic] Authentication failed from domain: ${currentDomain}`);
        
        let message = "Authentication failed. Please try again.";
        if (err.code === 'auth/unauthorized-domain') {
          message = `This domain (${currentDomain}) is not authorized for authentication. Please update your Firebase settings.`;
        } else if (err.code === 'auth/invalid-credential') {
          message = "Invalid login credentials. Please try again.";
        }
        
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-8 relative overflow-hidden transition-colors selection:bg-app-primary/30">
      {/* Background Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-app-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-app-primary flex items-center justify-center mx-auto mb-6 shadow-xl shadow-app-primary/20">
            <Layout size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-app-foreground tracking-tight mb-2">
            GhostLink Console
          </h1>
          <p className="text-sm text-app-muted font-medium opacity-70">Initialize your secure workspace session.</p>
        </div>

        <div className="bg-app-card border border-app-border p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-app-primary to-indigo-400 opacity-50" />
          
          <div className="flex gap-4 mb-8 border-b border-app-border">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${
                isLogin ? 'text-app-foreground border-app-primary' : 'text-app-muted border-transparent hover:text-app-foreground'
              }`}
            >
              Access
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${
                !isLogin ? 'text-app-foreground border-app-primary' : 'text-app-muted border-transparent hover:text-app-foreground'
              }`}
            >
              Deploy
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-[10px] font-bold text-red-500 uppercase tracking-widest"
              >
                {error}
              </motion.div>
            )}
            {!isLogin && (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-app-muted uppercase tracking-widest pl-1 opacity-60">Identity Alias</label>
                <div className="relative group">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted opacity-30 group-focus-within:text-app-primary transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nexus Operator"
                    required
                    className="w-full bg-app-muted-bg border border-app-border py-4 pl-12 pr-4 rounded-2xl text-app-foreground placeholder:text-app-muted/30 focus:outline-none focus:ring-2 focus:ring-app-primary/20 transition-all text-sm font-bold"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-app-muted uppercase tracking-widest pl-1 opacity-60">Credentials</label>
              <div className="relative group/mail">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted opacity-30 group-focus-within/mail:text-app-primary transition-colors" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@nexus.io"
                  required
                  className="w-full bg-app-muted-bg border border-app-border py-4 pl-12 pr-4 rounded-2xl text-app-foreground placeholder:text-app-muted/30 focus:outline-none focus:ring-2 focus:ring-app-primary/20 transition-all text-sm font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center pl-1">
                <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest opacity-60">Secured Access</label>
                {isLogin && (
                  <button 
                    type="button"
                    onClick={() => toast.info('Access recovery instructions transmitted.')}
                    className="text-[10px] font-bold text-app-primary hover:text-indigo-400 transition-colors uppercase tracking-widest"
                  >
                    Recover
                  </button>
                )}
              </div>
              <div className="relative group/pass">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted opacity-30 group-focus-within/pass:text-app-primary transition-colors" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-app-muted-bg border border-app-border py-4 pl-12 pr-4 rounded-2xl text-app-foreground placeholder:text-app-muted/30 focus:outline-none focus:ring-2 focus:ring-app-primary/20 transition-all text-sm font-bold"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 bg-app-foreground text-app-bg rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-3 group/btn shadow-lg active:scale-95"
            >
              {isLoading ? 'Synchronizing...' : (isLogin ? 'Access Console' : 'Deploy Identity')}
              {!isLoading && <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-app-border">
            <p className="text-center text-[9px] font-bold text-app-muted uppercase tracking-widest mb-6 opacity-40">External Protocols</p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={handleGoogleLogin}
                className="w-full bg-app-card border border-app-border py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-app-muted-bg transition-all text-app-foreground shadow-sm active:scale-95 group/google"
              >
                <div className="w-5 h-5 rounded-full bg-app-foreground flex items-center justify-center group-hover/google:rotate-[360deg] transition-all duration-500">
                   <div className="w-2 h-2 bg-app-bg rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Sign in with Google Account</span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-12 space-y-2">
          <p className="text-[9px] font-bold text-app-muted uppercase tracking-[0.3em] opacity-30">
            Nexus Intelligence System • Secure Core
          </p>
        </div>
      </motion.div>
    </div>
  );
}
