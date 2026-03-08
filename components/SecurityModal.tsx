
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { X, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SecurityModalProps {
  user: User | null;
  onClose: () => void;
  onLogout: () => void;
  onUpdatePassword: (newPass: string) => void;
}

const SecurityModal: React.FC<SecurityModalProps> = ({ user, onClose, onLogout, onUpdatePassword }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [tooltips, setTooltips] = useState<{
    old?: string;
    new?: string;
    confirm?: string;
  }>({});

  // Xóa tooltip khi người dùng nhập liệu lại
  useEffect(() => {
    if (tooltips.old) setTooltips(prev => ({ ...prev, old: undefined }));
  }, [oldPassword]);

  useEffect(() => {
    if (tooltips.new) setTooltips(prev => ({ ...prev, new: undefined }));
  }, [newPassword]);

  useEffect(() => {
    if (tooltips.confirm) setTooltips(prev => ({ ...prev, confirm: undefined }));
  }, [confirmPassword]);

  const handleSaveChanges = () => {
    let hasError = false;
    const newErrors: typeof tooltips = {};

    // Validate Old Password (Check with current user password)
    if (!oldPassword) {
      newErrors.old = "VUI LÒNG NHẬP MẬT KHẨU CŨ";
      hasError = true;
    } else if (user && oldPassword !== user.password) {
      newErrors.old = "MẬT KHẨU CŨ KHÔNG CHÍNH XÁC";
      hasError = true;
    }

    // Validate New Password
    if (newPassword.length < 6) {
      newErrors.new = "MẬT KHẨU MỚI TỐI THIỂU 6 KÝ TỰ";
      hasError = true;
    } else if (newPassword === oldPassword) {
      newErrors.new = "MẬT KHẨU MỚI PHẢI KHÁC MẬT KHẨU CŨ";
      hasError = true;
    }

    // Validate Confirm Password
    if (confirmPassword !== newPassword) {
      newErrors.confirm = "XÁC NHẬN MẬT KHẨU KHÔNG KHỚP";
      hasError = true;
    }

    if (hasError) {
      setTooltips(newErrors);
      return;
    }

    // Nếu mọi thứ hợp lệ
    onUpdatePassword(newPassword);
    setIsSuccess(true);
    
    // Đăng xuất sau 2 giây để người dùng thấy thông báo thành công
    setTimeout(() => {
      onLogout();
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-6 animate-bounce">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">Thành công!</h2>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center max-w-[200px] leading-relaxed">
          Mật khẩu đã được thay đổi. Hệ thống sẽ đăng xuất để bảo mật.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black animate-in fade-in slide-in-from-bottom-5 duration-500 flex flex-col px-6 pt-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6 mt-2">
        <h2 className="text-2xl font-black text-[#ff8c00] tracking-widest uppercase">Bảo mật</h2>
        <button 
          onClick={onClose}
          className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white active:scale-90 transition-all"
        >
          <X size={24} />
        </button>
      </div>

      <div className="space-y-4 flex-1">
        {/* Old Password */}
        <div className="space-y-1.5 relative">
          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Mật khẩu hiện tại</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
              <Lock size={18} />
            </div>
            <input 
              type="password" 
              placeholder="........"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className={`w-full bg-[#16161a] border rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white placeholder-gray-700 focus:outline-none transition-all ${
                tooltips.old ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-white/5 focus:border-[#ff8c00]/30'
              }`}
            />
          </div>
          {tooltips.old && (
            <div className="absolute -top-10 left-0 right-0 animate-in fade-in slide-in-from-bottom-2 duration-300 z-10">
              <div className="bg-red-500 text-white text-[9px] font-black py-2 px-4 rounded-xl flex items-center gap-2 shadow-2xl w-fit mx-auto relative">
                <AlertCircle size={14} />
                {tooltips.old}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rotate-45"></div>
              </div>
            </div>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-1.5 relative">
          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Mật khẩu mới</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
              <Lock size={18} />
            </div>
            <input 
              type="password" 
              placeholder="Tối thiểu 6 ký tự"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full bg-[#16161a] border rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white placeholder-gray-700 focus:outline-none transition-all ${
                tooltips.new ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-white/5 focus:border-[#ff8c00]/30'
              }`}
            />
          </div>
          {tooltips.new && (
            <div className="absolute -top-10 left-0 right-0 animate-in fade-in slide-in-from-bottom-2 duration-300 z-10">
              <div className="bg-red-500 text-white text-[9px] font-black py-2 px-4 rounded-xl flex items-center gap-2 shadow-2xl w-fit mx-auto relative">
                <AlertCircle size={14} />
                {tooltips.new}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rotate-45"></div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5 relative">
          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Xác nhận mật khẩu</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
              <Lock size={18} />
            </div>
            <input 
              type="password" 
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full bg-[#16161a] border rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white placeholder-gray-700 focus:outline-none transition-all ${
                tooltips.confirm ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-white/5 focus:border-[#ff8c00]/30'
              }`}
            />
          </div>
          {tooltips.confirm && (
            <div className="absolute -top-10 left-0 right-0 animate-in fade-in slide-in-from-bottom-2 duration-300 z-10">
              <div className="bg-red-500 text-white text-[9px] font-black py-2 px-4 rounded-xl flex items-center gap-2 shadow-2xl w-fit mx-auto relative">
                <AlertCircle size={14} />
                {tooltips.confirm}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rotate-45"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={handleSaveChanges}
        className="w-full bg-[#ff8c00] text-black font-black py-4.5 rounded-2xl text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all shadow-orange-900/20"
      >
        Lưu thay đổi
      </button>
    </div>
  );
};

export default SecurityModal;
