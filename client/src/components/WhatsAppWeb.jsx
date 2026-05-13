import React, { useState, useEffect } from 'react';
import api from '../api';
import { ExternalLink, MessageSquare, ShieldCheck, Zap, AlertCircle, RefreshCw, Loader2, Camera, Maximize2, Minimize2 } from 'lucide-react';

const WhatsAppWeb = () => {
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);

  const fetchScreenshot = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get('/whatsapp/screenshot');
      setScreenshot(res.data.screenshot);
      setError(null);
    } catch (err) {
      console.error("Error fetching screenshot:", err);
      setError("Impossible de charger la vue en direct. Assurez-vous d'être connecté.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleImageClick = async (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Scale coordinates to 1440x900 viewport
    const scaleX = 1440 / rect.width;
    const scaleY = 900 / rect.height;

    const scaledX = Math.round(x * scaleX);
    const scaledY = Math.round(y * scaleY);

    try {
      await api.post('/whatsapp/click', { x: scaledX, y: scaledY });
      // Immediately refresh after click to see the result
      setTimeout(() => fetchScreenshot(), 300);
    } catch (err) {
      console.error("Error sending click:", err);
    }
  };

  const handleKeyDown = async (e) => {
    // Prevent default browser actions for some keys when interacting with WhatsApp
    if (['Backspace', 'Enter'].includes(e.key)) {
      e.preventDefault();
    }

    // Ignore modifier keys alone
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    try {
      let text = e.key;
      // Handle special keys that Puppeteer needs to know about
      if (e.key === 'Backspace') text = 'Backspace';
      if (e.key === 'Enter') text = 'Enter';

      await api.post('/whatsapp/type', { text });
      
      // If Enter is pressed, refresh quickly to see the message sent
      if (e.key === 'Enter') {
        setTimeout(() => fetchScreenshot(), 500);
      }
    } catch (err) {
      console.error("Error sending key:", err);
    }
  };

  useEffect(() => {
    fetchScreenshot();
    const interval = setInterval(() => {
      fetchScreenshot();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col space-y-4 animate-in fade-in duration-500 ${isMaximized ? 'fixed inset-0 z-[200] bg-slate-900 p-0' : 'h-full'}`}>
      {/* Header Info - Simplified to prevent overlap */}
      {!isMaximized && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Camera className="text-emerald-600" />
              Console Interactive Totale
            </h2>
            <p className="text-slate-500 font-medium text-sm">Contrôlez tout : cliquez pour naviguer, tapez pour envoyer des messages.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchScreenshot(true)}
              disabled={refreshing}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              Actualiser
            </button>
            <a 
              href="https://web.whatsapp.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              Mode Externe
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div 
        tabIndex="0" // Make it focusable to capture keyboard events
        onKeyDown={handleKeyDown}
        className={`flex-1 bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col relative outline-none ${isMaximized ? 'rounded-none border-none' : 'rounded-[2rem] min-h-[750px]'}`}
      >
        {/* Internal Browser Bar */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-400 shadow-inner"></div>
            <div className="w-3 h-3 rounded-full bg-amber-400 shadow-inner"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-inner"></div>
          </div>
          
          <div className="flex-1 max-w-md mx-4">
            <div className="bg-white px-4 py-1.5 rounded-lg border border-slate-200 flex items-center gap-3 text-[10px] font-bold text-slate-400 tracking-widest shadow-sm">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span className="truncate">INTERACTIVE-PUPPETEER://FULL-CONTROL</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isMaximized && (
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mr-4 hidden md:block">
                ESC ou cliquez sur le bouton pour quitter le plein écran
              </span>
            )}
            <button 
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400 hover:text-slate-600"
              title={isMaximized ? "Réduire" : "Plein écran"}
            >
              {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </div>

        {/* Viewport - Zero padding to maximize size */}
        <div className="flex-1 relative bg-slate-800 flex items-center justify-center overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-4 animate-pulse">
              <Loader2 size={48} className="text-emerald-600 animate-spin" strokeWidth={1.5} />
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Initialisation...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-6 max-w-sm text-center">
              <div className="p-8 bg-rose-50 text-rose-500 rounded-full shadow-inner">
                <AlertCircle size={48} strokeWidth={1.5} />
              </div>
              <div className="space-y-2 text-center">
                <p className="text-slate-800 font-black uppercase tracking-tight">Erreur de flux</p>
                <p className="text-slate-500 text-xs font-medium leading-relaxed">{error}</p>
              </div>
              <button 
                onClick={() => fetchScreenshot(true)}
                className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest"
              >
                Réessayer
              </button>
            </div>
          ) : (
            <div className="relative group w-full h-full flex items-center justify-center">
              <img 
                src={`data:image/jpeg;base64,${screenshot}`} 
                alt="WhatsApp Web Live Screenshot" 
                onClick={handleImageClick}
                className={`max-w-full max-h-full object-contain cursor-text transition-all duration-300 ${isMaximized ? 'w-full h-full' : ''}`}
                style={{ imageRendering: 'crisp-edges' }}
              />
              
              {/* Status Overlay */}
              <div className="absolute top-4 right-4 flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">CONTROLE TOTAL</span>
              </div>

              {/* Interaction Overlay - Moved to top-left to avoid hiding content */}
              <div className="absolute top-4 left-4 px-4 py-2 bg-emerald-600/90 backdrop-blur-md rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                <p className="text-white text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <Zap size={12} />
                  Cliquez puis tapez au clavier pour envoyer
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Cards - Improved spacing */}
      {!isMaximized && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
          <div className="bg-emerald-50 rounded-[2rem] border border-emerald-100 p-6 flex items-start gap-5 group">
            <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm transition-transform group-hover:scale-110">
              <Zap size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-tight">Clavier & Souris</h4>
              <p className="text-emerald-700/70 text-[11px] font-medium mt-1 leading-relaxed">
                Sélectionnez un chat avec la souris, puis utilisez votre clavier pour écrire. Appuyez sur **Entrée** pour envoyer.
              </p>
            </div>
          </div>
          <div className="bg-slate-900 rounded-[2rem] p-6 flex items-start gap-5 text-white shadow-xl shadow-slate-900/10 group">
            <div className="p-3 bg-white/10 rounded-2xl text-emerald-400 transition-transform group-hover:scale-110">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-tight">Mode Plein Écran</h4>
              <p className="text-slate-400 text-[11px] font-medium mt-1 leading-relaxed">
                Utilisez le bouton en haut à droite pour masquer le menu et avoir une vue large. Idéal pour de longues sessions de chat.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppWeb;
