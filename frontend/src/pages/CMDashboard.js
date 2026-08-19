import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/shared/Sidebar';
import StatCard from '../components/shared/StatCard';
import { formatCurrency, CATEGORY_LABELS, formatDateTime } from '../utils/helpers';
import { StatusBadge, PriorityBadge } from '../components/shared/ComplaintCard';
import { PageTransition } from '../components/ui/PageTransition';
import { GlassCard } from '../components/ui/GlassCard';
import ComplaintMap from '../components/ComplaintMap';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis
} from 'recharts';
import Chatbot from '../components/Chatbot';
import {
  Landmark,
  FileText,
  Users,
  CheckCircle,
  Clock,
  RefreshCw,
  Building2,
  IndianRupee,
  Zap,
  BarChart3,
  List,
  PieChart as PieChartIcon,
  Download,
  ShieldAlert,
  UserX,
  AlertTriangle
} from 'lucide-react';
const SIDEBAR_LINKS = [{ path: '/cm', icon: '🏛️', label: 'CM Monitor' }];
const COLORS_ARR = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function CMDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [deptPerf, setDeptPerf] = useState([]);
  const [catDist, setCatDist] = useState([]);
  const [trends, setTrends] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [downloading, setDownloading] = useState(false);

  console.log('✅ CMDashboard DEBUG FILE LOADED');
  console.log('📌 Current complaints state:', complaints);
  console.log('📌 Current stats state:', stats);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      console.log('🚀 fetchAll started');

      const [s, d, c, t, comp] = await Promise.all([
        api.get('/cm/stats'),
        api.get('/cm/department-performance'),
        api.get('/cm/category-distribution'),
        api.get('/cm/monthly-trends'),
        api.get('/cm/complaints?limit=100')
      ]);

      console.log('✅ /cm/stats', s.data);
      console.log('✅ /cm/department-performance', d.data);
      console.log('✅ /cm/category-distribution', c.data);
      console.log('✅ /cm/monthly-trends', t.data);
      console.log('✅ /cm/complaints', comp.data);

      setStats(s.data.stats);
      setDeptPerf(d.data.performance || []);
      setCatDist(
        (c.data.distribution || []).map((x) => ({
          name: CATEGORY_LABELS[x._id] || x._id || 'Unknown',
          value: x.count || 0
        }))
      );
      setTrends(
        (t.data.trends || []).map((x) => ({
          name: `${x._id.month}/${x._id.year}`,
          total: x.total,
          resolved: x.resolved
        }))
      );
      setComplaints(comp.data.complaints || []);

      console.log('✅ State set successfully');
    } catch (err) {
      console.error('❌ fetchAll failed:', err);
      console.error('❌ fetchAll response:', err?.response?.data);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
      console.log('✅ loading false');
    }
  };

  const handleDownloadExcel = async () => {
    try {
      console.log('📥 Excel download clicked');
      setDownloading(true);

      const response = await api.get('/cm/export-excel', {
        responseType: 'blob'
      });

      console.log('✅ Excel response received:', response);

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const today = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.download = `CM_Dashboard_Report_${today}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success('Excel downloaded successfully');
    } catch (err) {
      console.error('❌ Excel download failed:', err);
      console.error('❌ Excel error response:', err?.response?.data);
      toast.error('Failed to download Excel');
    } finally {
      setDownloading(false);
    }
  };

  const radarData = deptPerf.slice(0, 6).map((d) => ({
    dept: d.code || d.name?.substring(0, 6) || 'NA',
    score: d.resolutionRate || 0
  }));

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'complaints', label: 'All Complaints', icon: List },
    { id: 'analytics', label: 'Advanced Analytics', icon: PieChartIcon }
  ];

  return (
    <PageTransition className="flex min-h-screen bg-background selection:bg-rose-500 selection:text-white">
      <Sidebar links={SIDEBAR_LINKS} subtitle="Executive Office" />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-[1000px] h-[800px] bg-rose-900/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          

          

          <div className="mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <Landmark className="w-8 h-8 text-rose-500" /> Executive State Dashboard
              </h1>
              <p className="text-gray-400 mt-2">
                Centralized monitoring of all state grievance operations
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleDownloadExcel}
                disabled={downloading}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-60 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Downloading...' : 'Download Excel'}
              </button>

              <div className="text-xs font-mono text-gray-500 bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2 backdrop-blur-md shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mb-8 overflow-x-auto pb-2 custom-scrollbar border-b border-white/5">
            {tabs.map((t) => {
              const TabIcon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === t.id
                      ? 'bg-white/10 text-white border-b-2 border-rose-500'
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <TabIcon className={`w-4 h-4 ${activeTab === t.id ? 'text-rose-400' : ''}`} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'overview' && (
            <>
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="skeleton h-24 rounded-2xl" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <StatCard icon={FileText} label="Total Complaints" value={stats?.totalComplaints || 0} color="blue" />
  <StatCard icon={CheckCircle} label="Resolved" value={stats?.completedComplaints || 0} color="green" />
  <StatCard icon={Clock} label="Pending" value={stats?.pendingComplaints || 0} color="orange" />
  <StatCard icon={RefreshCw} label="In Progress" value={stats?.inProgressComplaints || 0} color="purple" />
  <StatCard icon={Users} label="Total Citizens" value={stats?.totalCitizens || 0} color="indigo" />
  <StatCard icon={Building2} label="Departments" value={stats?.totalDepartments || 0} color="teal" />
  <StatCard icon={IndianRupee} label="Total Expense" value={formatCurrency(stats?.totalExpense)} color="red" />
  <StatCard icon={Zap} label="Resolution Rate" value={`${stats?.resolutionRate || 0}%`} color="green" />
  
  <StatCard icon={ShieldAlert} label="Fraud Complaints" value={stats?.fraudComplaints || 0} color="red" />
  <StatCard icon={UserX} label="Suspicious Users" value={stats?.suspiciousUsers || 0} color="orange" />
  <StatCard icon={AlertTriangle} label="Fraud Rate" value={`${stats?.fraudRate || 0}%`} color="red" />
</div>
                  <div className="grid lg:grid-cols-2 gap-6 mb-6">
                    <div className="card">
                      <h3 className="font-bold text-gray-800 mb-4">📈 Monthly Trends</h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={trends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} name="Total" dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="card">
                      <h3 className="font-bold text-gray-800 mb-4">🏷️ By Category</h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={catDist}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => {
                              const safeName = name ? String(name) : 'Unknown';
                              const shortName = safeName.includes(' ') ? safeName.split(' ')[1] : safeName;
                              return `${shortName}: ${(percent * 100).toFixed(0)}%`;
                            }}
                            labelLine={false}
                          >
                            {catDist.map((_, i) => (
                              <Cell key={i} fill={COLORS_ARR[i % COLORS_ARR.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="font-bold text-gray-800 mb-4">🏢 Department Resolution Rates</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={deptPerf} margin={{ left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} unit="%" />
                        <Tooltip formatter={(v) => `${v}%`} />
                        <Bar dataKey="resolutionRate" name="Resolution %" radius={[6, 6, 0, 0]}>
                          {deptPerf.map((_, i) => (
                            <Cell key={i} fill={COLORS_ARR[i % COLORS_ARR.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                 

                  <div className="mt-6">
                    <ComplaintMap complaints={complaints} />
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'departments' && (
            <div className="space-y-6 animate-fadeInUp">
              {loading ? (
                [...Array(4)].map((_, i) => <div key={i} className="skeleton h-40 rounded-3xl" />)
              ) : deptPerf.map((d) => (
                <GlassCard key={d.id} className="!p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6 border-b border-white/5 pb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">{d.name}</h3>
                      <span className="text-xs font-mono font-bold bg-white/5 border border-white/10 text-gray-400 px-3 py-1 rounded-lg mt-2 inline-block shadow-sm tracking-wider uppercase">
                        {d.code}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={`text-4xl font-black ${d.resolutionRate >= 70 ? 'text-emerald-400' : d.resolutionRate >= 40 ? 'text-amber-400' : 'text-rose-400'} drop-shadow-lg`}>
                        {d.resolutionRate}%
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">
                        Resolution Rate
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-background rounded-full h-3 border border-white/5 overflow-hidden mb-6 shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${d.resolutionRate >= 70 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : d.resolutionRate >= 40 ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-gradient-to-r from-rose-600 to-red-500'}`}
                      style={{ width: `${d.resolutionRate}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { label: 'Total Volume', value: d.total, icon: List, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                      { label: 'Resolved Tickets', value: d.resolved, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                      { label: 'Pending Triage', value: d.pending, icon: Clock, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
                      { label: 'Active Works', value: d.inProgress, icon: RefreshCw, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
                      { label: 'Fund Expenditure', value: formatCurrency(d.totalExpense), icon: IndianRupee, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' }
                    ].map((item, idx) => (
                      <div key={idx} className={`rounded-2xl p-4 border flex flex-col items-center justify-center text-center ${item.bg}`}>
                        <item.icon className={`w-6 h-6 mb-2 ${item.color}`} />
                        <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {d.resolutionRate < 40 && (
                    <div className="mt-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl px-5 py-4 text-sm text-rose-300 flex items-start gap-3 shadow-inner">
                      <Zap className="w-5 h-5 flex-shrink-0 text-rose-500" />
                      <div>
                        <strong className="text-rose-400 block mb-1">Critical Priority Alert!</strong>
                        Department resolution rate is below acceptable threshold (40%). Requires immediate intervention and resource allocation.
                      </div>
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          )}

          {activeTab === 'complaints' && (
            <GlassCard className="!p-0 overflow-hidden animate-fadeInUp flex flex-col h-[800px]" hover={false}>
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <List className="w-5 h-5 text-indigo-400" /> State-Wide Registry
                </h3>
                <span className="text-sm text-gray-500 font-medium bg-white/5 border border-white/10 px-3 py-1 rounded-lg">
                  {complaints.length} Extracted
                </span>
              </div>
              <div className="overflow-x-auto flex-1 custom-scrollbar p-2">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-xl">
                    <tr>
                      {['ID', 'Subject', 'Category', 'Status', 'Priority', 'Department', 'Citizen', 'Filing Date'].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-white/5"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {complaints.map((c) => (
                      <tr key={c._id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 text-xs font-mono text-indigo-400 font-medium whitespace-nowrap">
                          {c.complaintNumber}
                        </td>
                        <td className="px-6 py-4 font-bold text-white max-w-[200px] truncate group-hover:text-primary-300 transition-colors">
                          {c.title}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-400">
                          {CATEGORY_LABELS[c.category] || c.category}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-6 py-4">
                          <PriorityBadge priority={c.priority} />
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-400 whitespace-nowrap">
                          {c.departmentId?.name || '—'}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-300">
                          {c.citizenId?.name || '—'}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                          {formatDateTime(c.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}

          {activeTab === 'analytics' && (
            <div className="grid lg:grid-cols-2 gap-8 animate-fadeInUp">
              <GlassCard className="!p-6 sm:!p-8">
                <h3 className="text-xl font-bold text-white mb-6">🎯 Matrix Validation Radar</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="dept" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Radar
                      name="Resolution Metric"
                      dataKey="score"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fill="#6366f1"
                      fillOpacity={0.2}
                      dot={{ r: 4, fill: '#6366f1' }}
                    />
                    <Tooltip contentStyle={{ backgroundColor: '#0b0f1a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </GlassCard>

              <GlassCard className="!p-6 sm:!p-8">
                <h3 className="text-xl font-bold text-white mb-6">💰 Resource Allocation Output</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={deptPerf} layout="vertical" margin={{ left: 60, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="code"
                      tick={{ fill: '#d1d5db', fontSize: 11, fontWeight: 'bold' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      formatter={(v) => formatCurrency(v)}
                      contentStyle={{ backgroundColor: '#0b0f1a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }}
                    />
                    <Bar dataKey="totalExpense" name="Total Expenditure" radius={[0, 6, 6, 0]} maxBarSize={30}>
                      {deptPerf.map((_, i) => (
                        <Cell key={i} fill={COLORS_ARR[i % COLORS_ARR.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>

              <GlassCard className="!p-6 sm:!p-8 lg:col-span-2">
                <h3 className="text-xl font-bold text-white mb-6">📊 Historical Resolution Index Comparison</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#0b0f1a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="total" name="Total Filed" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="resolved" name="Validated & Resolved" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            </div>
          )}
        </div>
      </main>

      <Chatbot userInfo={user} token={localStorage.getItem('token')} />
    </PageTransition>
  );
}