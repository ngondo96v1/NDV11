
import React from 'react';
import { User, LoanRecord } from '../types';
import { X, ShieldCheck, Download, Calendar, Award, Scale, AlertCircle, ShieldAlert, FileCheck, Landmark, ArrowDownToLine } from 'lucide-react';

interface ContractModalProps {
  contract: LoanRecord;
  user: User | null;
  onClose: () => void;
}

const ContractModal: React.FC<ContractModalProps> = ({ contract, user, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-500 overflow-hidden">
      <div className="w-full p-3 flex items-center justify-between bg-black text-white border-b border-white/5 flex-none">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-orange-500/10 rounded-lg flex items-center justify-center text-[#ff8c00]">
            <Award size={16} />
          </div>
          <div>
            <h3 className="text-[9px] font-black uppercase tracking-widest leading-none">Hợp đồng gốc kỹ thuật số</h3>
            <p className="text-[6px] font-bold text-gray-500 uppercase mt-0.5 tracking-tighter">XÁC THỰC BLOCKCHAIN V1.26 PRO</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-7 h-7 bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-90"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 bg-black px-2 pt-1 pb-20 overflow-hidden flex flex-col">
        <div className="bg-white w-full rounded-2xl p-3 relative overflow-hidden shadow-2xl border border-gray-100 flex-1 flex flex-col">
          
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-[0.01] rotate-[-35deg] select-none space-y-8">
            <span className="text-3xl font-black whitespace-nowrap">NDV MONEY ORIGINAL</span>
            <span className="text-3xl font-black whitespace-nowrap">AUTHENTIC DOCUMENT</span>
          </div>

          <div className="flex flex-col items-center space-y-1 relative z-10 flex-none">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-[#ff8c00] font-black text-xs shadow-lg border border-orange-500/20">
                NDV
               </div>
               <div className="h-4 w-px bg-gray-200"></div>
               <Landmark size={16} className="text-gray-300" />
            </div>
            <div className="text-center">
              <h2 className="text-sm font-black text-black tracking-tighter uppercase leading-tight">Hợp đồng vay tiêu dùng</h2>
              <p className="text-[6px] font-bold text-gray-400 uppercase tracking-widest">Mã số: {contract.id}</p>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100 my-2 relative z-10 flex-none"></div>

          <div className="flex-1 min-h-0 flex flex-col justify-between relative z-10 overflow-y-auto custom-scrollbar py-1 pr-1">
            
            {/* Điều 1: Các bên */}
            <section className="space-y-1.5 flex-none">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-black rounded flex items-center justify-center text-white font-black text-[7px]">01</div>
                <h4 className="text-[10px] font-black text-black uppercase tracking-widest">Các bên giao kết</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 flex flex-col justify-center shadow-sm">
                  <p className="text-gray-400 uppercase text-[6px] font-black tracking-widest mb-1">Bên A (Cho vay)</p>
                  <p className="text-[9px] text-black font-black uppercase truncate">NDV FINANCIAL</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 flex flex-col justify-center shadow-sm">
                  <p className="text-gray-400 uppercase text-[6px] font-black tracking-widest mb-1">Bên B (Người vay)</p>
                  <p className="text-[9px] text-black font-black uppercase truncate">{user?.fullName || 'KHÁCH HÀNG'}</p>
                </div>
              </div>
            </section>

            {/* Điều 2: Đối tượng */}
            <section className="space-y-1.5 flex-none">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-black rounded flex items-center justify-center text-white font-black text-[7px]">02</div>
                <h4 className="text-[10px] font-black text-black uppercase tracking-widest">Đối tượng hợp đồng</h4>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 flex items-center justify-between shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-gray-400 uppercase tracking-wider">Số tiền vay gốc</span>
                  <span className="text-[12px] font-black text-black">{contract.amount.toLocaleString()} đ</span>
                </div>
                <div className="h-6 w-px bg-gray-200"></div>
                <div className="flex flex-col items-end">
                  <span className="text-[7px] font-black text-orange-500 uppercase tracking-wider">Thực nhận</span>
                  <span className="text-[12px] font-black text-orange-600">{(contract.amount * 0.85).toLocaleString()} đ</span>
                </div>
              </div>
            </section>

            {/* Điều 3: Thời hạn & Lãi suất */}
            <section className="space-y-1.5 flex-none">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-black rounded flex items-center justify-center text-white font-black text-[7px]">03</div>
                <h4 className="text-[10px] font-black text-black uppercase tracking-widest">Thời hạn & Lãi suất</h4>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-gray-400" />
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-gray-400 uppercase tracking-wider">Ngày đến hạn</span>
                    <span className="text-[10px] font-black text-black">{contract.date}</span>
                  </div>
                </div>
                <div className="bg-green-100 text-green-700 px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-tighter">Lãi suất: 0%</div>
              </div>
            </section>

            {/* Điều 4: Cam kết & Chế tài */}
            <section className="space-y-1.5 flex-none">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-red-600 rounded flex items-center justify-center text-white font-black text-[7px]">04</div>
                <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest">Cam kết & Chế tài</h4>
              </div>
              <div className="bg-red-50/50 border border-red-100 rounded-lg p-2.5 shadow-sm">
                <p className="text-[9px] font-bold text-gray-700 leading-relaxed">
                  Bên B cam kết thanh toán đúng hạn.<br />
                  Phí phạt chậm trả <span className="text-red-600 font-black">0.1%/ngày</span> (không quá 30% giá trị khoản vay).<br />
                  Hợp đồng có giá trị pháp lý ngay sau khi ký số.
                </p>
              </div>
            </section>

            {/* Chữ ký */}
            <section className="flex-none pt-1 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col items-center justify-center space-y-0.5">
                  <p className="text-[5px] font-black text-gray-400 uppercase tracking-widest">Đại diện Bên A</p>
                  <div className="w-full aspect-[16/9] bg-gray-50 border border-gray-100 rounded-md flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-80 scale-150 -rotate-12">
                      <div className="w-12 h-12 rounded-full border-2 border-red-600 border-dashed flex flex-col items-center justify-center text-red-600">
                        <span className="text-[3px] font-black uppercase leading-none">NDV GROUP</span>
                        <ShieldCheck size={10} className="my-0.5" />
                        <span className="text-[2.5px] font-black uppercase leading-none">VERIFIED</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[6px] font-black text-red-600 uppercase tracking-tighter">ĐÃ KÝ SỐ</p>
                </div>

                <div className="flex flex-col items-center justify-center space-y-0.5">
                  <p className="text-[5px] font-black text-gray-400 uppercase tracking-widest">Người vay Bên B</p>
                  <div className="w-full aspect-[16/9] bg-gray-50 border border-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                    {contract.signature ? (
                      <img src={contract.signature} className="w-full h-full object-contain mix-blend-multiply opacity-80 p-1" alt="Signature" />
                    ) : (
                      <div className="opacity-10"><FileCheck size={16} /></div>
                    )}
                  </div>
                  <p className="text-[5px] font-black text-blue-600 uppercase tracking-tighter truncate w-full text-center">{user?.fullName}</p>
                </div>
              </div>
            </section>
          </div>

          <div className="flex justify-center pt-2 mt-1 border-t border-gray-50 flex-none">
             <p className="text-[5px] font-bold text-gray-300 uppercase tracking-[0.2em]">Hợp đồng số hóa NDV Financial System v1.26</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-3 bg-black flex gap-2 z-[110] border-t border-white/5 flex-none">
        <button className="flex-1 py-3.5 rounded-xl border border-white/10 text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all bg-white/5">
          <Download size={14} />
          Bản gốc
        </button>
        <button 
          onClick={onClose}
          className="flex-[1.5] py-3.5 rounded-xl bg-[#ff8c00] text-black font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-orange-950/20"
        >
          Xác nhận đóng
        </button>
      </div>
    </div>
  );
};

export default ContractModal;
