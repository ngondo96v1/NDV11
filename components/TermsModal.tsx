
import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Scale, 
  Clock, 
  AlertCircle, 
  ShieldAlert, 
  ArrowUpCircle, 
  ArrowDownCircle 
} from 'lucide-react';

interface TermsModalProps {
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-500 max-w-md mx-auto">
      {/* Top Header Controls */}
      <div className="w-full px-6 pt-8 pb-4 flex items-center justify-between bg-black text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-[#ff8c00]">
            <Scale size={24} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest leading-none">Chính sách & Điều khoản</h3>
            <p className="text-[8px] font-bold text-gray-500 uppercase mt-1 tracking-tighter">NDV Money Pro V1.26</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      {/* Content Container */}
      <div className="flex-1 bg-black px-5 overflow-y-auto pb-32">
        <div className="bg-white w-full rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl min-h-full">
          
          {/* Card Header */}
          <div className="flex flex-col items-center space-y-6">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-[#ff8c00] font-black text-xl shadow-lg">
              NDV
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-black tracking-tighter uppercase leading-tight">Quy chế vận hành & Nghĩa vụ</h2>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100 my-10"></div>

          {/* Clauses */}
          <div className="space-y-12 px-1 pb-10">
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <Scale size={18} className="text-[#ff8c00]" />
                <h4 className="text-[11px] font-black text-black uppercase tracking-widest">1. Điều khoản sử dụng</h4>
              </div>
              <p className="pl-7 text-xs font-bold text-gray-600 leading-relaxed">
                Người dùng cam kết cung cấp thông tin định danh chính chủ. Việc sử dụng thông tin giả mạo sẽ dẫn đến khóa tài khoản vĩnh viễn.
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-[#ff8c00]" />
                <h4 className="text-[11px] font-black text-black uppercase tracking-widest">2. Thời hạn trả</h4>
              </div>
              <p className="pl-7 text-xs font-bold text-gray-600 leading-relaxed">
                Các khoản vay phải được tất toán chậm nhất vào <span className="text-black font-black underline decoration-gray-200">ngày 01 hàng tháng</span>. Hệ thống sẽ tự động quét dư nợ vào lúc 00:00 cùng ngày.
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <AlertCircle size={18} className="text-red-500" />
                <h4 className="text-[11px] font-black text-red-600 uppercase tracking-widest">3. Phí phạt chậm trả</h4>
              </div>
              <p className="pl-7 text-xs font-bold text-gray-600 leading-relaxed">
                Hệ thống tự động áp dụng phí phạt <span className="text-red-600 font-black">0.1%/ngày</span> tính trên dư nợ gốc thực tế. <br/>
                <span className="font-black italic">GIỚI HẠN:</span> Tổng phí phạt tối đa không vượt quá <span className="text-red-600 font-black">30% số tiền gốc</span> vay ban đầu. Phí sẽ ngừng phát sinh khi đạt ngưỡng này.
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <ShieldAlert size={18} className="text-[#ff8c00]" />
                <h4 className="text-[11px] font-black text-black uppercase tracking-widest">4. Nghĩa vụ hoàn trả</h4>
              </div>
              <p className="pl-7 text-xs font-bold text-gray-600 leading-relaxed">
                Bên vay có nghĩa vụ hoàn trả đúng và đủ số nợ gốc kèm lãi, phí phạt (nếu có) theo đúng cam kết.
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <ArrowUpCircle size={18} className="text-green-500" />
                <h4 className="text-[11px] font-black text-black uppercase tracking-widest">5. Nâng cấp hạng</h4>
              </div>
              <p className="pl-7 text-xs font-bold text-gray-600 leading-relaxed">
                <span className="font-black">Tự động:</span> Hoàn thành <span className="text-green-600 font-black">10 lần thanh toán đúng hạn</span> để tự động lên hạng tiếp theo.
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <ArrowDownCircle size={18} className="text-red-500" />
                <h4 className="text-[11px] font-black text-black uppercase tracking-widest">6. Xuống hạng</h4>
              </div>
              <p className="pl-7 text-xs font-bold text-gray-600 leading-relaxed">
                Mỗi <span className="text-red-600 font-black">01 ngày trễ hạn</span>, hệ thống sẽ <span className="text-red-600 font-black">trừ 01 điểm tiến trình</span>. Khi điểm về 0, tài khoản sẽ tự động bị <span className="text-red-600 font-black">xuống hạng thấp hơn</span>.
              </p>
            </section>
          </div>

          <div className="w-full h-px bg-gray-100 my-8"></div>
          <p className="text-center text-[8px] font-black text-gray-300 uppercase tracking-widest">Cập nhật chính sách: 2024</p>
        </div>
      </div>

      {/* Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-black z-[10000] border-t border-white/5 max-w-md mx-auto">
        <button 
          onClick={onClose}
          className="w-full py-5 rounded-2xl bg-white text-black font-black text-[11px] uppercase tracking-[0.1em] active:scale-95 transition-all shadow-xl"
        >
          Xác nhận đã hiểu điều khoản
        </button>
      </div>
    </div>
  );
};

export default TermsModal;
