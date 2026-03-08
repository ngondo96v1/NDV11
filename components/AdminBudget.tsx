
import React, { useState, useEffect } from 'react';
import { TrendingUp, Wallet, AlertTriangle, ChevronLeft, Save, X, Check } from 'lucide-react';

interface AdminBudgetProps {
  currentBudget: number;
  onUpdate: (amount: number) => void;
  onBack: () => void;
}

const AdminBudget: React.FC<AdminBudgetProps> = ({ currentBudget, onUpdate, onBack }) => {
  const [inputValue, setInputValue] = useState(currentBudget.toLocaleString('vi-VN'));
  const [numericValue, setNumericValue] = useState(currentBudget);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setInputValue(currentBudget.toLocaleString('vi-VN'));
    setNumericValue(currentBudget);
  }, [currentBudget]);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const num = Number(rawVal);
    setNumericValue(num);
    const formatted = new Intl.NumberFormat('vi-VN').format(num);
    setInputValue(formatted);
  };

  const handleUpdateClick = () => {
    setShowConfirm(true);
  };

  const confirmUpdate = () => {
    onUpdate(numericValue);
    setShowConfirm(false);
    alert("Ngân sách hệ thống đã được cập nhật thành công.");
  };

  const isLowBudget = numericValue <= 2000000;

  return (
    <div className="w-full bg-black px-5 pb-10 animate-in fade-in duration-500 relative">
      <div className="flex items-center gap-3 pt-8 mb-6">
        <button 
          onClick={onBack}
          className="w-8 h-8 bg-[#111111] border border-white/5 rounded-full flex items-center justify-center text-white active:scale-90 transition-all"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
          CẤU HÌNH NGÂN SÁCH
        </h1>
      </div>

      <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 space-y-6 mb-6">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="text-[#ff8c00]" size={18} />
          <h4 className="text-[9px] font-black text-white uppercase tracking-widest">Thay đổi tổng nguồn vốn</h4>
        </div>

        <div className="space-y-3">
           <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest pl-1">Nhập số tiền mới (VND)</p>
           
           <div className={`bg-black border rounded-2xl p-5 flex items-center justify-between group transition-all ${isLowBudget ? 'border-red-500 ring-2 ring-red-500/20' : 'border-white/5'}`}>
              <input 
                type="text" 
                value={inputValue}
                onChange={handleBudgetChange}
                className={`bg-transparent text-2xl font-black tracking-tighter focus:outline-none w-full text-center ${isLowBudget ? 'text-red-500' : 'text-[#ff8c00]'}`}
              />
              <span className="text-gray-700 font-black text-[10px] tracking-widest uppercase ml-2">VND</span>
           </div>
           
           {isLowBudget && (
             <div className="flex items-center justify-center gap-1.5 text-red-500 animate-pulse">
                <AlertTriangle size={12} />
                <p className="text-[9px] font-black uppercase tracking-tighter">Cảnh báo: Ngân sách đang ở mức thấp (≤ 2tr)</p>
             </div>
           )}
        </div>

        <div className="space-y-1.5 text-center pt-3 border-t border-white/5">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Vốn khả dụng hiện tại</p>
          <h2 className="text-xl font-black text-white tracking-tighter leading-none">{currentBudget.toLocaleString()} đ</h2>
        </div>

        <button 
          onClick={handleUpdateClick}
          className="w-full bg-[#ff8c00] text-black font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-orange-950/40 active:scale-95 transition-all flex items-center justify-center gap-2.5"
        >
          <Save size={16} />
          CẬP NHẬT NGÂN SÁCH
        </button>
      </div>

      {/* Popup xác nhận cập nhật ngân sách */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-5 animate-in fade-in duration-300">
          <div className="bg-[#111111] border border-white/10 w-full max-w-sm rounded-3xl p-6 space-y-6 relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#ff8c00]"></div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 bg-[#ff8c00]/10 rounded-full flex items-center justify-center text-[#ff8c00]">
                 <AlertTriangle size={28} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">XÁC NHẬN THAY ĐỔI</h3>
                <p className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed px-3">
                  Bạn có chắc chắn muốn thay đổi ngân sách hệ thống thành <span className="text-white font-black">{numericValue.toLocaleString()} đ</span>?
                </p>
              </div>
            </div>

            <div className="flex gap-2.5">
               <button 
                 onClick={() => setShowConfirm(false)}
                 className="flex-1 py-3.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-gray-500 uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 <X size={12} /> HỦY BỎ
               </button>
               <button 
                 onClick={confirmUpdate}
                 className="flex-1 py-3.5 bg-[#ff8c00] rounded-xl text-[9px] font-black text-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20"
               >
                 <Check size={12} /> XÁC NHẬN
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBudget;
