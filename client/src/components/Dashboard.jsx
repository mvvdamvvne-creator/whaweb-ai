import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Plus, 
  Smartphone, 
  RefreshCcw, 
  CheckCircle2, 
  Loader2, 
  Search, 
  Filter, 
  MessageSquare,
  Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from './StatCard';

const Dashboard = ({ whatsappStatus, qrCode }) => {
  const [stats, setStats] = useState({
    totalSent: '0',
    openRate: '0%',
    replyRate: '0%',
    totalContacts: '0'
  });
  const [chartData, setChartData] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const summaryRes = await api.get('/stats/summary');
      const chartRes = await api.get('/stats/chart');
      const recentRes = await api.get('/stats/recent');

      setStats({
        totalSent: (summaryRes.data.totalSent || 0).toLocaleString(),
        openRate: summaryRes.data.openRate || '0%',
        replyRate: summaryRes.data.replyRate || '0%',
        totalContacts: (summaryRes.data.totalContacts || 0).toLocaleString()
      });
      setChartData(chartRes.data || []);
      setRecentMessages(recentRes.data || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 relative z-10">
      {/* Connection Status Card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
        <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start relative z-10">
          <div className="flex-1 space-y-5">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${whatsappStatus === 'CONNECTED' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} border border-white shadow-sm`}>
                <Smartphone size={32} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">Appareil WhatsApp</h3>
                <p className="text-slate-500 font-medium text-sm">Liez votre téléphone pour envoyer des messages</p>
              </div>
            </div>
            
            <div className="flex items-center gap-5 py-1">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${whatsappStatus === 'CONNECTED' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} border border-white shadow-sm`}>
                <div className={`w-2 h-2 rounded-full ${whatsappStatus === 'CONNECTED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 animate-pulse'}`}></div>
                <span className="text-[11px] font-medium uppercase tracking-wider">{whatsappStatus === 'CONNECTED' ? 'Connecté' : 'Non lié'}</span>
              </div>
              {whatsappStatus !== 'CONNECTED' && (
                <button 
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 transition-all uppercase tracking-widest"
                >
                  <RefreshCcw size={12} strokeWidth={3} />
                  Réinitialiser
                </button>
              )}
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl space-y-4 border border-slate-100 shadow-inner">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Instructions rapides</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {[
                  { icon: '1', text: 'Ouvrez WhatsApp sur mobile' },
                  { icon: '2', text: 'Menu Appareils liés' },
                  { icon: '3', text: 'Lier un appareil' },
                  { icon: '4', text: 'Scannez le code QR unique' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border border-emerald-100">{step.icon}</span>
                    <span className="text-xs font-semibold text-slate-600">{step.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center">
            <div className="w-56 h-56 bg-white rounded-3xl border border-slate-200 flex items-center justify-center relative shadow-xl shadow-slate-200/50 p-4 group-hover:border-emerald-500/20 transition-all duration-300">
              {whatsappStatus === 'QR_READY' && qrCode ? (
                <img src={qrCode} alt="WhatsApp QR Code" className="w-full h-full rounded-xl" />
              ) : whatsappStatus === 'CONNECTED' ? (
                <div className="flex flex-col items-center gap-3 text-emerald-600 animate-in zoom-in duration-500">
                  <div className="p-4 bg-emerald-50 rounded-full border border-emerald-100">
                    <CheckCircle2 size={48} strokeWidth={2} />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-widest">Opérationnel</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-300">
                  <Loader2 size={32} className="animate-spin" strokeWidth={2} />
                  <span className="text-[10px] font-medium uppercase tracking-widest">Initialisation...</span>
                </div>
              )}
            </div>
            <p className="mt-4 text-[10px] font-medium text-slate-400 uppercase tracking-[0.3em]">Code de Session</p>
          </div>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Messages Envoyés" value={stats.totalSent} />
        <StatCard label="Taux d'Ouverture" value={stats.openRate} />
        <StatCard label="Taux de Réponse" value={stats.replyRate} />
        <StatCard label="Contacts Actifs" value={stats.totalContacts} />
      </div>

      {/* Charts & Delivery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-semibold text-slate-900 text-lg tracking-tight">Volume de messages (7j)</h3>
            <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200/60 shadow-inner">
              <button className="px-4 py-1.5 text-[10px] font-medium bg-white text-emerald-700 rounded-md shadow-sm border border-slate-200/40 uppercase tracking-widest">7 JOURS</button>
              <button className="px-4 py-1.5 text-[10px] font-medium text-slate-400 hover:text-slate-600 rounded-md transition-all uppercase tracking-widest">30 JOURS</button>
            </div>
          </div>
          <div className="h-[280px] w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData.length > 0 ? chartData : [{ name: '...', messages: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={15} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar dataKey="messages" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-900 text-lg tracking-tight mb-8">Canaux de livraison</h3>
          <div className="space-y-8">
            {[
              { label: 'Livrés', value: '100%', color: 'bg-emerald-500', icon: CheckCircle2 },
              { label: 'Lus', value: stats.openRate, color: 'bg-blue-500', icon: Smartphone },
              { label: 'Réponses', value: stats.replyRate, color: 'bg-indigo-500', icon: MessageSquare },
              { label: 'En attente', value: '0%', color: 'bg-rose-500', icon: RefreshCcw },
            ].map((item, i) => (
              <div key={i} className="space-y-2.5">
                <div className="flex justify-between items-center text-sm font-medium">
                  <div className="flex items-center gap-2.5 text-slate-400">
                    <item.icon size={14} strokeWidth={2.5} />
                    <span className="uppercase tracking-widest text-[10px]">{item.label}</span>
                  </div>
                  <span className="text-slate-900 tracking-tight font-semibold">{item.value}</span>
                </div>
                <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-200/40 shadow-inner">
                  <div className={`h-full ${item.color} shadow-sm transition-all duration-1000 ease-out`} style={{ width: item.value }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="font-semibold text-slate-900 text-lg tracking-tight">Flux de messages récents</h3>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Recherche..." className="w-full sm:w-64 pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold" />
            </div>
            <button className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl border border-slate-200 transition-all">
              <Filter size={18} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-semibold uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Destinataire / Expéditeur</th>
                <th className="px-8 py-5">Aperçu</th>
                <th className="px-8 py-5">Type</th>
                <th className="px-8 py-5">Statut</th>
                <th className="px-8 py-5 text-right">Heure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentMessages.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-10 text-center text-slate-400 text-sm font-medium">Aucun message récent</td>
                </tr>
              ) : recentMessages.map((msg, i) => (
                <tr key={msg._id} className="hover:bg-slate-50/80 transition-all cursor-pointer">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-[10px] shadow-sm ${msg.type === 'SENT' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {msg.type === 'SENT' ? 'TO' : 'FROM'}
                      </div>
                      <span className="text-sm font-semibold text-slate-800 tracking-tight">{msg.to === 'self' || !msg.to ? msg.from : msg.to}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm text-slate-500 truncate max-w-[200px] font-medium">{msg.body}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{msg.type}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-semibold uppercase tracking-widest ${
                      msg.status === 'READ' ? 'bg-blue-50 text-blue-600' : 
                      msg.status === 'REPLIED' ? 'bg-emerald-50 text-emerald-600' : 
                      'bg-slate-100 text-slate-600'
                    }`}>{msg.status}</span>
                  </td>
                  <td className="px-8 py-5 text-right text-xs font-medium text-slate-400">
                    <div className="flex items-center justify-end gap-1">
                      <Clock size={12} />
                      {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
