import React, { useState } from 'react';
import { User, UserRank } from '../types';
import { 
  Medal, 
  ShieldCheck, 
  Star, 
  CheckCircle2, 
  Trophy, 
  X, 
  ArrowUpCircle, 
  ChevronLeft, 
  Copy, 
  Camera, 
  UploadCloud,
  FileText,
  CircleHelp,
  Info,
  ChevronRight,
  AlertCircle,
  Landmark
} from 'lucide-react';
import { compressImage } from '../utils';

interface RankLimitsProps {
  user: User | null;
  isGlobalProcessing: boolean;
  onBack: () => void;
  onUpgrade: (targetRank: UserRank, bill: string) => Promise<void> | void;
}

enum RankView {
  LIST = 'LIST',
  PAYMENT = 'PAYMENT'
}

const RankLimits: React.FC<RankLimitsProps> = ({ user, isGlobalProcessing, onBack, onUpgrade }) => {
  const [view, setView] = useState<RankView>(RankView.LIST);
  const [selectedRank, setSelectedRank] = useState<any>(null);
  const [billImage, setBillImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  const ranks = [
    {
      id: 'standard',
      name: 'TIÊU CHUẨN',
      code: 'TIEUCHUAN',
      min: '1.000.000 đ',
      max: '2.000.000 đ',
      limitVal: 2000000,
      icon: <Medal size={24} className="text-gray-500" />,
      features: ['Hạn mức 1 - 2 triệu', 'Duyệt trong 24h'],
    },
    {
      id: 'bronze',
      name: 'ĐỒNG',
      code: 'DONG',
      min: '1.000.000 đ',
      max: '3.000.000 đ',
      limitVal: 3000000,
      icon: <Star size={24} className="text-orange-300" />,
      features: ['Hạn mức 1 - 3 triệu', 'Ưu tiên duyệt lệnh'],
    },
    {
      id: 'silver',
      name: 'BẠC',
      code: 'BAC',
      min: '1.000.000 đ',
      max: '4.000.000 đ',
      limitVal: 4000000,
      icon: <Star size={24} className="text-blue-200" />,
      features: ['Hạn mức 1 - 4 triệu', 'Hỗ trợ 24/7'],
    },
    {
      id: 'gold',
      name: 'VÀNG',
      code: 'VANG',
      min: '1.000.000 đ',
      max: '5.000.000 đ',
      limitVal: 5000000,
      icon: <Medal size={24} className="text-yellow-400" />,
      features: ['Hạn mức 1 - 5 triệu', 'Giảm 10% phí phạt'],
    },
    {
      id: 'diamond',
      name: 'KIM CƯƠNG',
      code: 'KIMCUONG',
      min: '1.000.000 đ',
      max: '10.000.000 đ',
      limitVal: 10000000,
      icon: <ShieldCheck size={24} className="text-blue-400" />,
      features: ['Hạn mức 1 - 10 triệu', 'Duyệt lệnh tức thì'],
    }
  ];

  const currentRankIndex = ranks.findIndex(r => r.id === (user?.rank || 'standard'));

  const handleOpenPayment = (rank: any) => {
    setSelectedRank(rank);
    setView(RankView.LIST); // Need this for animation
    setTimeout(() => setView(RankView.PAYMENT), 50);
    setBillImage(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };

  const handleBillUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 800, 800);
        setBillImage(compressed);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmUpgrade = async () => {
    if (billImage && selectedRank && !isSubmitting && !isGlobalProcessing) {
      setIsSubmitting(true);
      try {
        await onUpgrade(selectedRank.id as UserRank, billImage);
        setView(RankView.LIST);
      } catch (e) {
        console.error("Lỗi nâng hạng:", e);
      } finally {
        setIsSubmitting(false);
      }
    } else if (!billImage) {
      alert("Vui lòng tải lên ảnh Bill thanh toán phí nâng hạng.");
    }
  };

  const hasPending = !!user?.pendingUpgradeRank;

  if (view === RankView.PAYMENT && selectedRank) {
    const fee = Math.round(selectedRank.limitVal * 0.05);
    const transferContent = `${selectedRank.code} ${user?.id || 'xxxx'}`;
    const qrUrl = `https://img.vietqr.io/image/970454-0877203996-compact2.png?amount=${fee}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent('DO TRUNG NGON')}`;

    return (
      <div className="w-full h-full bg-black animate-in slide-in-from-right duration-300 flex flex-col p-5 overflow-y-auto pb-24 relative">
        {copyToast && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[1000] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-green-600 text-white px-5 py-2.5 rounded-full font-black text-[9px] uppercase tracking-widest shadow-2xl flex items-center gap-2">
              <CheckCircle2 size={14} />
              Đã sao chép thành công
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView(RankView.LIST)}
              className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center text-white"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-lg font-black text-white uppercase tracking-tighter">Phí nâng hạng {selectedRank.name}</h2>
          </div>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${showHelp ? 'bg-[#ff8c00] text-black shadow-lg shadow-orange-500/20' : 'bg-white/5 text-gray-400'}`}
          >
            <CircleHelp size={20} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 pr-1">
          {showHelp ? (
            <div className="bg-[#ff8c00]/5 border border-[#ff8c00]/20 rounded-2xl p-5 animate-in fade-in zoom-in duration-300 space-y-3">
               <div className="flex items-center gap-2">
                  <Info size={16} className="text-[#ff8c00]" />
                  <span className="text-[10px] font-black text-[#ff8c00] uppercase tracking-widest">Hướng dẫn chi tiết nâng hạng</span>
               </div>
               <div className="space-y-2.5">
                  {[
                    "Quét mã QR hoặc sao chép thông tin thanh toán phí nâng hạng.",
                    "Thực hiện chuyển khoản 24/7 qua ứng dụng Ngân hàng.",
                    "Lưu ảnh Biên lai giao dịch thành công để làm bằng chứng.",
                    "Tải ảnh Bill lên hệ thống và gửi yêu cầu chờ Admin phê duyệt."
                  ].map((text, idx) => (
                    <div key={idx} className="flex gap-2.5">
                      <div className="w-4 h-4 bg-[#ff8c00] rounded-full flex items-center justify-center shrink-0 font-black text-[9px] text-black">{idx + 1}</div>
                      <p className="text-[9px] font-bold text-gray-300 leading-tight">{text}</p>
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            <>
              {/* QR Hero Section */}
              <div className="bg-white rounded-[32px] p-6 flex flex-col items-center gap-4 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-[#ff8c00] to-green-500"></div>
                
                <div className="w-full flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center text-[#ff8c00] font-black text-[10px]">QR</div>
                    <div>
                      <p className="text-[10px] font-black text-black uppercase tracking-widest leading-none">BVBANK TIMO</p>
                      <p className="text-[7px] font-bold text-gray-400 uppercase mt-1">VietQR Dynamic • Tự động</p>
                    </div>
                  </div>
                  <div className="bg-green-500/10 px-3 py-1 rounded-full flex items-center gap-1.5 border border-green-500/20">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[8px] font-black text-green-600 uppercase tracking-tighter">Sẵn sàng</span>
                  </div>
                </div>
                
                <div className="w-48 h-48 bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 p-3 shadow-inner relative group">
                  <img src={qrUrl} alt="VietQR" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-active:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
                
                <div className="text-center space-y-1.5">
                  <p className="text-[10px] font-black text-black uppercase tracking-widest">Quét mã để thanh toán</p>
                  <div className="pt-1">
                    <p className="text-[7px] font-bold text-red-500 uppercase tracking-tighter animate-pulse">
                      * Nếu quét lỗi, vui lòng dùng tính năng "Chuyển tiền 24/7" và nhập tay STK bên dưới
                    </p>
                  </div>
                </div>

                {/* Quick Copy Bar */}
                <div className="w-full grid grid-cols-3 gap-2 mt-2">
                  <button 
                    onClick={() => copyToClipboard('0877203996')}
                    className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-2xl border border-gray-100 active:bg-gray-100 transition-all"
                  >
                    <Copy size={14} className="text-[#ff8c00]" />
                    <span className="text-[7px] font-black text-gray-500 uppercase">Copy STK</span>
                  </button>
                  <button 
                    onClick={() => copyToClipboard(fee.toString())}
                    className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-2xl border border-gray-100 active:bg-gray-100 transition-all"
                  >
                    <Landmark size={14} className="text-[#ff8c00]" />
                    <span className="text-[7px] font-black text-gray-500 uppercase">Copy Tiền</span>
                  </button>
                  <button 
                    onClick={() => copyToClipboard(transferContent)}
                    className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-2xl border border-gray-100 active:bg-gray-100 transition-all"
                  >
                    <FileText size={14} className="text-[#ff8c00]" />
                    <span className="text-[7px] font-black text-gray-500 uppercase">Copy ND</span>
                  </button>
                </div>

                <div className="w-full pt-3 border-t border-gray-100 mt-1 text-center">
                  <p className="text-[6px] font-bold text-gray-300 uppercase tracking-widest">
                    Ngân hàng số Timo - Ngân hàng TMCP Bản Việt
                  </p>
                  <p className="text-[8px] font-black text-black uppercase mt-1">DO TRUNG NGON • 0877203996</p>
                </div>
              </div>

              {/* Verification Section */}
              <div className="bg-[#111111] border border-white/5 rounded-[32px] p-6 flex flex-col gap-5 shadow-2xl">
                <div className="space-y-5">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                         <Camera size={16} className="text-[#ff8c00]" />
                         <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Tải ảnh biên lai</h3>
                      </div>
                      <span className="text-[7px] font-bold text-gray-600 uppercase">Bắt buộc</span>
                   </div>
                   
                   <div 
                     onClick={() => document.getElementById('billInputRankUpgrade')?.click()}
                     className={`aspect-video w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer relative overflow-hidden transition-all ${billImage ? 'border-green-500 bg-green-500/5' : 'border-white/5 bg-black hover:border-[#ff8c00]/30'}`}
                   >
                      <input id="billInputRankUpgrade" type="file" accept="image/*" hidden onChange={handleBillUpload} />
                      {billImage ? (
                        <>
                          <img src={billImage} className="w-full h-full object-cover opacity-60" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                            <CheckCircle2 size={28} className="text-green-500 mb-1.5" />
                            <span className="text-[9px] font-black text-white">BILL ĐÃ TẢI LÊN</span>
                          </div>
                        </>
                      ) : (
                        <>
                          {isUploading ? <div className="animate-spin border-3 border-[#ff8c00] border-t-transparent w-6 h-6 rounded-full" /> : <UploadCloud size={28} className="text-gray-700" />}
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Chọn ảnh Biên lai giao dịch</p>
                        </>
                      )}
                   </div>
                </div>

                <button
                  onClick={handleConfirmUpgrade}
                  disabled={!billImage || isSubmitting || isGlobalProcessing}
                  className={`w-full py-4 rounded-2xl font-black text-xs tracking-[0.2em] transition-all shadow-xl ${billImage && !isSubmitting && !isGlobalProcessing ? 'bg-[#ff8c00] text-black shadow-orange-950/40 active:scale-95' : 'bg-white/5 text-gray-600 cursor-not-allowed opacity-50'}`}
                >
                  {isSubmitting || isGlobalProcessing ? 'ĐANG XỬ LÝ...' : (billImage ? 'GỬI YÊU CẦU NÂNG CẤP' : 'VUI LÒNG ĐÍNH KÈM BILL')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black px-4 flex flex-col animate-in fade-in duration-500 overflow-hidden">
      <div className="flex items-center justify-between px-1 py-4 flex-none">
        <div className="flex items-center gap-2">
          <button 
            onClick={onBack}
            className="w-7 h-7 bg-[#111111] border border-white/5 rounded-full flex items-center justify-center text-white active:scale-90 transition-all"
          >
            <X size={14} />
          </button>
          <h2 className="text-base font-black text-white tracking-tighter uppercase">Hạng & Hạn mức</h2>
        </div>
        <button 
          onClick={() => setShowHelp(!showHelp)}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${showHelp ? 'bg-[#ff8c00] text-black shadow-lg shadow-orange-500/20' : 'bg-white/5 text-gray-500'}`}
        >
          <CircleHelp size={16} />
        </button>
      </div>

      {showHelp && (
        <div className="bg-[#ff8c00]/5 border border-[#ff8c00]/20 rounded-xl p-3 mb-2 animate-in fade-in zoom-in duration-300 space-y-1.5 flex-none">
           <div className="flex items-center gap-2">
              <Info size={12} className="text-[#ff8c00]" />
              <span className="text-[8px] font-black text-[#ff8c00] uppercase tracking-widest">Quy định nâng hạng</span>
           </div>
           <div className="grid grid-cols-1 gap-1.5">
              <div className="flex gap-2">
                <div className="w-3.5 h-3.5 bg-[#ff8c00] rounded-full flex items-center justify-center shrink-0 font-black text-[8px] text-black">1</div>
                <p className="text-[8px] font-bold text-gray-300 leading-tight">Tăng hạn mức vay, ưu tiên duyệt lệnh và giảm phí phạt.</p>
              </div>
              <div className="flex gap-2">
                <div className="w-3.5 h-3.5 bg-[#ff8c00] rounded-full flex items-center justify-center shrink-0 font-black text-[8px] text-black">2</div>
                <p className="text-[8px] font-bold text-gray-300 leading-tight">Phí nâng hạng: 5% giá trị hạn mức tối đa của hạng mới.</p>
              </div>
           </div>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-2 pb-4 overflow-hidden">
        {ranks.map((rank, idx) => {
          const isCurrent = user?.rank === rank.id;
          const isTargetPending = user?.pendingUpgradeRank === rank.id;
          const isHigherRank = idx > currentRankIndex;

          return (
            <div 
              key={rank.id}
              className={`flex-1 min-h-0 bg-[#111111] rounded-xl p-3 relative transition-all duration-300 border flex flex-col justify-center ${
                isCurrent ? 'border-[#ff8c00] shadow-[0_0_15px_rgba(255,140,0,0.1)]' : 'border-white/5'
              } ${!isCurrent && (currentRankIndex === ranks.length - 1 || hasPending) ? 'opacity-40' : 'opacity-100'}`}
            >
              {(isCurrent || isTargetPending) && (
                <div className={`absolute right-3 top-2 text-[6px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase ${
                  isCurrent ? 'bg-[#ff8c00] text-black' : 'bg-blue-500 text-white'
                }`}>
                  {isCurrent ? 'Hiện tại' : 'Đang duyệt'}
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                  {React.cloneElement(rank.icon as React.ReactElement, { size: 16 })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-sm font-black text-white leading-tight tracking-tight uppercase">{rank.name}</h3>
                    <span className="text-[7px] font-black text-[#ff8c00] tracking-widest">{rank.max}</span>
                  </div>
                  <div className="flex gap-2 mt-0.5">
                    {rank.features.slice(0, 2).map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-1">
                        <CheckCircle2 size={6} className={isCurrent ? 'text-[#ff8c00]' : 'text-gray-600'} />
                        <span className="text-[7px] font-bold text-gray-500 whitespace-nowrap">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {isHigherRank && !hasPending && (
                  <button 
                    onClick={() => handleOpenPayment(rank)}
                    className="bg-[#ff8c00] text-black font-black px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-lg shadow-orange-950/20 active:scale-95 transition-all text-[7px] uppercase tracking-widest"
                  >
                    <ArrowUpCircle size={10} />
                    NÂNG CẤP
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RankLimits;