import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Sidebar from '../components/shared/Sidebar';
import ComplaintCard, { StatusBadge, PriorityBadge } from '../components/shared/ComplaintCard';
import { formatDateTime, CATEGORY_LABELS, getImageUrl } from '../utils/helpers';
import { PageTransition } from '../components/ui/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import Chatbot from '../components/Chatbot';
import { useAuth } from '../context/AuthContext';
import { MapPin, LayoutDashboard, Trophy, PlusCircle, Pointer, CheckCircle2, Circle, SearchX, ShieldCheck, MapPinned, FileText, Wrench, Award } from 'lucide-react';

const SIDEBAR_LINKS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/submit-complaint', icon: PlusCircle, label: 'Submit Complaint' },
  { path: '/track', icon: MapPin, label: 'Track Complaints' },
  { path: '/credits', icon: Trophy, label: 'My Credits' },
];

const STEPS = ['pending', 'in_progress', 'completed'];

export default function TrackComplaint() {
  const { id } = useParams();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    if (id && complaints.length > 0) {
      const found = complaints.find(c => c._id === id);
      if (found) setSelected(found);
    }
  }, [id, complaints]);

  const fetchComplaints = async () => {
    try {
      const { data } = await api.get('/complaints?limit=50');
      setComplaints(data.complaints);
      if (id) {
        const found = data.complaints.find(c => c._id === id);
        if (found) setSelected(found);
        else {
          const res = await api.get(`/complaints/${id}`);
          setSelected(res.data.complaint);
        }
      }
    } catch (err) {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all' ? complaints : complaints.filter(c => c.status === filter);

  const StatusTimeline = ({ status }) => (
    <div className="relative mt-8 mb-6 z-10">
      <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 rounded-full -z-10" />
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const idx = STEPS.indexOf(status);
          const done = i <= idx && status !== 'rejected';
          const active = i === idx && status !== 'rejected';
          
          return (
            <div key={s} className="flex flex-col items-center relative group">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl ${done ? 'bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-primary-500/30' : 'bg-background border-2 border-white/10 text-gray-500 group-hover:border-white/30'}`}>
                {done ? <CheckCircle2 className={`w-6 h-6 ${active ? 'animate-pulse' : ''}`} /> : <Circle className="w-4 h-4" />}
              </div>
              <div className={`mt-3 text-xs font-black uppercase tracking-widest ${done ? 'text-white' : 'text-gray-500'}`}>
                {s.replace('_', ' ')}
              </div>
              {/* Progress Line fill */}
              {i > 0 && done && (
                <div className="absolute right-1/2 top-6 h-1 bg-gradient-to-r from-primary-600 to-indigo-500 -translate-y-1/2 -z-10 transition-all duration-1000" style={{ width: '200%', right: '50%' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <PageTransition className="flex min-h-screen bg-background text-white selection:bg-primary-500 selection:text-white">
      <Sidebar links={SIDEBAR_LINKS} subtitle="Citizen Portal" />

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary-900/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"></div>
        {/* List Panel */}
        <div className="w-full lg:w-[400px] flex-shrink-0 border-r border-white/10 bg-background/50 backdrop-blur-xl flex flex-col z-20">
          <div className="p-6 border-b border-white/5">
            <h2 className="font-black text-2xl text-white mb-4 tracking-tight flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary-400" /> My Tracker
            </h2>
            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'in_progress', 'completed'].map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${filter === s ? 'bg-primary-600 text-white shadow-primary-500/25' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                  {s === 'all' ? 'All Records' : s.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {loading ? (
              [...Array(5)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)
            ) : filtered.length === 0 ? (
              <div className="text-center py-24 text-gray-500 flex flex-col items-center">
                <SearchX className="w-12 h-12 mb-4 text-white/5" />
                <p className="font-semibold text-sm">No complaints found</p>
              </div>
            ) : (
              filtered.map(c => (
                <div key={c._id} onClick={() => setSelected(c)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${selected?._id === c._id ? 'bg-primary-500/10 border-primary-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)] scale-[1.02]' : 'bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10'}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="font-bold text-sm text-white line-clamp-1">{c.title}</div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                    <span className="font-mono text-primary-400">{c.complaintNumber}</span>
                    <span>•</span>
                    <span className="truncate">{CATEGORY_LABELS[c.category] || c.category}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 lg:p-10 relative z-10 custom-scrollbar">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center flex-col text-center opacity-50">
              <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-gray-400 mb-6 shadow-2xl">
                <Pointer className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Select a Record</h2>
              <p className="text-gray-400 max-w-sm">Choose a grievance from your tracker list to view its complete resolution status.</p>
            </div>
          ) : (
            <div className="max-w-3xl w-full mx-auto animate-fadeInUp space-y-6">
              <div className="flex items-start justify-between flex-col md:flex-row gap-4">
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tight leading-tight">{selected.title}</h1>
                  <p className="text-sm font-mono text-primary-400 mt-2 font-bold tracking-wider">{selected.complaintNumber}</p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={selected.status} />
                  <PriorityBadge priority={selected.priority} />
                </div>
              </div>

              <GlassCard className="!p-8 !bg-white/[0.02] border-primary-500/10">
                <h3 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Resolution Matrix
                </h3>
                <StatusTimeline status={selected.status} />
              </GlassCard>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassCard className="!p-4 border-t-2 border-t-primary-500">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Category</div>
                  <div className="text-sm font-bold text-white truncate">{CATEGORY_LABELS[selected.category] || selected.category}</div>
                </GlassCard>
                <GlassCard className="!p-4 border-t-2 border-t-purple-500">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Assigned Unit</div>
                  <div className="text-sm font-bold text-white truncate">{selected.departmentId?.name || 'In Routing...'}</div>
                </GlassCard>
                <GlassCard className="!p-4 border-t-2 border-t-emerald-500">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Logged Date</div>
                  <div className="text-sm font-bold text-white truncate">{formatDateTime(selected.createdAt).split(',')[0]}</div>
                </GlassCard>
                <GlassCard className="!p-4 border-t-2 border-t-rose-500">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{selected.completedAt ? 'Resolved Date' : 'Target Date'}</div>
                  <div className="text-sm font-bold text-white truncate">{selected.completedAt ? formatDateTime(selected.completedAt).split(',')[0] : 'Pending'}</div>
                </GlassCard>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <GlassCard className="!p-6 h-full">
                    <h4 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Description details
                    </h4>
                    <p className="text-gray-300 text-sm leading-relaxed">{selected.description}</p>
                  </GlassCard>
                </div>

                <div className="space-y-6">
                  {selected.location?.address && (
                    <GlassCard className="!p-6">
                      <h4 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-3 flex items-center gap-2">
                        <MapPinned className="w-4 h-4 text-amber-400" /> GPS Coordinates
                      </h4>
                      <p className="text-white font-medium text-sm">{selected.location.address}</p>
                    </GlassCard>
                  )}

                  {selected.image && (
                    <GlassCard className="!p-0 overflow-hidden group">
                      <div className="p-4 bg-background/50 border-b border-white/5 flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Visual Proof</span>
                      </div>
                      <img src={getImageUrl(selected.image)} alt="complaint" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-700" />
                    </GlassCard>
                  )}
                </div>
              </div>

              {selected.workerNotes && (
                <GlassCard className="!p-6 !bg-gradient-to-r from-emerald-500/10 to-teal-600/10 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                  <h4 className="text-xs font-black text-emerald-500 tracking-widest uppercase mb-3 flex items-center gap-2">
                    <Wrench className="w-4 h-4" /> Official Resolution Notes
                  </h4>
                  <p className="text-emerald-100 text-sm font-medium leading-relaxed">{selected.workerNotes}</p>
                </GlassCard>
              )}

              {selected.status === 'completed' && selected.isGenuine && (
                <GlassCard className="!p-8 text-center !bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-500/30 overflow-hidden relative group">
                  <div className="absolute top-0 right-1/4 w-32 h-32 bg-amber-500/20 rounded-full mix-blend-screen filter blur-[40px] group-hover:bg-amber-400/30 transition-all duration-1000"></div>
                  <Award className="w-16 h-16 mx-auto mb-4 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Civic Duty Verified!</h3>
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500 mb-2">+10 Credits Awarded</div>
                  <p className="text-amber-200/80 text-sm font-medium">Your actions improved the community. Reward points have been added to your ledger.</p>
                </GlassCard>
              )}
            </div>
          )}
        </div>
      </main>
      <Chatbot userInfo={user} token={localStorage.getItem('token')} />
    </PageTransition>
  );
}
