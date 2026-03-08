
import React, { useState } from 'react';
import { User } from '../types';
import { X, User as UserIcon, Hash, MapPin, Users, Phone, Save } from 'lucide-react';

interface PersonalInfoModalProps {
  user: User | null;
  onClose: () => void;
  onUpdate: (userData: Partial<User>) => void;
}

const PersonalInfoModal: React.FC<PersonalInfoModalProps> = ({ user, onClose, onUpdate }) => {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [idNumber, setIdNumber] = useState(user?.idNumber || '');
  const [address, setAddress] = useState(user?.address || '');
  const [refZalo, setRefZalo] = useState(user?.refZalo || '');
  const [relationship, setRelationship] = useState(user?.relationship || '');

  const handleSave = () => {
    if (!fullName || !idNumber || !address || !refZalo || !relationship) {
      alert("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    onUpdate({ fullName, idNumber, address, refZalo, relationship });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-[#111111] w-full max-w-md rounded-[3rem] p-8 space-y-8 relative shadow-2xl border border-white/5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-[#ff8c00]">
              <UserIcon size={20} />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Thông tin cá nhân</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Họ và tên</label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600">
                <UserIcon size={18} />
              </div>
              <input 
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value.toUpperCase())}
                placeholder="HỌ VÀ TÊN..."
                className="w-full bg-black border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white placeholder-gray-800 focus:outline-none focus:border-[#ff8c00]/30 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Số CCCD</label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600">
                <Hash size={18} />
              </div>
              <input 
                type="text"
                inputMode="numeric"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Số căn cước công dân..."
                className="w-full bg-black border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white placeholder-gray-800 focus:outline-none focus:border-[#ff8c00]/30 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Địa chỉ thường trú</label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600">
                <MapPin size={18} />
              </div>
              <input 
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Địa chỉ hiện tại..."
                className="w-full bg-black border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white placeholder-gray-800 focus:outline-none focus:border-[#ff8c00]/30 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Số Zalo người thân</label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600">
                <Phone size={18} />
              </div>
              <input 
                type="text"
                inputMode="numeric"
                value={refZalo}
                onChange={(e) => setRefZalo(e.target.value.replace(/\D/g, ''))}
                placeholder="Số điện thoại người thân..."
                className="w-full bg-black border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white placeholder-gray-800 focus:outline-none focus:border-[#ff8c00]/30 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Mối quan hệ</label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600">
                <Users size={18} />
              </div>
              <input 
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="VD: Bố, Mẹ, Anh, Chị..."
                className="w-full bg-black border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white placeholder-gray-800 focus:outline-none focus:border-[#ff8c00]/30 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-5 bg-white/5 border border-white/10 rounded-[2rem] text-gray-500 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={handleSave}
            className="flex-[1.5] py-5 bg-[#ff8c00] rounded-[2rem] text-black font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-orange-950/20 flex items-center justify-center gap-2"
          >
            <Save size={16} /> Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoModal;
