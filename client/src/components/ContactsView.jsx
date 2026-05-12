import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, FileDown, MoreVertical, Plus, X, Trash2, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

const ContactsView = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', tags: '' });
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const fetchContacts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/contacts');
      setContacts(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching contacts:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleAddContact = async (e) => {
    e.preventDefault();
    try {
      const tagsArray = newContact.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      await axios.post('http://localhost:5000/api/contacts', {
        ...newContact,
        tags: tagsArray
      });
      setNewContact({ name: '', phone: '', tags: '' });
      setShowModal(false);
      fetchContacts();
    } catch (err) {
      alert(err.response?.data?.message || "Error adding contact");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Map data to our format
        // Expected columns: "Nom" or "Name", "Telephone" or "Phone"
        const formattedContacts = data.map(item => ({
          name: item.Nom || item.Name || item.name || 'Sans Nom',
          phone: String(item.Telephone || item.Phone || item.phone || '').replace(/\s/g, ''),
          tags: ['Importé', new Date().toLocaleDateString()]
        })).filter(c => c.phone);

        if (formattedContacts.length === 0) {
          alert("Aucun contact valide trouvé. Assurez-vous d'avoir des colonnes 'Name' et 'Phone'.");
          setImporting(false);
          return;
        }

        const res = await axios.post('http://localhost:5000/api/contacts/bulk', {
          contacts: formattedContacts
        });

        alert(res.data.message);
        fetchContacts();
      } catch (err) {
        console.error("Import error:", err);
        alert("Erreur lors de l'importation du fichier.");
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDeleteContact = async (id) => {
    if (window.confirm("Supprimer ce contact ?")) {
      try {
        await axios.delete(`http://localhost:5000/api/contacts/${id}`);
        fetchContacts();
      } catch (err) {
        alert("Error deleting contact");
      }
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept=".xlsx, .xls, .csv" 
      />
      
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
        <div className="flex flex-col xl:flex-row gap-6 items-center justify-between">
          <div className="relative w-full xl:w-[32rem]">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher un contact..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-slate-700" 
            />
          </div>
          <div className="flex gap-4 w-full xl:w-auto">
            <button 
              onClick={() => setShowModal(true)}
              className="flex-1 xl:flex-none px-8 py-4 bg-emerald-600 text-white rounded-2xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transform active:scale-95"
            >
              <Plus size={18} />
              Ajouter
            </button>
            <button 
              onClick={() => fileInputRef.current.click()}
              disabled={importing}
              className="flex-1 xl:flex-none px-8 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-all border-dashed disabled:opacity-50"
            >
              {importing ? <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div> : <FileDown size={18} strokeWidth={2.5} />}
              Importer Excel/CSV
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-4 py-5 font-semibold">Contact</th>
                <th className="px-4 py-5 font-semibold">Téléphone</th>
                <th className="px-4 py-5 font-semibold">Tags</th>
                <th className="px-4 py-5 font-semibold">Ajouté le</th>
                <th className="px-4 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-slate-400">Chargement...</td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-slate-400">Aucun contact trouvé</td>
                </tr>
              ) : filteredContacts.map((contact) => (
                <tr key={contact._id} className="group hover:bg-slate-50/50 transition-all">
                  <td className="px-4 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center font-semibold text-[10px] text-emerald-700 border border-emerald-200/40">
                        {contact.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-slate-800 tracking-tight">{contact.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-6 text-sm font-semibold text-slate-500 tracking-tight">{contact.phone}</td>
                  <td className="px-4 py-6">
                    <div className="flex gap-2 flex-wrap">
                      {contact.tags.map((tag, j) => (
                        <span key={j} className="px-3 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-6 text-[11px] font-medium text-slate-400 uppercase tracking-tight">
                    {new Date(contact.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-4 py-6 text-right">
                    <button 
                      onClick={() => handleDeleteContact(contact._id)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajouter Contact */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Nouveau Contact</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAddContact} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Nom Complet</label>
                <input 
                  required
                  type="text" 
                  placeholder="ex: Amine Ben" 
                  value={newContact.name}
                  onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Numéro WhatsApp</label>
                <input 
                  required
                  type="text" 
                  placeholder="ex: +212612345678" 
                  value={newContact.phone}
                  onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Tags (séparés par des virgules)</label>
                <input 
                  type="text" 
                  placeholder="ex: Client, VIP, Rabat" 
                  value={newContact.tags}
                  onChange={(e) => setNewContact({...newContact, tags: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transform active:scale-95 transition-all">
                  Enregistrer le Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsView;
