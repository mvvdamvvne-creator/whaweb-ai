import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Camera, Loader2, CheckCircle2, Shield, Save, AlertTriangle, X } from 'lucide-react';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    fullName: user?.fullName || ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        fullName: user.fullName || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.put('/user/profile', formData);
      updateUser(res.data.user);
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Une erreur est survenue' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('profilePicture', file);

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.post('/user/profile/picture', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser({ profilePicture: res.data.profilePicture });
      setMessage({ type: 'success', text: 'Photo de profil mise à jour !' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur lors de l\'envoi' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'SUPPRIMER') return;
    
    setDeleting(true);
    try {
      await api.delete('/user/profile');
      logout();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
      setDeleting(false);
    }
  };

  const profileImageUrl = user?.profilePicture 
    ? `http://localhost:5000${user.profilePicture}` 
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 relative z-10">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        {/* Header/Cover */}
        <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-600 relative">
          <div className="absolute -bottom-12 left-10">
            <div className="relative group">
              <div className="w-32 h-32 rounded-3xl bg-white p-1.5 shadow-xl border border-slate-100">
                <div className="w-full h-full rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center relative">
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="text-slate-300" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 size={24} className="text-white animate-spin" />
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-2 -right-2 p-2.5 bg-white text-emerald-600 rounded-xl shadow-lg border border-slate-100 hover:scale-110 transition-transform active:scale-95 cursor-pointer"
              >
                <Camera size={18} strokeWidth={2.5} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
          </div>
        </div>

        <div className="pt-16 pb-10 px-10">
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{user?.fullName || user?.username}</h3>
            <p className="text-slate-500 font-medium text-sm">Gérez vos informations personnelles et votre compte</p>
          </div>

          {message.text && (
            <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <Shield size={18} />}
              <span className="text-xs font-bold uppercase tracking-widest">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Nom complet</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <User size={18} strokeWidth={2.5} />
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-500/50 transition-all outline-none shadow-inner"
                  placeholder="nouveau nom"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Nom d'utilisateur</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Shield size={18} strokeWidth={2.5} />
                </div>
                <input
                  type="text"
                  required
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-500/50 transition-all outline-none shadow-inner"
                  placeholder="nouveau username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Adresse Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Mail size={18} strokeWidth={2.5} />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-500/50 transition-all outline-none shadow-inner"
                  placeholder="email@exemple.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="md:col-span-2 pt-6 border-t border-slate-50 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-2xl font-bold text-xs shadow-xl shadow-emerald-600/20 transition-all transform active:scale-95 flex items-center gap-3 uppercase tracking-widest cursor-pointer"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} strokeWidth={3} />}
                Enregistrer les modifications
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-rose-50 rounded-[2.5rem] border border-rose-100 p-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h4 className="text-lg font-bold text-rose-900 tracking-tight">Zone de danger</h4>
          <p className="text-rose-600/70 text-sm font-medium">La suppression de votre compte est irréversible.</p>
        </div>
        <button 
          onClick={() => setShowDeleteModal(true)}
          className="px-8 py-4 bg-white text-rose-600 border border-rose-200 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm cursor-pointer"
        >
          Supprimer le compte
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-50 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                  <AlertTriangle size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Supprimer le compte ?</h3>
                  <p className="text-slate-400 text-xs font-medium">Action irréversible et immédiate</p>
                </div>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="p-5 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-3">
                <p className="text-rose-900 text-xs font-bold uppercase tracking-widest">Attention :</p>
                <ul className="text-rose-700/80 text-[11px] font-medium space-y-1.5 list-disc ml-4">
                  <li>Tous vos contacts seront définitivement effacés</li>
                  <li>Vos historiques de messages seront supprimés</li>
                  <li>Votre configuration IA sera perdue</li>
                  <li>La session WhatsApp sera déconnectée</li>
                </ul>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tapez <span className="text-rose-600">SUPPRIMER</span> pour confirmer</label>
                <input 
                  type="text" 
                  placeholder="SUPPRIMER" 
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 font-bold text-slate-900  tracking-widest transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'SUPPRIMER' || deleting}
                  className="flex-[1.5] py-4 bg-rose-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : 'Confirmer la suppression'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
