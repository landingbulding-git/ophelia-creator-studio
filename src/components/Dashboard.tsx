import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { 
  Play, 
  Trash2, 
  ExternalLink, 
  Clock, 
  Layers,
  Layout as LayoutIcon,
  LogOut,
  Sparkles
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GuideMetadata {
  id: string;
  title: string;
  domain: string;
  step_count: number;
  created_at: any;
  userId: string;
}

export default function Dashboard() {
  const { user, signIn, logOut, loading } = useAuth();
  const [guides, setGuides] = useState<GuideMetadata[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) {
      setGuides([]);
      setFetching(false);
      return;
    }

    const q = query(
      collection(db, 'guides'),
      where('userId', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GuideMetadata[];
      setGuides(data);
      setFetching(false);
    }, (error) => {
      console.error("Error fetching guides:", error);
      setFetching(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this guide?')) return;
    
    try {
      await deleteDoc(doc(db, 'guides', id));
      // Also delete from Cloudflare KV via Worker if necessary, 
      // but Firestore delete might trigger a function or we handle it here
      const token = await user?.getIdToken();
      await fetch(`https://ophelia-gemini-worker.norbertb-consulting.workers.dev/guide/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ophelia-orange"></div>
    </div>
  );

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="w-16 h-16 bg-ophelia-orange rounded-full shadow-[0_0_30px_rgba(255,122,26,0.5)] mb-8 animate-pulse"></div>
      <h1 className="text-4xl font-bold mb-4">Ophelia Studio</h1>
      <p className="text-gray-400 mb-8 max-w-md text-lg">
        The professional way to manage and edit your AI-guided tutorials.
      </p>
      <button 
        onClick={signIn}
        className="bg-ophelia-orange hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 shadow-lg"
      >
        <Sparkles className="w-5 h-5" />
        Sign in with Google
      </button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-8 h-8 bg-ophelia-orange rounded-full shadow-[0_0_15px_rgba(255,122,26,0.3)]"></div>
            My Guides
          </h1>
          <p className="text-gray-500 mt-1">{guides.length} tutorials recorded</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium">{user.displayName || user.email}</div>
            <div className="text-xs text-gray-500">Creator Account</div>
          </div>
          <button 
            onClick={logOut}
            className="p-2 text-gray-500 hover:text-white transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {fetching ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card-bg border border-white/5 rounded-2xl h-48 animate-pulse"></div>
          ))}
        </div>
      ) : guides.length === 0 ? (
        <div className="bg-card-bg border border-white/5 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <LayoutIcon className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">No guides yet</h2>
          <p className="text-gray-500 mb-8">Start recording tutorials with the Ophelia extension.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <a 
              key={guide.id}
              href={`/guide/${guide.id}`}
              className="group bg-card-bg border border-white/5 rounded-2xl p-5 hover:border-ophelia-orange/30 transition-all hover:translate-y-[-2px] block"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-ophelia-orange/10 transition-colors">
                  <Play className="w-5 h-5 text-gray-400 group-hover:text-ophelia-orange transition-colors" />
                </div>
                <button 
                  onClick={(e) => handleDelete(e, guide.id)}
                  className="p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-bold text-lg mb-1 truncate">{guide.title}</h3>
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                <ExternalLink className="w-3 h-3" />
                <span className="truncate">{guide.domain}</span>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 pt-4 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  {guide.step_count} steps
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {guide.created_at?.toDate ? new Date(guide.created_at.toDate()).toLocaleDateString() : 'Just now'}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
