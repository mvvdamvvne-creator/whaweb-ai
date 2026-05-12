import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ label, value, trend, trendUp }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
    <div className="flex justify-between items-start mb-3">
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
      {trend && (
        <div className={`p-1 rounded-md ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        </div>
      )}
    </div>
    <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
    {trend && (
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className={`text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend}
        </span>
        <span className="text-[10px] text-slate-400 font-medium tracking-tight">vs période précédente</span>
      </div>
    )}
  </div>
);

export default StatCard;
