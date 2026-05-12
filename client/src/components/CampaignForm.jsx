import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronDown, Send, Loader2, CheckCircle2 } from 'lucide-react';

const CampaignForm = () => {
  const [tags, setTags] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState('Tous les contacts');
  const [message, setMessage] = useState("Salam ! Profite de notre offre exclusive Ramadan : -30% sur tout le catalogue. Valable jusqu'au 15 mai. Réponds \"OUI\" pour recevoir le lien. 🌙");
  const [projectName, setProjectName] = useState('Vente Flash Ramadan');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/contacts/tags');
        setTags(res.data);
      } catch (err) {
        console.error("Error fetching tags:", err);
      }
    };
    fetchTags();
  }, []);

  const handleSendCampaign = async () => {
    if (!message.trim()) return alert("Le message ne peut pas être vide");
    
    setLoading(true);
    setStatus(null);
    try {
      const res = await axios.post('http://localhost:5000/api/campaigns/send', {
        segment: selectedSegment,
        message: message
      });
      setStatus('success');
      alert(`Campagne terminée ! \nEnvoyés : ${res.data.sent}\nÉchecs : ${res.data.failed}`);
    } catch (err) {
      console.error("Error sending campaign:", err);
      setStatus('error');
      alert(err.response?.data?.message || "Erreur lors de l'envoi de la campagne");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm space-y-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-2.5 h-full bg-emerald-600"></div>
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight ml-2">Diffuser une nouvelle campagne</h3>
        {status === 'success' && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 animate-in fade-in zoom-in">
            <CheckCircle2 size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Envoyé avec succès</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ml-2">
        <div className="space-y-3">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] ml-1">Nom du projet</label>
          <input 
            type="text" 
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-slate-800 shadow-inner" 
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] ml-1">Segments destinataires</label>
          <div className="relative">
            <select 
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none font-medium text-slate-800 cursor-pointer shadow-inner"
            >
              <option value="Tous les contacts">Tous les contacts</option>
              {tags.map((tag, i) => (
                <option key={i} value={tag}>{tag}</option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" strokeWidth={3} />
          </div>
        </div>
      </div>

      <div className="space-y-3 ml-2">
        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] ml-1">Message personnalisé</label>
        <div className="relative">
          <textarea 
            rows={5}
            className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-medium text-slate-800 text-base leading-relaxed shadow-inner"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="absolute bottom-4 right-6 text-[9px] font-semibold text-slate-300 uppercase tracking-[0.2em] bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">
            {message.length} caractères
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
        <button className="px-10 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]">
          Planifier
        </button>
        <button 
          onClick={handleSendCampaign}
          disabled={loading}
          className={`px-12 py-4 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 transform active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send size={18} strokeWidth={3} />
              Démarrer l'envoi
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CampaignForm;
