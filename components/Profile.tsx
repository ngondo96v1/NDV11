
import React, { useState } from 'react';
import { User } from '../types';
import { 
  User as UserIcon, 
  Phone, 
  Hash, 
  Lock, 
  FileText, 
  Headphones, 
  ChevronRight, 
  LogOut,
  ShieldCheck,
  X,
  Landmark,
  CreditCard,
  Pencil
} from 'lucide-react';
import SecurityModal from './SecurityModal';
import TermsModal from './TermsModal';
import BankInfoModal from './BankInfoModal';
import EditProfileModal from './EditProfileModal';

interface ProfileProps {
  user: User | null;
  onBack: () => void;
  onLogout: () => void;
  onUpdateBank?: (bankData: { bankName: string; bankAccountNumber: string; bankAccountHolder: string }) => void;
  onUpdateProfile?: (userData: Partial<User>) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onBack, onLogout, onUpdateBank, onUpdateProfile }) => {
  const [showSecurity, setShowSecurity] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showBankInfo, setShowBankInfo] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const getRankName = (rank?: string) => {
    switch(rank) {
      case 'standard': return 'Thành viên Tiêu chuẩn';
      case 'bronze': return 'Thành viên hạng Đồng';
      case 'silver': return 'Thành viên hạng Bạc';
      case 'gold': return 'Thành viên hạng Vàng';
      case 'diamond': return 'Thành viên hạng Kim cương';
      default: return 'Thành viên Tiêu chuẩn';
    }
  };

  const handleSupportClick = () => {
    window.open('https://zalo.me/g/escncv086', '_blank');
  };

  return (
    <div className="w-full bg-black px-5 space-y-6 animate-in fade-in duration-500">
      {/* Header Logo for Profile View with X Button */}
      <div className="w-full py-3 flex items-center justify-between bg-black z-50">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={onBack}
            className="w-8 h-8 bg-[#111111] border border-white/5 rounded-full flex items-center justify-center text-white active:scale-90 transition-all"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-[#ff8c00] rounded-lg flex items-center justify-center font-black text-black text-[9px]">NDV</div>
            <h1 className="text-base font-black text-white tracking-widest uppercase">Money</h1>
          </div>
        </div>
        <button onClick={onLogout} className="text-gray-500 hover:text-white transition-colors">
          <LogOut size={18} />
        </button>
      </div>

      {/* Avatar Section */}
      <div className="flex flex-col items-center space-y-2.5 pt-1">
        <div className="relative">
          <div className="w-20 h-20 bg-[#ff8c00] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,140,0,0.2)]">
            <UserIcon size={32} className="text-black" />
          </div>
          <button 
            onClick={() => setShowEditProfile(true)}
            className="absolute -top-0.5 -right-0.5 w-8 h-8 bg-[#111111] border border-white/10 rounded-full flex items-center justify-center text-[#ff8c00] shadow-xl active:scale-90 transition-all"
          >
            <Pencil size={14} />
          </button>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-black text-white tracking-tighter uppercase">{user?.fullName || 'CHƯA CẬP NHẬT'}</h2>
          <div className="bg-[#111111] px-4 py-0.5 rounded-full border border-white/5">
            <span className="text-[7px] font-black text-gray-500 uppercase tracking-[0.2em]">{getRankName(user?.rank)}</span>
          </div>
          <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-0.5">ID: {user?.id}</p>
        </div>
      </div>

      {/* Menu List */}
      <div className="space-y-2 pt-1">
        <button 
          onClick={() => setShowBankInfo(true)}
          className="w-full bg-[#111111] border border-white/5 rounded-xl p-4 flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500">
              <Landmark size={16} />
            </div>
            <div className="text-left">
              <span className="text-[10px] font-black text-white uppercase tracking-widest block">Tài khoản ngân hàng</span>
              <p className="text-[7px] font-bold text-gray-500 uppercase mt-0.5">
                {user?.bankName ? `${user.bankName} - ${user.bankAccountNumber}` : 'Chưa cập nhật tài khoản nhận tiền'}
              </p>
            </div>
          </div>
          <ChevronRight size={14} className="text-gray-700 group-hover:text-white" />
        </button>

        <button 
          onClick={() => setShowSecurity(true)}
          className="w-full bg-[#111111] border border-white/5 rounded-xl p-4 flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
              <Lock size={16} />
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Bảo mật mật khẩu</span>
          </div>
          <ChevronRight size={14} className="text-gray-700 group-hover:text-white" />
        </button>

        <button 
          onClick={() => setShowTerms(true)}
          className="w-full bg-[#111111] border border-white/5 rounded-xl p-4 flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 bg-orange-500/10 rounded-xl flex items-center justify-center text-[#ff8c00]">
              <FileText size={16} />
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Điều khoản sử dụng</span>
          </div>
          <ChevronRight size={14} className="text-gray-700 group-hover:text-white" />
        </button>

        <button 
          onClick={handleSupportClick}
          className="w-full bg-[#111111] border border-white/5 rounded-xl p-4 flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
              <Headphones size={16} />
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Hỗ trợ khách hàng 24/7</span>
          </div>
          <ChevronRight size={14} className="text-gray-700 group-hover:text-white" />
        </button>
      </div>

      {showSecurity && (
        <SecurityModal 
          user={user}
          onClose={() => setShowSecurity(false)} 
          onLogout={onLogout} 
          onUpdatePassword={(newPass) => onUpdateProfile?.({ password: newPass })}
        />
      )}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      {showBankInfo && (
        <BankInfoModal 
          user={user} 
          onClose={() => setShowBankInfo(false)} 
          onUpdate={(data) => onUpdateBank?.(data)} 
        />
      )}
      {showEditProfile && (
        <EditProfileModal 
          user={user} 
          onClose={() => setShowEditProfile(false)} 
          onUpdate={(data) => onUpdateProfile?.(data)} 
        />
      )}
    </div>
  );
};

export default Profile;
