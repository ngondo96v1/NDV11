
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

interface LoginProps {
  onLogin: (phone: string, password: string) => void;
  onNavigateRegister: () => void;
  error?: string | null;
  rememberMe: boolean;
  onToggleRememberMe: (val: boolean) => void;
  isLoadingData?: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigateRegister, error, rememberMe, onToggleRememberMe, isLoadingData }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPhoneTooltip, setShowPhoneTooltip] = useState(false);
  const [showPassTooltip, setShowPassTooltip] = useState(false);
  const [phoneErrorMsg, setPhoneErrorMsg] = useState('SỐ ZALO PHẢI ĐỦ 10 KÝ TỰ');

  // Reset tooltips when user types
  useEffect(() => {
    if (showPhoneTooltip) setShowPhoneTooltip(false);
    if (showPassTooltip) setShowPassTooltip(false);
  }, [phone, password]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    
    // Chặn nhập dư và ký tự lạ
    const val = rawVal.replace(/\D/g, '').slice(0, 10);
    setPhone(val);
  };

  const handleBlurPhone = () => {
    if (phone.length > 0 && phone.length < 10) {
      setPhoneErrorMsg('SỐ ZALO PHẢI ĐỦ 10 KÝ TỰ');
      setShowPhoneTooltip(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let hasError = false;

    // Check phone
    if (phone === '') {
      setPhoneErrorMsg('VUI LÒNG NHẬP SỐ ZALO');
      setShowPhoneTooltip(true);
      hasError = true;
    } else if (phone.length < 10) {
      setPhoneErrorMsg('SỐ ZALO PHẢI ĐỦ 10 KÝ TỰ');
      setShowPhoneTooltip(true);
      hasError = true;
    }

    // Check password
    if (password === '') {
      setShowPassTooltip(true);
      hasError = true;
    }

    if (hasError) return;
    
    onLogin(phone, password);
  };

  return (
    <div className="w-full min-h-full bg-[#0a0a0a] flex flex-col items-center px-8 pt-12">
      <div className="mb-4 flex flex-col items-center">
        <div className="w-16 h-16 bg-[#ff8c00] rounded-2xl flex items-center justify-center orange-glow mb-3">
          <div className="w-11 h-11 border-[6px] border-black rounded-full flex items-center justify-center">
             <div className="w-2 h-5.5 bg-black rotate-45 translate-x-0.5 translate-y-0.5 rounded-full"></div>
             <div className="w-2 h-2.5 bg-black -rotate-45 -translate-x-0.5 -translate-y-0.5 rounded-full"></div>
          </div>
        </div>
        <h1 className="text-xl font-black text-white tracking-tighter mb-1.5">NDV Money</h1>
        <div className="border border-[#3d2c1c] px-3 py-0.5 rounded-full bg-[#1c120a]">
          <span className="text-[8px] font-bold text-[#ff8c00] uppercase tracking-widest">
            HỆ THỐNG XÁC THỰC V1.26
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-3 mt-4">
        {/* Zalo Input */}
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
            <span className="text-[8px] font-black text-gray-600 uppercase">Zalo</span>
          </div>
          
          <input
            type="tel"
            inputMode="numeric"
            placeholder="SỐ ZALO"
            value={phone}
            onChange={handlePhoneChange}
            onBlur={handleBlurPhone}
            className={`w-full bg-[#16161a] border rounded-xl py-3.5 pl-12 pr-3.5 text-[11px] font-bold text-white placeholder-gray-600 focus:outline-none transition-all ${
              showPhoneTooltip ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/5 focus:border-orange-500/30'
            }`}
          />
          
          {/* Tooltip Phone */}
          {showPhoneTooltip && (
            <div className="absolute -top-9 left-0 right-0 animate-in fade-in slide-in-from-bottom-2 duration-300 z-10">
              <div className="bg-red-500 text-white text-[8px] font-black py-1 px-2.5 rounded-lg flex items-center gap-1.5 shadow-2xl w-fit mx-auto relative">
                <AlertCircle size={10} />
                {phoneErrorMsg}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rotate-45"></div>
              </div>
            </div>
          )}
        </div>

        {/* Password Input */}
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
            <Lock size={14} />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="MẬT KHẨU"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full bg-[#16161a] border rounded-xl py-3.5 pl-12 pr-10 text-[11px] font-bold text-white placeholder-gray-600 focus:outline-none transition-all ${
              showPassTooltip ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/5 focus:border-orange-500/30'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          {/* Tooltip Password */}
          {showPassTooltip && (
            <div className="absolute -top-9 left-0 right-0 animate-in fade-in slide-in-from-bottom-2 duration-300 z-10">
              <div className="bg-red-500 text-white text-[8px] font-black py-1 px-2.5 rounded-lg flex items-center gap-1.5 shadow-2xl w-fit mx-auto relative">
                <AlertCircle size={10} />
                VUI LÒNG NHẬP MẬT KHẨU
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rotate-45"></div>
              </div>
            </div>
          )}
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center justify-between px-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div 
              onClick={() => onToggleRememberMe(!rememberMe)}
              className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all ${
                rememberMe ? 'bg-[#ff8c00] border-[#ff8c00]' : 'bg-[#16161a] border-white/10 group-hover:border-white/20'
              }`}
            >
              {rememberMe && <Check size={12} className="text-black font-bold" />}
            </div>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-400 transition-colors">Ghi nhớ đăng nhập</span>
          </label>
        </div>

        {/* Global Error Message from System */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 flex items-center justify-center gap-2.5 animate-in fade-in duration-300">
            <AlertCircle size={14} className="text-red-500" />
            <span className="text-[8px] font-black text-red-500 uppercase tracking-widest text-center">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoadingData}
          className={`w-full bg-[#ff8c00] hover:bg-[#ffa500] text-black font-black text-sm py-3.5 rounded-xl mt-3 transition-all active:scale-95 shadow-xl shadow-orange-900/20 ${isLoadingData ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoadingData ? 'ĐANG TẢI DỮ LIỆU...' : 'ĐĂNG NHẬP'}
        </button>
      </form>

      <button
        onClick={onNavigateRegister}
        className="mt-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-orange-500 transition-colors"
      >
        Chưa có tài khoản? <span className="text-gray-400">Đăng ký ngay</span>
      </button>

      <div className="mt-auto pb-8">
        <p className="text-[8px] font-bold text-gray-800 tracking-widest uppercase">Secured by NDV Money Financial Group</p>
      </div>
    </div>
  );
};

export default Login;
