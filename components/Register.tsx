
import React, { useState, useRef } from 'react';
import { 
  User, 
  Hash, 
  MapPin, 
  Lock, 
  Users, 
  Camera, 
  Image as ImageIcon,
  ShieldCheck,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { User as UserType } from '../types';
import { compressImage } from '../utils';

interface RegisterProps {
  onBack: () => void;
  onRegister: (userData: Partial<UserType>) => Promise<void> | void;
  onClearError?: () => void;
  error?: string | null;
}

const Register: React.FC<RegisterProps> = ({ onBack, onRegister, onClearError, error }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    zaloPhone: '',
    address: '',
    password: '',
    confirmPassword: '',
    refZalo: '',
    relationship: '',
    isCommitted: false
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [tooltips, setTooltips] = useState<Record<string, boolean>>({});
  
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRefFront = useRef<HTMLInputElement>(null);
  const fileInputRefBack = useRef<HTMLInputElement>(null);

  const validateField = (name: string, value: string) => {
    if (name === 'idNumber' && value.length > 0 && value.length < 12) return true;
    if ((name === 'zaloPhone' || name === 'refZalo') && value.length > 0 && value.length < 10) return true;
    if (name === 'password' && value.length > 0 && value.length < 6) return true;
    if (name === 'confirmPassword' && value.length > 0 && value !== formData.password) return true;
    return false;
  };

  const handleBlur = (name: string) => {
    const value = (formData as any)[name];
    setTooltips(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const isFormValid = 
    formData.fullName && 
    formData.idNumber.length === 12 && 
    formData.zaloPhone.length === 10 && 
    formData.address && 
    formData.password.length >= 6 && 
    formData.password === formData.confirmPassword &&
    formData.refZalo.length === 10 &&
    formData.relationship &&
    formData.isCommitted &&
    idFront &&
    idBack;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      setShowConfirmPopup(true);
    } else {
      setTooltips({
        idNumber: formData.idNumber.length < 12,
        zaloPhone: formData.zaloPhone.length < 10,
        password: formData.password.length < 6,
        refZalo: formData.refZalo.length < 10,
        confirmPassword: formData.confirmPassword !== formData.password
      });
    }
  };

  const handleConfirmRegister = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onRegister({
        phone: formData.zaloPhone,
        fullName: formData.fullName,
        idNumber: formData.idNumber,
        address: formData.address,
        password: formData.password,
        refZalo: formData.refZalo,
        relationship: formData.relationship,
        idFront: idFront!,
        idBack: idBack!
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmPopup(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(prev => ({ ...prev, [side]: true }));
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 800, 800);
        if (side === 'front') setIdFront(compressed);
        else setIdBack(compressed);
        setUploading(prev => ({ ...prev, [side]: false }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full min-h-full bg-[#0a0a0a] flex flex-col items-center px-6 pt-6 pb-8 relative">
      <button 
        onClick={onBack}
        className="absolute top-4 right-4 w-8 h-8 bg-white/5 border border-white/5 rounded-full flex items-center justify-center text-gray-400 active:scale-90 transition-all z-50"
      >
        <X size={16} />
      </button>

      <div className="mb-3 flex flex-col items-center">
        <div className="w-14 h-14 bg-[#ff8c00] rounded-full flex items-center justify-center orange-glow mb-2.5 relative overflow-hidden">
             <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                <div className="w-8 h-8 border-[3px] border-black rounded-full flex items-center justify-center">
                    <div className="w-1 h-4 bg-black rotate-45 translate-y-0.5 translate-x-0.5 rounded-full"></div>
                    <div className="w-1 h-2 bg-black -rotate-45 -translate-y-0.5 -translate-x-0.5 rounded-full"></div>
                </div>
             </div>
        </div>
        <h1 className="text-lg font-black text-white tracking-widest mb-1">NDV Money</h1>
        <div className="border border-[#3d2c1c] px-3 py-0.5 rounded-full bg-[#1c120a]">
          <span className="text-[7px] font-bold text-[#ff8c00] uppercase tracking-widest">
            Master Authentication V1.26
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="text-red-500 shrink-0" size={16} />
            <p className="text-red-500 text-[10px] font-bold uppercase tracking-tight">{error}</p>
          </div>
        )}
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
            <User size={16} />
          </div>
          <input
            type="text"
            placeholder="HỌ VÀ TÊN (IN HOA)"
            className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3.5 pl-10 pr-3.5 text-[11px] font-bold text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
            value={formData.fullName}
            onChange={(e) => {
              setFormData({...formData, fullName: e.target.value.toUpperCase()});
              if (error) onClearError?.();
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
              <Hash size={14} />
            </div>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="CCCD (12 SỐ)"
              className={`w-full bg-[#16161a] border rounded-xl py-3.5 pl-9 pr-3.5 text-[11px] font-bold text-white placeholder-gray-600 focus:outline-none transition-all ${tooltips.idNumber ? 'border-red-500' : 'border-white/5 focus:border-orange-500/30'}`}
              value={formData.idNumber}
              onBlur={() => handleBlur('idNumber')}
              onChange={(e) => {
                setFormData({...formData, idNumber: e.target.value.replace(/\D/g, '').slice(0, 12)});
                if (error) onClearError?.();
              }}
            />
            {tooltips.idNumber && (
              <div className="absolute -top-7 left-0 right-0 z-20">
                <div className="bg-red-500 text-white text-[7px] font-black py-0.5 px-2 rounded flex items-center gap-1 w-fit mx-auto relative shadow-lg">
                  <AlertCircle size={8} /> CẦN ĐỦ 12 SỐ
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rotate-45"></div>
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[8px] font-black text-gray-600 uppercase">
              Zalo
            </div>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="SỐ CÁ NHÂN"
              className={`w-full bg-[#16161a] border rounded-xl py-3.5 pl-12 pr-3.5 text-[11px] font-bold text-white placeholder-gray-600 focus:outline-none transition-all ${tooltips.zaloPhone ? 'border-red-500' : 'border-white/5 focus:border-orange-500/30'}`}
              value={formData.zaloPhone}
              onBlur={() => handleBlur('zaloPhone')}
              onChange={(e) => {
                setFormData({...formData, zaloPhone: e.target.value.replace(/\D/g, '').slice(0, 10)});
                if (error) onClearError?.();
              }}
            />
            {tooltips.zaloPhone && (
              <div className="absolute -top-7 left-0 right-0 z-20">
                <div className="bg-red-500 text-white text-[7px] font-black py-0.5 px-2 rounded flex items-center gap-1 w-fit mx-auto relative shadow-lg">
                  <AlertCircle size={8} /> CẦN ĐỦ 10 SỐ
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rotate-45"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
            <MapPin size={16} />
          </div>
          <input
            type="text"
            placeholder="ĐỊA CHỈ THƯỜNG TRÚ"
            className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3.5 pl-10 pr-3.5 text-[11px] font-bold text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
            value={formData.address}
            onChange={(e) => {
              setFormData({...formData, address: e.target.value});
              if (error) onClearError?.();
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
              <Lock size={14} />
            </div>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="MẬT KHẨU"
              className={`w-full bg-[#16161a] border rounded-xl py-3.5 pl-9 pr-9 text-[11px] font-bold text-white placeholder-gray-600 focus:outline-none transition-all ${tooltips.password ? 'border-red-500' : 'border-white/5 focus:border-orange-500/30'}`}
              value={formData.password}
              onBlur={() => handleBlur('password')}
              onChange={(e) => {
                setFormData({...formData, password: e.target.value});
                if (error) onClearError?.();
              }}
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600">
              {showPass ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
            {tooltips.password && (
              <div className="absolute -top-7 left-0 right-0 z-20">
                <div className="bg-red-500 text-white text-[7px] font-black py-0.5 px-2 rounded flex items-center gap-1 w-fit mx-auto relative shadow-lg">
                  <AlertCircle size={8} /> TỐI THIỂU 6 KÝ TỰ
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rotate-45"></div>
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <input
              type={showConfirmPass ? 'text' : 'password'}
              placeholder="XÁC NHẬN"
              className={`w-full bg-[#16161a] border rounded-xl py-3.5 px-9 text-[11px] font-bold text-white placeholder-gray-600 focus:outline-none transition-all ${tooltips.confirmPassword ? 'border-red-500' : 'border-white/5 focus:border-orange-500/30'}`}
              value={formData.confirmPassword}
              onBlur={() => handleBlur('confirmPassword')}
              onChange={(e) => {
                setFormData({...formData, confirmPassword: e.target.value});
                if (error) onClearError?.();
              }}
            />
            <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600">
              {showConfirmPass ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
            {tooltips.confirmPassword && (
              <div className="absolute -top-7 left-0 right-0 z-20">
                <div className="bg-red-500 text-white text-[7px] font-black py-0.5 px-2 rounded flex items-center gap-1 w-fit mx-auto relative shadow-lg">
                  <AlertCircle size={8} /> MẬT KHẨU KHÔNG KHỚP
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rotate-45"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[8px] font-black text-gray-600 uppercase flex items-center gap-0.5">
              Ref <span className="opacity-50">?</span>
            </div>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="ZALO THAM CHIẾU"
              className={`w-full bg-[#16161a] border rounded-xl py-3.5 pl-14 pr-3.5 text-[11px] font-bold text-white placeholder-gray-600 focus:outline-none transition-all ${tooltips.refZalo ? 'border-red-500' : 'border-white/5 focus:border-orange-500/30'}`}
              value={formData.refZalo}
              onBlur={() => handleBlur('refZalo')}
              onChange={(e) => {
                setFormData({...formData, refZalo: e.target.value.replace(/\D/g, '').slice(0, 10)});
                if (error) onClearError?.();
              }}
            />
            {tooltips.refZalo && (
              <div className="absolute -top-7 left-0 right-0 z-20">
                <div className="bg-red-500 text-white text-[7px] font-black py-0.5 px-2 rounded flex items-center gap-1 w-fit mx-auto relative shadow-lg">
                  <AlertCircle size={8} /> CẦN ĐỦ 10 SỐ
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rotate-45"></div>
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              <Users size={14} />
            </div>
            <select
              className="w-full bg-[#16161a] border border-white/5 rounded-xl py-3.5 px-3.5 text-[11px] font-bold text-white appearance-none focus:outline-none focus:border-orange-500/30"
              value={formData.relationship}
              onChange={(e) => {
                setFormData({...formData, relationship: e.target.value});
                if (error) onClearError?.();
              }}
            >
              <option value="" disabled className="bg-black">MỐI QUAN HỆ</option>
              <option value="Vợ/Chồng" className="bg-black">Vợ/Chồng</option>
              <option value="Anh/Chị/Em" className="bg-black">Anh/Chị/Em</option>
              <option value="Bố/Mẹ" className="bg-black">Bố/Mẹ</option>
              <option value="Đồng Nghiệp" className="bg-black">Đồng Nghiệp</option>
            </select>
          </div>
        </div>

        <div className="mt-4 bg-[#16161a]/30 border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#ff8c00]">
              <Camera size={12} />
              <span className="text-[9px] font-black uppercase tracking-tighter">Xác thực CCCD (Nén thông minh)</span>
            </div>
            <span className="text-[7px] font-bold text-gray-600 uppercase tracking-widest">Optimized KYC</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {['front', 'back'].map((side) => (
              <div 
                key={side}
                onClick={() => (side === 'front' ? fileInputRefFront : fileInputRefBack).current?.click()}
                className={`aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all overflow-hidden relative ${
                  (side === 'front' ? idFront : idBack) ? 'border-green-500/50 bg-green-500/5' : 'border-[#332a1e] bg-[#1a1a1e]'
                }`}
              >
                <input 
                  type="file" 
                  hidden 
                  ref={side === 'front' ? fileInputRefFront : fileInputRefBack} 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, side as 'front' | 'back')} 
                />
                {(side === 'front' ? idFront : idBack) ? (
                  <>
                    <img src={side === 'front' ? idFront! : idBack!} className="w-full h-full object-cover opacity-60" alt={side} />
                    <div className="absolute inset-0 bg-green-500/10 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                      <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg mb-1">
                        <CheckCircle2 size={14} color="black" />
                      </div>
                      <span className="text-[7px] font-black text-white uppercase tracking-widest">OK (Đã nén)</span>
                    </div>
                  </>
                ) : uploading[side] ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-5 h-5 border-2 border-[#ff8c00] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[7px] font-black text-gray-600 uppercase">Đang nén...</span>
                  </div>
                ) : (
                  <>
                    {side === 'front' ? <Camera size={18} className="text-[#ff8c00]" /> : <ImageIcon size={18} className="text-gray-600" />}
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Mặt {side === 'front' ? 'trước' : 'sau'}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 px-1.5">
          <button 
            type="button"
            onClick={() => setFormData({...formData, isCommitted: !formData.isCommitted})}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.isCommitted ? 'bg-[#ff8c00] border-[#ff8c00]' : 'border-gray-800 bg-transparent'}`}
          >
            {formData.isCommitted && <CheckCircle2 size={14} color="black" />}
          </button>
          <span className="text-[8px] font-bold text-gray-500 leading-tight uppercase tracking-tighter">
            Tôi cam kết thông tin cá nhân và ảnh CCCD là chính xác.
          </span>
        </div>

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-3.5 rounded-xl font-black text-[11px] tracking-[0.2em] transition-all mt-3 shadow-xl ${
              isFormValid && !isSubmitting
                ? 'bg-[#ff8c00] text-black shadow-orange-950/20 active:scale-95' 
                : 'bg-[#1a1a1e] text-gray-700 cursor-not-allowed opacity-50'
            }`}
          >
            {isSubmitting ? 'ĐANG XỬ LÝ...' : (isFormValid ? 'ĐĂNG KÝ NGAY' : 'CẦN ĐỦ THÔNG TIN')}
          </button>
      </form>

      <button
        onClick={onBack}
        className="mt-8 text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:text-orange-500 transition-colors"
      >
        Đã có tài khoản? <span className="text-gray-400">Đăng Nhập</span>
      </button>

      {/* Confirmation Popup */}
      {showConfirmPopup && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#1a1a1a] w-full max-w-xs rounded-2xl p-6 space-y-5 border border-white/10 shadow-2xl text-center">
            <div className="w-14 h-14 bg-orange-500/10 rounded-full flex items-center justify-center text-[#ff8c00] mx-auto">
              <ShieldCheck size={28} />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-base font-black text-white uppercase tracking-tighter">Xác nhận thông tin</h4>
              <p className="text-[9px] font-bold text-gray-500 leading-relaxed">
                Họ và tên người dùng <span className="text-white">BẮT BUỘC</span> phải trùng khớp với <span className="text-[#ff8c00]">CCCD</span> và <span className="text-[#ff8c00]">THẺ NGÂN HÀNG</span>. 
                Mọi sai sót sẽ dẫn đến việc không thể giải ngân.
              </p>
            </div>
            <div className="space-y-2.5">
              <button 
                onClick={handleConfirmRegister}
                disabled={isSubmitting}
                className={`w-full py-3.5 bg-[#ff8c00] text-black font-black text-[9px] uppercase tracking-widest rounded-xl active:scale-95 transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'ĐANG XỬ LÝ...' : 'Tôi đã hiểu và đồng ý'}
              </button>
              <button 
                onClick={() => setShowConfirmPopup(false)}
                className="w-full py-3.5 bg-white/5 text-gray-500 font-black text-[9px] uppercase tracking-widest rounded-xl active:scale-95 transition-all"
              >
                Kiểm tra lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
