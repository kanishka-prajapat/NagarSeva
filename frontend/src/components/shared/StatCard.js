import React from 'react';
import { GlassCard } from '../ui/GlassCard';

const StatCard = ({ icon: Icon, label, value, sub, color = 'blue', trend }) => {
  const colors = {
    blue: 'from-blue-500 to-indigo-600 text-blue-400 shadow-blue-500/20',
    green: 'from-emerald-500 to-teal-600 text-emerald-400 shadow-emerald-500/20',
    orange: 'from-amber-400 to-orange-500 text-amber-400 shadow-amber-500/20',
    red: 'from-rose-500 to-red-600 text-rose-400 shadow-rose-500/20',
    purple: 'from-purple-500 to-fuchsia-600 text-purple-400 shadow-purple-500/20',
    indigo: 'from-primary-500 to-indigo-600 text-primary-400 shadow-primary-500/20',
  };

  const selectedColor = colors[color] || colors.blue;

  return (
    <GlassCard className="!p-5 sm:!p-6 flex items-center gap-5">
      <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg flex-shrink-0 ${selectedColor.split(' ').filter(c => c.startsWith('text-')).join(' ')}`}>
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <div className="text-3xl font-black text-white tracking-tight">{value}</div>
        <div className="text-sm font-semibold text-gray-400 mt-1">{label}</div>
        {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
        {trend !== undefined && (
          <div className={`text-xs font-bold mt-1.5 flex items-center gap-1 ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            <span className="text-lg leading-none">{trend >= 0 ? '↑' : '↓'}</span> 
            {Math.abs(trend)}% vs last month
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default StatCard;
