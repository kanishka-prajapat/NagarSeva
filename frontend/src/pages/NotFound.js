import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/ui/PageTransition';
import { Button } from '../components/ui/Button';
import { Home, Compass } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <PageTransition className="min-h-screen flex items-center justify-center bg-background text-white selection:bg-primary-500 selection:text-white relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-900/20 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"></div>
      
      <div className="text-center relative z-10 max-w-lg px-6">
        <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <Compass className="w-16 h-16 text-gray-400" />
        </div>
        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary-400 to-indigo-600 mb-4 tracking-tight drop-shadow-md">404</h1>
        <h2 className="text-3xl font-bold text-white mb-4">Sector Not Found</h2>
        <p className="text-gray-400 mb-10 text-lg leading-relaxed font-medium">The municipal sector or page you are looking for has been moved or doesn't exist in our current matrix.</p>
        <Button onClick={() => navigate('/')} icon={Home} className="px-10 py-4 text-lg shadow-primary-500/20">
          Return to Hub
        </Button>
      </div>
    </PageTransition>
  );
}
