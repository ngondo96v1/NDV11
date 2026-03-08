import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User, LoanRecord } from '../types';
import { Wallet, X, Eye, FileText, CheckCircle2, ShieldCheck, Eraser, ChevronLeft, CreditCard, Copy, Camera, UploadCloud, CircleHelp, Info, Award, Landmark, FileCheck, AlertCircle, AlertTriangle, ArrowDownToLine, ShieldAlert, ChevronRight, History, Calendar } from 'lucide-react';
import ContractModal from './ContractModal';
import { compressImage } from '../utils';

interface LoanApplicationProps {
  user: User | null;
  loans: LoanRecord[];
  systemBudget: number;
  isGlobalProcessing: boolean;
  onApplyLoan: (amount: number, signature?: string) => Promise<void> | void;
  onSettleLoan: (loanId: string, bill: string, settlementType: 'ALL' | 'PRINCIPAL', bankTransactionId?: string) => Promise<void> | void;
  onBack: () => void;
  initialLoanToSettle?: LoanRecord | null;
  initialLoanToView?: LoanRecord | null;
}

enum LoanStep {
  LIST = 'LIST',
  SELECT_AMOUNT = 'SELECT_AMOUNT',
  CONTRACT = 'CONTRACT',
  SETTLE_DETAIL = 'SETTLE_DETAIL'
}

const SignaturePad: React.FC<{ onSign: (signature: string | null) => void }> = ({ onSign }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasContent, setHasContent] = useState(false);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d', { 
      desynchronized: true,
      willReadFrequently: false 
    });
    
    if (!ctx) return;
    
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#000000';
    ctxRef.current = ctx;
  }, []);

  useEffect(() => {
    initCanvas();
    const observer = new ResizeObserver(() => initCanvas());
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [initCanvas]);

  const getCoords = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const getSignatureData = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasContent) return null;
    return canvas.toDataURL('image/png');
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    const coords = getCoords(e);
    isDrawing.current = true;
    lastPoint.current = coords;

    const ctx = ctxRef.current;
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
    
    if (!hasContent) {
      setHasContent(true);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDrawing.current || !ctxRef.current || !lastPoint.current) return;
    e.preventDefault();

    const ctx = ctxRef.current;
    const currentPoint = getCoords(e);
    const midPoint = {
      x: lastPoint.current.x + (currentPoint.x - lastPoint.current.x) / 2,
      y: lastPoint.current.y + (currentPoint.y - lastPoint.current.y) / 2,
    };

    ctx.quadraticCurveTo(lastPoint.current.x, lastPoint.current.y, midPoint.x, midPoint.y);
    ctx.stroke();

    lastPoint.current = currentPoint;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDrawing.current) return;
    const ctx = ctxRef.current;
    if (ctx && lastPoint.current) {
      ctx.lineTo(lastPoint.current.x, lastPoint.current.y);
      ctx.stroke();
    }
    isDrawing.current = false;
    lastPoint.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    onSign(getSignatureData());
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas || !ctxRef.current) return;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    onSign(null);
  };

  return (
    <div className="relative aspect-[16/9] w-full bg-[#fdfdfd] border border-dashed border-gray-200 rounded-lg overflow-hidden touch-none shadow-inner">
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="w-full h-full cursor-crosshair touch-none"
        style={{ touchAction: 'none' }}
      />
      {!hasContent && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
          <span className="text-[7px] font-black text-black uppercase tracking-[0.2em]">Ký tại đây</span>
          <div className="w-6 h-px bg-black mt-1"></div>
        </div>
      )}
      {hasContent && (
        <button
          onClick={clear}
          className="absolute top-1 right-1 p-1 bg-white border border-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-all shadow-md active:scale-90"
        >
          <Eraser size={10} />
        </button>
      )}
    </div>
  );
};

const LoanApplication: React.FC<LoanApplicationProps> = ({ user, loans, systemBudget, isGlobalProcessing, onApplyLoan, onSettleLoan, onBack, initialLoanToSettle, initialLoanToView }) => {
  const [step, setStep] = useState<LoanStep>(initialLoanToSettle ? LoanStep.SETTLE_DETAIL : LoanStep.LIST);
  const [selectedAmount, setSelectedAmount] = useState<number>(1000000);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<LoanRecord | null>(initialLoanToView || null);
  const [settleType, setSettleType] = useState<'ALL' | 'PRINCIPAL'>('ALL');
  const [settleLoan, setSettleLoan] = useState<LoanRecord | null>(initialLoanToSettle || null);
  const [billImage, setBillImage] = useState<string | null>(null);
  const [bankTransactionId, setBankTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDuplicateTransaction = bankTransactionId.trim() !== '' && loans.some(l => 
    l.bankTransactionId === bankTransactionId.trim() && l.id !== settleLoan?.id
  );

  useEffect(() => {
    if (initialLoanToSettle) {
      setSettleLoan(initialLoanToSettle);
      setStep(LoanStep.SETTLE_DETAIL);
    } else if (initialLoanToView) {
      setSelectedContract(initialLoanToView);
      setStep(LoanStep.LIST);
    } else {
      setStep(LoanStep.LIST);
      setSettleLoan(null);
      setSelectedContract(null);
    }
  }, [initialLoanToSettle, initialLoanToView]);
  const [isUploading, setIsUploading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  const userAvailableBalance = user?.balance || 0;
  const actualMaxAllowed = Math.min(userAvailableBalance, systemBudget);
  const totalLimitCap = 10000000;

  const isSystemOutOfCapital = systemBudget < 1000000;

  const nextSequence = (user?.lastLoanSeq || 0) + 1;
  const nextContractId = user ? `${user.id}-${nextSequence}` : 'TEMP-ID';

  const getCalculatedDueDate = () => {
    const now = new Date();
    const nextMonth1st = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diffTime = nextMonth1st.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let finalDate;
    if (diffDays < 10) {
      finalDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    } else {
      finalDate = nextMonth1st;
    }
    
    const dayStr = finalDate.getDate().toString().padStart(2, '0');
    const monthStr = (finalDate.getMonth() + 1).toString().padStart(2, '0');
    return `${dayStr}/${monthStr}/${finalDate.getFullYear()}`;
  };

  const dueDate = getCalculatedDueDate();

  // Tính tổng tiền vay trong chu kỳ hiện tại (các khoản vay có cùng tháng/năm hạn)
  // Chỉ tính các khoản vay chưa tất toán (ĐANG NỢ, CHỜ DUYỆT, ĐÃ DUYỆT, ĐANG GIẢI NGÂN, CHỜ TẤT TOÁN)
  const currentCycleTotal = loans
    .filter(l => {
      if (l.status === 'BỊ TỪ CHỐI' || l.status === 'ĐÃ TẤT TOÁN') return false;
      const [d, m, y] = l.date.split('/').map(Number);
      const [targetD, targetM, targetY] = dueDate.split('/').map(Number);
      return m === targetM && y === targetY;
    })
    .reduce((sum, l) => sum + l.amount, 0);

  const handleConfirmSignature = async () => {
    if (signatureData && !isSubmitting && !isGlobalProcessing) {
      setIsSubmitting(true);
      try {
        await onApplyLoan(selectedAmount, signatureData);
        setStep(LoanStep.LIST);
      } catch (e) {
        console.error("Lỗi đăng ký vay:", e);
      } finally {
        setIsSubmitting(false);
      }
    }
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

  const handleConfirmSettlement = async () => {
    if (settleLoan && billImage && !isSubmitting && !isGlobalProcessing) {
      if (!bankTransactionId.trim()) {
        alert("Vui lòng nhập Mã giao dịch ngân hàng để đối soát.");
        return;
      }
      if (isDuplicateTransaction) {
        alert("Mã giao dịch này đã được sử dụng. Vui lòng kiểm tra lại.");
        return;
      }
      setIsSubmitting(true);
      try {
        await onSettleLoan(settleLoan.id, billImage, settleType, bankTransactionId);
        
        // Nếu là khoản vay được truyền từ Dashboard, sau khi tất toán xong thì quay về Dashboard
        if (initialLoanToSettle) {
          onBack();
        } else {
          setStep(LoanStep.LIST);
        }
        
        setSettleLoan(null);
        setBillImage(null);
        setBankTransactionId('');
      } catch (e) {
        console.error("Lỗi tất toán:", e);
      } finally {
        setIsSubmitting(false);
      }
    } else if (!billImage) {
      alert("Vui lòng tải lên ảnh Bill thanh toán");
    }
  };

  const getStatusColor = (status: string, isOverdue: boolean) => {
    if (isOverdue) return 'text-red-500';
    switch (status) {
      case 'CHỜ DUYỆT': return 'text-orange-500';
      case 'ĐÃ DUYỆT': return 'text-blue-500';
      case 'ĐANG GIẢI NGÂN': return 'text-cyan-500';
      case 'ĐANG NỢ': return 'text-orange-600';
      case 'CHỜ TẤT TOÁN': return 'text-indigo-500';
      case 'ĐÃ TẤT TOÁN': return 'text-green-500';
      case 'BỊ TỪ CHỐI': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const renderList = () => {
    // Logic giới hạn 10tr chu kỳ:
    // Hợp đồng mới nhất (để xét quy tắc N+1)
    const lastLoan = loans.length > 0 ? loans[0] : null;
    
    // Khoản vay trước đó phải được xử lý xong (không ở trạng thái chờ)
    // Các trạng thái chặn vay mới: CHỜ DUYỆT, ĐÃ DUYỆT, ĐANG GIẢI NGÂN, CHỜ TẤT TOÁN
    const isPreviousLoanPending = lastLoan && ['CHỜ DUYỆT', 'ĐÃ DUYỆT', 'ĐANG GIẢI NGÂN', 'CHỜ TẤT TOÁN'].includes(lastLoan.status);

    const today = new Date();
    
    const isLimitReached = currentCycleTotal >= 10000000;

    const hasOverdue = loans.some(l => {
      if (l.status !== 'ĐANG NỢ' && l.status !== 'CHỜ TẤT TOÁN') return false;
      const [d, m, y] = l.date.split('/').map(Number);
      const dueDateObj = new Date(y, m - 1, d);
      return dueDateObj < today;
    });

    const isApplyDisabled = hasOverdue || isSystemOutOfCapital || isPreviousLoanPending || isLimitReached || (user?.balance || 0) <= 0;

    return (
      <div className="w-full space-y-4 animate-in fade-in duration-500">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white tracking-tighter uppercase">Vay</h2>
            <button 
              onClick={() => setShowHelp(!showHelp)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all animate-bounce-subtle ${showHelp ? 'bg-[#ff8c00] text-black shadow-lg shadow-orange-500/20' : 'bg-white/5 text-gray-500'}`}
            >
              <CircleHelp size={16} />
            </button>
          </div>
            <button 
            disabled={isApplyDisabled}
            onClick={() => {
              const maxPossible = Math.min(10000000 - currentCycleTotal, actualMaxAllowed);
              setSelectedAmount(Math.min(1000000, maxPossible));
              setStep(LoanStep.SELECT_AMOUNT);
            }}
            className={`font-black px-4 py-1.5 rounded-full text-[8px] tracking-widest transition-all shadow-lg ${
              isApplyDisabled 
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50' 
                : 'bg-[#ff8c00] text-black active:scale-95 shadow-orange-950/20'
            }`}
          >
            {hasOverdue 
              ? 'NỢ XẤU - KHÓA' 
              : isLimitReached
                ? 'ĐẠT GIỚI HẠN 10TR/THÁNG'
                : isPreviousLoanPending 
                  ? 'CHỜ DUYỆT KHOẢN TRƯỚC' 
                  : isSystemOutOfCapital 
                    ? 'BẢO TRÌ VỐN' 
                    : 'ĐĂNG KÝ MỚI'}
          </button>
        </div>

        {showHelp && (
          <div className="bg-[#ff8c00]/5 border border-[#ff8c00]/20 rounded-2xl p-5 animate-in fade-in zoom-in duration-300 space-y-3">
             <div className="flex items-center gap-2">
                <Info size={14} className="text-[#ff8c00]" />
                <span className="text-[9px] font-black text-[#ff8c00] uppercase tracking-widest">Chính sách vay vốn</span>
             </div>
             <div className="space-y-2.5">
                <div className="flex gap-2.5">
                  <div className="w-4 h-4 bg-[#ff8c00] rounded-full flex items-center justify-center shrink-0 font-black text-[9px] text-black">1</div>
                  <p className="text-[9px] font-bold text-gray-300 leading-tight">
                    <span className="text-[#ff8c00]">Phí dịch vụ:</span> 15% khấu trừ trực tiếp vào số tiền giải ngân.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <div className="w-4 h-4 bg-[#ff8c00] rounded-full flex items-center justify-center shrink-0 font-black text-[9px] text-black">2</div>
                  <p className="text-[9px] font-bold text-gray-300 leading-tight">
                    <span className="text-[#ff8c00]">Hạn mức:</span> Tối đa 10.000.000 đ trong chu kỳ 30 ngày.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <div className="w-4 h-4 bg-[#ff8c00] rounded-full flex items-center justify-center shrink-0 font-black text-[9px] text-black">3</div>
                  <p className="text-[9px] font-bold text-gray-300 leading-tight">
                    <span className="text-[#ff8c00]">Vay bổ sung:</span> Có thể vay nhiều lần nếu chưa vượt hạn mức chu kỳ.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <div className="w-4 h-4 bg-[#ff8c00] rounded-full flex items-center justify-center shrink-0 font-black text-[9px] text-black">4</div>
                  <p className="text-[9px] font-bold text-gray-300 leading-tight">
                    <span className="text-[#ff8c00]">Quy tắc:</span> Chỉ xử lý 01 yêu cầu vay vốn tại một thời điểm.
                  </p>
                </div>
             </div>
          </div>
        )}

        <div className="bg-[#111111] border border-white/5 rounded-3xl p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Wallet className="text-[#ff8c00]" size={20} />
              </div>
              <div>
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Hạn mức khả dụng</p>
                <p className="text-lg font-black text-white">{(userAvailableBalance).toLocaleString()} đ</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              {isPreviousLoanPending && !hasOverdue && (
                <div className="flex items-center gap-1 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 animate-pulse">
                  <Info size={10} className="text-blue-500" />
                  <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest">Đang xét duyệt</span>
                </div>
              )}
              {isSystemOutOfCapital && !hasOverdue && !isPreviousLoanPending && (
                <div className="flex items-center gap-1 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20 animate-pulse">
                  <ShieldAlert size={10} className="text-orange-500" />
                  <span className="text-[7px] font-black text-orange-500 uppercase tracking-widest">Bảo trì vốn</span>
                </div>
              )}
            </div>
          </div>
          
          {isLimitReached && !hasOverdue && (
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest text-center px-1">
              Đã đạt giới hạn vay 10.000.000 đ trong chu kỳ này
            </p>
          )}

          {!isLimitReached && (isPreviousLoanPending || isSystemOutOfCapital) && !hasOverdue && (
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest text-center px-1">
              {isPreviousLoanPending 
                  ? 'Đợi duyệt khoản vay trước' 
                  : 'Hệ thống đang bảo trì vốn'}
            </p>
          )}

          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#ff8c00] transition-all duration-1000" 
              style={{ width: `${(userAvailableBalance / totalLimitCap) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Loan History List in Apply Tab */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 px-1 text-gray-400">
            <History size={14} />
            <h3 className="text-[9px] font-black uppercase tracking-widest">Lịch sử giao dịch</h3>
          </div>

          <div className="space-y-2 pb-10">
            {loans.length === 0 ? (
              <div className="bg-[#111111]/50 border border-white/5 border-dashed rounded-2xl p-8 text-center">
                <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Chưa có giao dịch nào</p>
              </div>
            ) : (
              [...loans]
                .sort((a, b) => {
                  const aIsInactive = ['ĐÃ TẤT TOÁN', 'BỊ TỪ CHỐI'].includes(a.status);
                  const bIsInactive = ['ĐÃ TẤT TOÁN', 'BỊ TỪ CHỐI'].includes(b.status);
                  if (aIsInactive !== bIsInactive) return aIsInactive ? 1 : -1;
                  return (b.updatedAt || 0) - (a.updatedAt || 0);
                })
                .map((item, idx) => {
                const [d, m, y] = item.date.split('/').map(Number);
                const isOverdue = (item.status === 'ĐANG NỢ' || item.status === 'CHỜ TẤT TOÁN') && new Date(y, m - 1, d) < today;
                const statusColor = getStatusColor(item.status, isOverdue);

                return (
                  <div key={idx} className={`bg-[#111111] border rounded-2xl p-3.5 flex flex-col gap-2.5 ${isOverdue ? 'border-red-600/30 bg-red-600/5' : 'border-white/5'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-500">
                          <FileText size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <p className="text-sm font-black text-white leading-none">{item.amount.toLocaleString()} đ</p>
                            <span className="text-[7px] font-black text-gray-600 uppercase tracking-widest">#{item.id}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className={`w-1 h-1 rounded-full ${item.status === 'ĐÃ TẤT TOÁN' ? 'bg-green-500' : isOverdue ? 'bg-red-500 animate-pulse' : 'bg-orange-500 animate-pulse'}`}></div>
                            <span className={`text-[7px] font-black uppercase ${statusColor}`}>
                              {isOverdue ? 'QUÁ HẠN' : item.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <button 
                           onClick={() => setSelectedContract(item)}
                           className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center text-gray-500 hover:text-white transition-all"
                         >
                           <Eye size={14} />
                         </button>
                         {(item.status === 'ĐANG NỢ' || item.status === 'ĐANG GIẢI NGÂN') && (
                           <button 
                             onClick={() => {
                               setSettleLoan(item);
                               setStep(LoanStep.SETTLE_DETAIL);
                             }}
                             className="bg-white text-black font-black px-2.5 py-1.5 rounded-lg text-[7px] uppercase tracking-widest active:scale-95 transition-all"
                           >
                             Tất toán
                           </button>
                         )}
                      </div>
                    </div>
                    
                    <div className="mt-1">
                      {item.rejectionReason && (
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap overflow-hidden mb-0.5">
                          <AlertTriangle size={8} className="text-red-500 shrink-0" />
                          <p className="text-[7px] font-black text-red-500 uppercase tracking-widest truncate">
                            Lý do từ chối: {item.rejectionReason}
                          </p>
                        </div>
                      )}

                      <div className="border-t border-white/5 pt-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2.5">
                            <p className="text-[7px] font-bold text-gray-700">Hạn: {item.date}</p>
                            <p className="text-[7px] font-bold text-gray-700">Tạo: {item.createdAt}</p>
                          </div>
                          {isOverdue && (
                            <div className="text-right">
                              <p className="text-[6px] font-black text-gray-600 uppercase tracking-widest leading-none">Phí phạt trễ hạn</p>
                              <p className="text-[9px] font-black text-red-500">{(item.fine || 0).toLocaleString()} đ</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {selectedContract && (
          <ContractModal 
            contract={selectedContract} 
            user={user} 
            onClose={() => {
              setSelectedContract(null);
              if (initialLoanToView) onBack();
            }} 
          />
        )}
      </div>
    );
  };

  const renderSelectAmount = () => {
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
      if (val <= actualMaxAllowed) {
        setSelectedAmount(val);
      }
    };

    const isLimitedByBudget = systemBudget < userAvailableBalance;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-5 animate-in fade-in duration-300 overflow-y-auto">
        <div className="bg-[#111111] w-full max-w-sm rounded-3xl border border-white/10 p-5 space-y-6 relative shadow-2xl my-auto">
          <button onClick={() => setStep(LoanStep.LIST)} className="absolute right-4 top-4 text-gray-500 hover:text-white p-2">
            <X size={16} />
          </button>
          <div className="space-y-1 text-center">
            <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Chọn số tiền vay</h3>
            <p className="text-2xl font-black text-[#ff8c00] tracking-tighter">
              {selectedAmount.toLocaleString()} <span className="text-sm">đ</span>
            </p>
            <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest">Phí 15% (Khấu trừ trực tiếp khi giải ngân)</p>
          </div>

          {isLimitedByBudget && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-2xl animate-in zoom-in duration-300 flex flex-col items-center text-center">
               <div className="flex items-center gap-1.5 mb-0.5">
                  <AlertCircle size={12} className="text-red-500" />
                  <span className="text-[8px] font-black text-red-500 uppercase">Nguồn vốn giới hạn</span>
               </div>
               <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">
                 Tối đa {systemBudget.toLocaleString()} đ. Hạn mức sẽ mở lại sau khi nạp vốn.
               </p>
            </div>
          )}

          <div className="space-y-6 px-1">
            <div className="relative pt-4 pb-1">
              <input
                type="range"
                min="1000000"
                max={Math.min(10000000 - currentCycleTotal, actualMaxAllowed)}
                step="1000000"
                value={selectedAmount}
                onChange={handleSliderChange}
                className="w-full h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-[#ff8c00] focus:outline-none"
              />
              <div className="flex justify-between mt-4">
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-[8px] font-black text-gray-500 uppercase">Min</span>
                  <span className="text-[9px] font-black text-white">1.000.000 đ</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className={`text-[8px] font-black uppercase ${isLimitedByBudget ? 'text-red-500' : 'text-orange-500/50'}`}>
                    {isLimitedByBudget ? 'Ngân sách hệ thống' : 'Hạn mức khả dụng'}
                  </span>
                  <span className={`text-[9px] font-black ${isLimitedByBudget ? 'text-red-500' : 'text-[#ff8c00]'}`}>
                    {Math.min(10000000 - currentCycleTotal, actualMaxAllowed).toLocaleString()} đ
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            disabled={actualMaxAllowed < 1000000}
            onClick={() => { setStep(LoanStep.CONTRACT); setSignatureData(null); }}
            className={`w-full font-black py-4 rounded-2xl text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all ${
              actualMaxAllowed < 1000000 ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-[#ff8c00] text-black shadow-orange-950/20'
            }`}
          >
            {actualMaxAllowed < 1000000 ? 'KHÔNG ĐỦ NGÂN SÁCH' : 'TIẾP TỤC'}
          </button>
        </div>
      </div>
    );
  };

  const renderSettleDetail = () => {
    if (!settleLoan) return null;
    
    const amountAll = Math.round(settleLoan.amount + (settleLoan.fine || 0));
    const amountPrincipal = Math.round((settleLoan.amount * 0.15) + (settleLoan.fine || 0));
    
    const currentAmount = settleType === 'ALL' ? amountAll : amountPrincipal;
    const currentPrefix = settleType === 'ALL' ? 'TT' : 'VG';
    const content = `${currentPrefix}-${settleLoan.id}`;
    const qrUrl = `https://img.vietqr.io/image/970454-0877203996-compact2.png?amount=${currentAmount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent('DO TRUNG NGON')}`;

    return (
      <div className="w-full h-full bg-black animate-in slide-in-from-right duration-300 flex flex-col p-4 overflow-hidden relative">
        <div className="flex items-center justify-between mb-4 flex-none">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (initialLoanToSettle) {
                  onBack();
                } else {
                  setStep(LoanStep.LIST);
                }
              }} 
              className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-white"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-base font-black text-white uppercase tracking-tighter">Tất toán khoản vay</h2>
          </div>
          <button onClick={() => setShowHelp(!showHelp)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${showHelp ? 'bg-[#ff8c00] text-black shadow-lg shadow-orange-500/20' : 'bg-white/5 text-gray-400'}`}><CircleHelp size={18} /></button>
        </div>

        {/* Settlement Type Selection */}
        <div className="flex gap-2 mb-4 flex-none">
          <button 
            onClick={() => setSettleType('ALL')}
            className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border ${
              settleType === 'ALL' 
                ? 'bg-[#ff8c00] text-black border-[#ff8c00] shadow-lg shadow-orange-500/20' 
                : 'bg-white/5 text-gray-500 border-white/5'
            }`}
          >
            Tất Cả
          </button>
          <button 
            onClick={() => setSettleType('PRINCIPAL')}
            className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border ${
              settleType === 'PRINCIPAL' 
                ? 'bg-[#ff8c00] text-black border-[#ff8c00] shadow-lg shadow-orange-500/20' 
                : 'bg-white/5 text-gray-500 border-white/5'
            }`}
          >
            Vay Gốc
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {showHelp ? (
            <div className="h-full bg-[#ff8c00]/5 border border-[#ff8c00]/20 rounded-2xl p-4 animate-in fade-in zoom-in duration-300 space-y-2 overflow-y-auto custom-scrollbar">
               <div className="flex items-center gap-2">
                  <Info size={14} className="text-[#ff8c00]" />
                  <span className="text-[9px] font-black text-[#ff8c00] uppercase tracking-widest">Hướng dẫn tất toán</span>
               </div>
               <div className="space-y-2">
                  {[
                    "Chọn hình thức: Tất cả (Gốc + Phí) hoặc Vay Gốc (Chỉ Phí).",
                    "Chuyển khoản chính xác Số tiền và Nội dung hiển thị trên mã QR.",
                    "Nhập Mã giao dịch (FT...) để hệ thống xác thực tự động.",
                    "Tải ảnh Biên lai (Bill) rõ nét để hoàn tất thủ tục."
                  ].map((text, idx) => (
                    <div key={idx} className="flex gap-2">
                      <div className="w-3.5 h-3.5 bg-[#ff8c00] rounded-full flex items-center justify-center shrink-0 font-black text-[8px] text-black">{idx + 1}</div>
                      <p className="text-[8px] font-bold text-gray-300 leading-tight">{text}</p>
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto custom-scrollbar space-y-4 pr-1">
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
                    onClick={() => copyToClipboard(currentAmount.toString())}
                    className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-2xl border border-gray-100 active:bg-gray-100 transition-all"
                  >
                    <Landmark size={14} className="text-[#ff8c00]" />
                    <span className="text-[7px] font-black text-gray-500 uppercase">Copy Tiền</span>
                  </button>
                  <button 
                    onClick={() => copyToClipboard(content)}
                    className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-2xl border border-gray-100 active:bg-gray-100 transition-all"
                  >
                    <FileText size={14} className="text-[#ff8c00]" />
                    <span className="text-[7px] font-black text-gray-500 uppercase">Copy ND</span>
                  </button>
                </div>

                <div className="w-full pt-3 border-t border-gray-100 mt-1">
                  <p className="text-[6px] font-bold text-gray-300 uppercase text-center tracking-widest">
                    Ngân hàng số Timo - Ngân hàng TMCP Bản Việt
                  </p>
                  <p className="text-[8px] font-black text-black uppercase text-center mt-1">DO TRUNG NGON • 0877203996</p>
                </div>
              </div>

              {/* Verification Section */}
              <div className="bg-[#111111] border border-white/5 rounded-[32px] p-6 flex flex-col gap-5 shadow-2xl">
                 <div className="flex flex-col gap-5">
                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-400">
                             <ShieldCheck size={16} className="text-[#ff8c00]" />
                             <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Xác minh giao dịch</h3>
                          </div>
                          <span className="text-[7px] font-bold text-gray-600 uppercase">Bắt buộc</span>
                       </div>
                       <div className="relative group">
                          <input 
                            type="text" 
                            value={bankTransactionId}
                            onChange={(e) => setBankTransactionId(e.target.value)}
                            placeholder="Nhập mã giao dịch (FT... / Mã tham chiếu)"
                            className={`w-full bg-black/60 border rounded-2xl py-4 px-5 text-xs font-bold text-white focus:outline-none transition-all placeholder:text-gray-700 group-hover:border-white/20 ${
                               isDuplicateTransaction ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-[#ff8c00]/50'
                             }`}
                          />
                          <div className={`absolute right-5 top-1/2 -translate-y-1/2 ${isDuplicateTransaction ? 'text-red-500' : 'text-gray-600'}`}>
                            {isDuplicateTransaction ? <AlertCircle size={18} /> : <FileCheck size={18} />}
                          </div>
                          
                          {isDuplicateTransaction && (
                            <div className="absolute left-0 -bottom-10 w-full z-10 animate-in slide-in-from-top-2 duration-300">
                              <div className="bg-red-600 text-white px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 border border-red-500/50">
                                <AlertCircle size={12} />
                                Mã giao dịch này đã được sử dụng trước đó!
                              </div>
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-400">
                             <Camera size={16} className="text-[#ff8c00]" />
                             <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Tải ảnh biên lai</h3>
                          </div>
                          <span className="text-[7px] font-bold text-gray-600 uppercase">Minh chứng</span>
                       </div>
                       <div 
                         onClick={() => document.getElementById('billInputSettle')?.click()}
                         className={`w-full aspect-video rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer relative overflow-hidden transition-all min-h-[160px] ${billImage ? 'border-green-500 bg-green-500/5' : 'border-gray-800 bg-black hover:border-[#ff8c00]/30'}`}
                       >
                          <input id="billInputSettle" type="file" accept="image/*" hidden onChange={handleBillUpload} />
                          {billImage ? (
                            <>
                              <img src={billImage} className="w-full h-full object-cover opacity-60" />
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[3px]">
                                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-green-500/20 mb-3 animate-in zoom-in duration-300">
                                  <CheckCircle2 size={28} />
                                </div>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Biên lai đã tải lên</span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase mt-1.5 bg-white/5 px-3 py-1 rounded-full">Nhấn để thay đổi</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-gray-600 mb-1 group-hover:scale-110 transition-transform">
                                {isUploading ? <div className="animate-spin border-2 border-[#ff8c00] border-t-transparent w-7 h-7 rounded-full" /> : <UploadCloud size={28} />}
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Tải ảnh biên lai</p>
                                <p className="text-[8px] font-bold text-gray-600 uppercase mt-1.5">Chụp rõ Mã giao dịch & Số tiền</p>
                              </div>
                            </>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex-none">
          <button
            disabled={!billImage || isSubmitting || isGlobalProcessing}
            onClick={handleConfirmSettlement}
            className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${
              billImage && !isSubmitting && !isGlobalProcessing ? 'bg-[#ff8c00] text-black shadow-orange-950/20' : 'bg-white/5 text-gray-600 cursor-not-allowed opacity-50'
            }`}
          >
            {isSubmitting || isGlobalProcessing ? 'ĐANG XỬ LÝ...' : (billImage ? 'GỬI XÉT DUYỆT NGAY' : 'VUI LÒNG ĐÍNH KÈM BILL')}
          </button>
        </div>
      </div>
    );
  };

  const renderContract = () => (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-500 overflow-hidden">
      <div className="w-full p-3 flex items-center justify-between bg-black text-white border-b border-white/5 flex-none">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-orange-500/10 rounded-lg flex items-center justify-center text-[#ff8c00]">
            <Award size={16} />
          </div>
          <div>
            <h3 className="text-[9px] font-black uppercase tracking-widest leading-none">Phác thảo hợp đồng</h3>
            <p className="text-[6px] font-bold text-gray-500 uppercase mt-0.5 tracking-tighter">XÁC THỰC ĐIỆN TỬ NDV-SAFE</p>
          </div>
        </div>
        <button 
          onClick={() => setStep(LoanStep.SELECT_AMOUNT)}
          className="w-7 h-7 bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-white active:scale-90 transition-all"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 bg-black px-2 pt-1 pb-20 overflow-hidden flex flex-col">
        <div className="bg-white w-full rounded-2xl p-3 relative overflow-hidden shadow-2xl border border-gray-100 flex-1 flex flex-col">
          
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-[0.01] rotate-[-35deg] select-none space-y-8">
            <span className="text-3xl font-black whitespace-nowrap">NDV ORIGINAL DOCUMENT</span>
            <span className="text-3xl font-black whitespace-nowrap">AUTHENTIC SIGNING</span>
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
              <p className="text-[6px] font-bold text-gray-400 uppercase tracking-widest">Mã số: {nextContractId}</p>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100 my-2 relative z-10 flex-none"></div>

          <div className="flex-1 min-h-0 flex flex-col justify-between relative z-10 overflow-y-auto py-1">
            
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
                  <span className="text-[12px] font-black text-black">{selectedAmount.toLocaleString()} đ</span>
                </div>
                <div className="h-6 w-px bg-gray-200"></div>
                <div className="flex flex-col items-end">
                  <span className="text-[7px] font-black text-orange-500 uppercase tracking-wider">Thực nhận</span>
                  <span className="text-[12px] font-black text-orange-600">{(selectedAmount * 0.85).toLocaleString()} đ</span>
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
                    <span className="text-[10px] font-black text-black">{dueDate}</span>
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

                <div className="flex flex-col items-center space-y-0.5">
                  <p className="text-[5px] font-black text-gray-400 uppercase tracking-widest">Người vay Bên B</p>
                  <div className="w-full aspect-[16/9] bg-gray-50 border border-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                    <SignaturePad onSign={setSignatureData} />
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

      <div className="fixed bottom-0 left-0 right-0 p-3 bg-black flex gap-2 z-[110] border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex-none">
        <button 
          onClick={() => setStep(LoanStep.SELECT_AMOUNT)}
          className="flex-1 py-3.5 rounded-xl border border-white/10 text-white font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all"
        >
          Hủy bỏ
        </button>
        <button 
          onClick={handleConfirmSignature}
          disabled={!signatureData || isSubmitting || isGlobalProcessing}
          className={`flex-[1.5] py-3.5 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all shadow-xl ${
            signatureData && !isSubmitting && !isGlobalProcessing ? 'bg-[#ff8c00] text-black shadow-orange-950/20' : 'bg-white/5 text-gray-600 cursor-not-allowed opacity-50'
          }`}
        >
          {isSubmitting || isGlobalProcessing ? 'ĐANG GỬI...' : (signatureData ? 'Ký & Gửi hồ sơ' : 'Vui lòng ký tên')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full bg-black px-5 pt-4 overflow-x-hidden relative">
      {copyToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[1000] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-green-600 text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-2">
            <CheckCircle2 size={16} />
            Đã sao chép thành công
          </div>
        </div>
      )}

      {step === LoanStep.LIST && renderList()}
      {step === LoanStep.SELECT_AMOUNT && (<>{renderList()}{renderSelectAmount()}</>)}
      {step === LoanStep.CONTRACT && renderContract()}
      {step === LoanStep.SETTLE_DETAIL && renderSettleDetail()}
    </div>
  );
};

export default LoanApplication;