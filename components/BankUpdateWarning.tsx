
import React from 'react';
import { AlertCircle, Landmark, ChevronRight } from 'lucide-react';

interface BankUpdateWarningProps {
  onUpdate: () => void;
}

const BankUpdateWarning: React.FC<BankUpdateWarningProps> = ({ onUpdate }) => {
  return (
    <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[#111111] w-full max-w-xs rounded-[2.5rem] p-8 space-y-6 border border-white/10 shadow-2xl text-center">
        <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center text-[#ff8c00] mx-auto relative">
          <Landmark size={40} />
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center border-4 border-[#111111]">
            <AlertCircle size={12} className="text-white" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="text-xl font-black text-white uppercase tracking-tighter">Yêu cầu cập nhật</h4>
          <p className="text-[11px] font-bold text-gray-500 leading-relaxed uppercase tracking-tight">
            Vui lòng cập nhật thông tin <span className="text-[#ff8c00]">tài khoản ngân hàng</span> để kích hoạt tính năng vay vốn và nâng hạn mức.
          </p>
        </div>

        <button 
          onClick={onUpdate}
          className="w-full py-5 bg-[#ff8c00] text-black font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-950/20"
        >
          Cập nhật ngay <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default BankUpdateWarning;
