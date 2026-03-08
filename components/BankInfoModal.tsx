
import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { X, Landmark, CreditCard, User as UserIcon, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BankInfoModalProps {
  user: User | null;
  onClose: () => void;
  onUpdate: (bankData: { bankName: string; bankAccountNumber: string; bankAccountHolder: string }) => void;
}

const VIETNAM_BANKS = [
  "VIETCOMBANK", "VIETINBANK", "BIDV", "AGRIBANK", "MB BANK", "TECHCOMBANK", 
  "VPBANK", "ACB", "SACOMBANK", "HDBANK", "VIB", "TPBANK", "SHB", "MSB", 
  "SEABANK", "OCB", "LIENVIETPOSTBANK", "EXIMBANK", "ABBANK", "BACA BANK", 
  "VIET CAPITAL BANK", "VIETBANK", "NAM A BANK", "PVCOMBANK", "DONG A BANK", 
  "NCB", "KIENLONG BANK", "SAIGONBANK", "PG BANK", "VIET A BANK", "WOORI BANK",
  "SHINHAN BANK", "HSBC", "STANDARD CHARTERED", "PUBLIC BANK", "CIMB", "UOB",
  "INDOVINA BANK", "VRB", "CAKE", "TIMO", "LOMO", "TNEX", "KASIKORNBANK",
  "CITIBANK", "DEUTSCHE BANK", "BANGKOK BANK", "MAYBANK", "JPMORGAN CHASE"
];

const BankInfoModal: React.FC<BankInfoModalProps> = ({ user, onClose, onUpdate }) => {
  const [bankName, setBankName] = useState(user?.bankName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(user?.bankAccountNumber || '');
  const [bankAccountHolder, setBankAccountHolder] = useState(user?.bankAccountHolder || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const normalizeName = (str: string) => {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toUpperCase()
      .trim();
  };

  const suggestions = useMemo(() => {
    if (!bankName) return [];
    return VIETNAM_BANKS.filter(b => b.startsWith(bankName.toUpperCase()) && b !== bankName.toUpperCase());
  }, [bankName]);

  const hasAccents = (str: string) => {
    const accents = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    return accents.test(str);
  };

  const isAccountHolderInvalid = hasAccents(bankAccountHolder);

  const normalizedUserFullName = useMemo(() => normalizeName(user?.fullName || ""), [user?.fullName]);
  const normalizedAccountHolder = useMemo(() => normalizeName(bankAccountHolder), [bankAccountHolder]);
  const isNameMismatched = bankAccountHolder.length > 0 && normalizedAccountHolder !== normalizedUserFullName;

  const handleSave = () => {
    if (!bankName || !bankAccountNumber || !bankAccountHolder) {
      alert("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    const normalizedUserFullName = normalizeName(user?.fullName || "");
    const normalizedAccountHolder = normalizeName(bankAccountHolder);

    if (normalizedAccountHolder !== normalizedUserFullName) {
      // Tooltip will show the error, but we also keep alert as a fallback
      return;
    }

    setShowConfirm(true);
  };

  const confirmSave = () => {
    onUpdate({ bankName, bankAccountNumber, bankAccountHolder });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-[#111111] w-full max-w-md rounded-[3rem] p-8 space-y-8 relative shadow-2xl border border-white/5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
              <Landmark size={20} />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Tài khoản nhận tiền</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2 relative">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Tên ngân hàng</label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600">
                <Landmark size={18} />
              </div>
              <input 
                type="text"
                value={bankName}
                onChange={(e) => {
                  setBankName(e.target.value.toUpperCase());
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="VD: MB BANK, VIETCOMBANK..."
                className="w-full bg-black border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white placeholder-gray-800 focus:outline-none focus:border-[#ff8c00]/30 transition-all"
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-top-2 duration-200">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setBankName(s);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-6 py-4 text-left text-xs font-black text-gray-400 hover:text-white hover:bg-white/5 transition-all border-b border-white/5 last:border-0"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Số tài khoản</label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600">
                <CreditCard size={18} />
              </div>
              <input 
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Nhập số tài khoản..."
                className="w-full bg-black border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white placeholder-gray-800 focus:outline-none focus:border-[#ff8c00]/30 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Chủ tài khoản</label>
              {isAccountHolderInvalid && (
                <div className="flex items-center gap-1 text-red-500 animate-pulse">
                  <AlertCircle size={10} />
                  <span className="text-[8px] font-black uppercase tracking-tighter">Vui lòng viết không dấu</span>
                </div>
              )}
            </div>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600">
                <UserIcon size={18} />
              </div>
              <input 
                type="text"
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value.toUpperCase())}
                placeholder="TÊN KHÔNG DẤU..."
                className={`w-full bg-black border rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white placeholder-gray-800 focus:outline-none transition-all ${isAccountHolderInvalid || isNameMismatched ? 'border-red-500/50' : 'border-white/5 focus:border-[#ff8c00]/30'}`}
              />
              {isNameMismatched && (
                <div className="absolute -top-12 left-0 right-0 z-20 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-red-600 text-white text-[9px] font-black py-2 px-4 rounded-xl flex items-center gap-2 shadow-xl relative">
                    <AlertCircle size={14} />
                    <span>TÊN TÀI KHOẢN KHÔNG HỢP LỆ</span>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rotate-45"></div>
                  </div>
                </div>
              )}
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
            <Save size={16} /> Lưu thông tin
          </button>
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirm && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#1a1a1a] w-full max-w-xs rounded-[2.5rem] p-8 space-y-6 border border-white/10 shadow-2xl text-center">
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center text-[#ff8c00] mx-auto">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-black text-white uppercase tracking-tighter">Xác nhận thông tin</h4>
              <p className="text-[10px] font-bold text-gray-500 leading-relaxed">
                Vui lòng kiểm tra kỹ số tài khoản và tên ngân hàng. Thông tin sai lệch sẽ ảnh hưởng đến việc nhận tiền giải ngân.
              </p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={confirmSave}
                className="w-full py-4 bg-[#ff8c00] text-black font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
              >
                Tôi đã kiểm tra kỹ
              </button>
              <button 
                onClick={() => setShowConfirm(false)}
                className="w-full py-4 bg-white/5 text-gray-500 font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
              >
                Quay lại sửa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankInfoModal;

