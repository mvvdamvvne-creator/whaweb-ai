import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Plus 
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ContactsView from './components/ContactsView';
import CampaignForm from './components/CampaignForm';
import AIConfig from './components/AIConfig';

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [whatsappStatus, setWhatsappStatus] = useState('DISCONNECTED');
  const [qrCode, setQrCode] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [contactsCount, setContactsCount] = useState(0);

  useEffect(() => {
    const fetchContactsCount = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/contacts');
        setContactsCount(res.data.length);
      } catch (err) {
        console.error("Error fetching contacts count:", err);
      }
    };

    const checkStatus = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/health');
        setWhatsappStatus(response.data.whatsapp);
        setIsOnline(true);
        
        if (response.data.whatsapp === 'QR_READY') {
          const qrRes = await axios.get('http://localhost:5000/api/whatsapp/qr');
          setQrCode(qrRes.data.qr);
        } else {
          setQrCode(null);
        }
      } catch (error) {
        setWhatsappStatus('OFFLINE');
        setIsOnline(false);
      }
    };

    fetchContactsCount();
    checkStatus();
    const interval = setInterval(() => {
      checkStatus();
      fetchContactsCount();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <Dashboard whatsappStatus={whatsappStatus} qrCode={qrCode} />;
      case 'Contacts':
        return <ContactsView onUpdate={() => {}} />;
      case 'Campaigns':
        return <CampaignForm />;
      case 'AI Config':
        return <AIConfig />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[600px] bg-white rounded-3xl border border-slate-200 border-dashed relative z-10 animate-in fade-in duration-500">
            <div className="p-12 bg-slate-50 rounded-full text-slate-200 mb-8 border border-slate-200/40 shadow-inner">
              <LayoutDashboard size={80} strokeWidth={1} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Section {activeTab}</h3>
            <p className="text-slate-400 font-medium max-w-sm text-center leading-relaxed text-sm">Nous finalisons cette interface. Elle sera disponible très prochainement.</p>
            <button 
              onClick={() => setActiveTab('Dashboard')}
              className="mt-10 px-10 py-4 bg-emerald-600 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-600/20 transform active:scale-95 transition-all uppercase tracking-widest text-[10px]"
            >
              Retour au Dashboard
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 overflow-hidden font-sans antialiased">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} contactsCount={contactsCount} />

      <main className="flex-1 overflow-y-auto p-8 scroll-smooth custom-scrollbar relative z-10">
        <header className="flex items-center justify-between mb-10 relative z-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{activeTab}</h2>
            <p className="text-slate-500 font-medium text-sm mt-0.5">
              {activeTab === 'Dashboard' ? 'Bon retour Amine. Voici vos indicateurs clés.' : `Configuration de votre espace ${activeTab.toLowerCase()}`}
            </p>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5 text-right">AUJOURD'HUI</p>
              <p className="text-sm font-medium text-slate-900 tracking-tight uppercase">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <button 
              onClick={() => setActiveTab('Campaigns')}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 transform active:scale-95"
            >
              <Plus size={18} strokeWidth={3} />
              Nouvelle campagne
            </button>
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
}

export default App;
