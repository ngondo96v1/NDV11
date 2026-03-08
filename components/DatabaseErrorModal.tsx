import React from 'react';
import { AlertCircle, RefreshCw, X, Database, ServerCrash } from 'lucide-react';

interface DatabaseErrorModalProps {
  error: string;
  onRetry: () => void;
  onClose: () => void;
}

const DatabaseErrorModal: React.FC<DatabaseErrorModalProps> = ({ error, onRetry, onClose }) => {
  return (
    <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[#111111] border border-red-500/30 w-full max-w-sm rounded-[2.5rem] p-8 space-y-8 relative shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-600/5 rounded-full blur-3xl"></div>
        
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-red-400 to-red-600"></div>
        
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 rotate-12 animate-pulse">
              <ServerCrash size={40} />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white border-4 border-[#111111]">
              <AlertCircle size={16} />
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">LỖI KẾT NỐI HỆ THỐNG</h3>
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 opacity-60">Chi tiết lỗi chính xác:</p>
              <p className="text-xs font-bold text-gray-300 leading-relaxed break-words font-mono">
                {error}
              </p>
            </div>
          </div>

          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed px-4">
            Hệ thống không thể kết nối tới cơ sở dữ liệu Supabase. Vui lòng kiểm tra lại cấu hình API hoặc trạng thái server.
          </p>
        </div>

        <div className="flex flex-col gap-3">
           <button 
             onClick={onRetry}
             className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-red-900/20"
           >
             <RefreshCw size={14} className="animate-spin-slow" /> THỬ KẾT NỐI LẠI
           </button>
           <button 
             onClick={onClose}
             className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
           >
             <X size={14} /> ĐÓNG THÔNG BÁO
           </button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseErrorModal;
