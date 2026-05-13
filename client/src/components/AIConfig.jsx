import React, { useState, useEffect } from 'react';
import api from '../api';
import { BrainCircuit, Globe, Webhook, CheckCircle2, Settings, Loader2 } from 'lucide-react';

const AIConfig = () => {
  const [config, setConfig] = useState({
    openaiKey: '',
    systemPrompt: '',
    knowledgeBase: '',
    model: 'gpt-4o',
    autoReplyEnabled: false,
    n8nWebhookUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get('/ai-config');
        setConfig(res.data);
      } catch (err) {
        console.error("Error fetching AI config:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.post('/ai-config', config);
      setMessage('Configuration enregistrée avec succès !');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error("Error saving AI config:", err);
      setMessage('Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const toggleAutoReply = () => {
    setConfig({ ...config, autoReplyEnabled: !config.autoReplyEnabled });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={40} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm space-y-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2.5 h-full bg-emerald-600"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'IA Auto-Reply', desc: 'Réponses automatiques intelligentes', active: config.autoReplyEnabled, icon: BrainCircuit, toggle: toggleAutoReply },
            { title: 'Sentiment Analysis', desc: 'Détection d\'intention client', active: true, icon: Globe },
            { title: 'Webhook n8n', desc: 'Liaison avec workflows externes', active: false, icon: Webhook },
          ].map((toggle, i) => (
            <div key={i} className="p-7 rounded-[1.5rem] bg-slate-50/50 border border-slate-200/60 flex flex-col justify-between h-48 hover:bg-white hover:shadow-xl transition-all duration-300 group">
              <div className="flex justify-between items-start">
                <div className={`p-4 rounded-xl ${toggle.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'} shadow-sm`}>
                  <toggle.icon size={26} strokeWidth={2} />
                </div>
                <div 
                  onClick={toggle.toggle}
                  className={`w-14 h-8 rounded-full relative cursor-pointer transition-all duration-300 ${toggle.active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${toggle.active ? 'right-1' : 'left-1'}`}></div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-base tracking-tight">{toggle.title}</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-1.5 uppercase tracking-wide leading-relaxed">{toggle.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.3em] ml-1">Moteur d'Intelligence Artificielle</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 'gpt-4o', name: 'GPT-4o (Omni)', provider: 'OpenAI · Optimal' },
              { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI · Rapide' },
              { id: 'llama3', name: 'Llama 3 (8B)', provider: 'Meta · Open Source' },
            ].map((model, i) => (
              <div 
                key={i} 
                onClick={() => setConfig({ ...config, model: model.id })}
                className={`p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer relative ${config.model === model.id ? 'border-emerald-500 bg-emerald-50/30 shadow-sm' : 'border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white'}`}
              >
                {config.model === model.id && <div className="absolute top-4 right-4 text-emerald-500"><CheckCircle2 size={22} strokeWidth={3} /></div>}
                <h5 className="font-medium text-slate-900 text-lg tracking-tighter">{model.name}</h5>
                <p className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-widest">{model.provider}</p>
                <div className={`mt-6 inline-flex px-4 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-widest ${config.model === model.id ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-100'}`}>                        {config.model === model.id ? 'Moteur Actif' : 'Sélectionner'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.3em] ml-1">OpenAI API Access Key</label>
          <div className="relative">
            <input 
              type="password" 
              placeholder="sk-proj-................................................" 
              value={config.openaiKey || ''}
              onChange={(e) => setConfig({ ...config, openaiKey: e.target.value })}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs shadow-inner transition-all" 
            />
            {config.openaiKey && <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-widest border border-emerald-100">Configuré</div>}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.3em] ml-1">System Prompt (Personnalité de l'IA)</label>
          <textarea 
            rows={6}
            value={config.systemPrompt || ''}
            onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
            className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-medium text-slate-800 text-sm leading-relaxed shadow-inner"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.3em] ml-1">Base de connaissances (Knowledge Base)</label>
          <textarea 
            rows={6}
            value={config.knowledgeBase || ''}
            onChange={(e) => setConfig({ ...config, knowledgeBase: e.target.value })}
            className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-medium text-slate-800 text-sm leading-relaxed border-dashed shadow-inner"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.3em] ml-1">n8n Webhook URL (Automation Flow)</label>
          <input 
            type="text" 
            placeholder="http://localhost:5678/webhook/..." 
            value={config.n8nWebhookUrl || ''}
            onChange={(e) => setConfig({ ...config, n8nWebhookUrl: e.target.value })}
            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs shadow-inner transition-all" 
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-10 border-t border-slate-100">
          {message && <span className="text-emerald-600 text-xs font-semibold uppercase tracking-widest">{message}</span>}
          <button 
            onClick={() => window.location.reload()}
            className="px-10 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-all uppercase tracking-widest text-[10px]"
          >
            Réinitialiser
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-semibold shadow-xl shadow-emerald-600/20 uppercase tracking-widest text-[10px] transform active:scale-95 transition-all flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Enregistrer la Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIConfig;
