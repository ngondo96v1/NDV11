
import React, { useState } from 'react';
import { LoanRecord } from '../types';
import { 
  Search, 
  User, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

interface AdminLoanApprovalProps {
  loans: LoanRecord[];
  isGlobalProcessing: boolean;
  onAction: (loanId: string, action: 'APPROVE' | 'DISBURSE' | 'SETTLE' | 'REJECT', reason?: string) => Promise<void> | void;
  onBack: () => void;
}

const AdminLoanApproval: React.FC<AdminLoanApprovalProps> = ({ loans, isGlobalProcessing, onAction, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [rejectingLoanId, setRejectingLoanId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Nhóm các khoản vay theo User
  const groupedLoans: Record<string, { name: string; loans: LoanRecord[] }> = {};
  
  loans.forEach(loan => {
    const uid = loan.userId || 'unknown';
    if (!groupedLoans[uid]) {
      groupedLoans[uid] = { name: loan.userName || 'ẨN DANH', loans: [] };
    }
    groupedLoans[uid].loans.push(loan);
  });

  // Sort loans within each group
  Object.values(groupedLoans).forEach(group => {
    group.loans.sort((a, b) => {
      const getPriority = (status: string) => {
        switch (status) {
          case 'CHỜ DUYỆT': return 1;
          case 'CHỜ TẤT TOÁN': return 2;
          case 'ĐÃ DUYỆT': return 3;
          case 'ĐANG GIẢI NGÂN': return 4;
          case 'ĐANG NỢ': return 5;
          case 'ĐANG ĐỐI SOÁT': return 6;
          case 'ĐÃ TẤT TOÁN': return 10;
          case 'BỊ TỪ CHỐI': return 11;
          default: return 7;
        }
      };
      const priorityA = getPriority(a.status);
      const priorityB = getPriority(b.status);
      if (priorityA !== priorityB) return priorityA - priorityB;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
  });

  const users = Object.keys(groupedLoans)
    .filter(uid => 
      groupedLoans[uid].name.toLowerCase().includes(searchTerm.toLowerCase()) || uid.includes(searchTerm)
    )
    .sort((a, b) => {
      const countA = groupedLoans[a].loans.filter(l => l.status === 'CHỜ DUYỆT' || l.status === 'CHỜ TẤT TOÁN').length;
      const countB = groupedLoans[b].loans.filter(l => l.status === 'CHỜ DUYỆT' || l.status === 'CHỜ TẤT TOÁN').length;
      if (countA !== countB) return countB - countA;
      return groupedLoans[b].name.localeCompare(groupedLoans[a].name);
    });

  const pendingApprovalCount = loans.filter(l => l.status === 'CHỜ DUYỆT').length;
  const pendingSettlementCount = loans.filter(l => l.status === 'CHỜ TẤT TOÁN').length;

  const getStatusStyles = (status: string, isOverdue: boolean) => {
    if (isOverdue) return 'bg-red-500/10 text-red-500';
    switch (status) {
      case 'CHỜ DUYỆT': return 'bg-orange-500/10 text-orange-500';
      case 'ĐÃ DUYỆT': return 'bg-blue-500/10 text-blue-500';
      case 'ĐANG GIẢI NGÂN': return 'bg-cyan-500/10 text-cyan-500';
      case 'ĐANG NỢ': return 'bg-orange-600/10 text-orange-600';
      case 'CHỜ TẤT TOÁN': return 'bg-indigo-500/10 text-indigo-500';
      case 'ĐÃ TẤT TOÁN': return 'bg-green-500/10 text-green-500';
      case 'BỊ TỪ CHỐI': return 'bg-gray-500/10 text-gray-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="w-full bg-black min-h-screen px-5 pb-24 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 pt-8 mb-6">
        <button onClick={onBack} className="text-white bg-white/5 p-1.5 rounded-full active:scale-90 transition-all">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-xl font-black text-white uppercase tracking-tighter">DUYỆT VAY & TẤT TOÁN</h1>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-6">
        <div className="bg-orange-500/10 border border-orange-500/20 px-3 py-2.5 rounded-xl flex flex-col gap-0.5">
          <span className="text-[7px] font-black text-orange-500 uppercase tracking-widest opacity-60">Chờ duyệt vay</span>
          <span className="text-lg font-black text-orange-500">{pendingApprovalCount}</span>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-2.5 rounded-xl flex flex-col gap-0.5">
          <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest opacity-60">Chờ tất toán</span>
          <span className="text-lg font-black text-blue-500">{pendingSettlementCount}</span>
        </div>
      </div>

      <div className="relative mb-6">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
          <Search size={18} />
        </div>
        <input 
          type="text"
          placeholder="Tìm khách hàng hoặc mã HĐ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#111111] border border-white/5 rounded-xl py-4 pl-12 pr-5 text-xs font-bold text-white focus:outline-none focus:border-orange-500/30 transition-all"
        />
      </div>

      <div className="space-y-4">
        {users.length === 0 ? (
          <div className="py-16 text-center opacity-30">
            <p className="text-[10px] font-black uppercase tracking-widest">Chưa có dữ liệu giao dịch</p>
          </div>
        ) : (
          users.map(uid => {
            const userGroup = groupedLoans[uid];
            const isExpanded = expandedUserId === uid;
            const notificationCount = userGroup.loans.filter(l => l.status === 'CHỜ DUYỆT' || l.status === 'CHỜ TẤT TOÁN').length;

            return (
              <div key={uid} className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
                <div 
                  onClick={() => setExpandedUserId(isExpanded ? null : uid)}
                  className="p-4 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1a1a1e] rounded-lg flex items-center justify-center text-[#ff8c00]">
                      < User size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white uppercase">{userGroup.name}</h3>
                      <p className="text-[8px] font-bold text-gray-500 uppercase">ID: {uid}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {notificationCount > 0 && (
                      <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                         <span className="text-[9px] font-black text-white">{notificationCount}</span>
                      </div>
                    )}
                    <div className="text-gray-500">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="w-full h-px bg-white/5"></div>
                    {userGroup.loans.map(loan => {
                      const today = new Date();
                      const [d, m, y] = loan.date.split('/').map(Number);
                      const dueDate = new Date(y, m - 1, d);
                      const isOverdue = (loan.status === 'ĐANG NỢ' || loan.status === 'CHỜ TẤT TOÁN') && dueDate < today;
                      const statusStyles = getStatusStyles(loan.status, isOverdue);

                      return (
                        <div key={loan.id} className={`bg-black/40 border rounded-2xl p-4 space-y-3 ${isOverdue ? 'border-red-600/30 ring-1 ring-red-600/10' : 'border-white/5'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{loan.id}</p>
                              <h4 className="text-base font-black text-white">{loan.amount.toLocaleString()} đ</h4>
                              {loan.status === 'ĐÃ DUYỆT' && (
                                <div className="mt-1 flex items-center gap-1.5">
                                  <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Thực nhận (85%):</span>
                                  <span className="text-[10px] font-black text-green-500">{(loan.amount * 0.85).toLocaleString()} đ</span>
                                </div>
                              )}
                            </div>
                            <span className={`text-[7px] font-black px-2 py-0.5 rounded-md uppercase ${statusStyles}`}>
                              {isOverdue ? 'QUÁ HẠN' : loan.status}
                            </span>
                          </div>

                          {loan.status === 'CHỜ TẤT TOÁN' && (
                            <div className="space-y-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <ImageIcon size={12} className="text-blue-500" />
                                  <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Bill Đối Soát Tất Toán</span>
                                </div>
                                {loan.settlementType && (
                                  <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${loan.settlementType === 'ALL' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                    {loan.settlementType === 'ALL' ? 'Tất Cả' : 'Vay Gốc'}
                                  </span>
                                )}
                              </div>
                              {loan.bankTransactionId && (
                                <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-white/5">
                                  <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Mã giao dịch:</span>
                                  <span className="text-[9px] font-black text-[#ff8c00] tracking-wider">{loan.bankTransactionId}</span>
                                </div>
                              )}
                              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden border border-white/5">
                                {loan.billImage ? (
                                  <img src={loan.billImage} className="w-full h-full object-cover" alt="Bill tất toán" />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-800 gap-1.5">
                                      <Clock size={18} />
                                      <span className="text-[7px] font-black uppercase">Thiếu minh chứng bill</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-1.5">
                            {loan.status === 'CHỜ DUYỆT' && (
                              <div className="flex flex-col gap-1.5 w-full">
                                <div className="flex gap-1.5">
                                  <button 
                                    onClick={async () => {
                                      if (isProcessing || isGlobalProcessing) return;
                                      setIsProcessing(loan.id);
                                      await onAction(loan.id, 'APPROVE');
                                      setIsProcessing(null);
                                    }}
                                    disabled={!!isProcessing || isGlobalProcessing}
                                    className={`flex-1 bg-[#ff8c00] text-black py-2.5 rounded-lg font-black text-[9px] uppercase active:scale-95 transition-all ${isProcessing === loan.id || isGlobalProcessing ? 'opacity-50' : ''}`}
                                  >
                                    {isProcessing === loan.id || isGlobalProcessing ? 'Đang duyệt...' : 'Duyệt vay'}
                                  </button>
                                  <button 
                                    onClick={() => setRejectingLoanId(rejectingLoanId === loan.id ? null : loan.id)}
                                    disabled={!!isProcessing || isGlobalProcessing}
                                    className={`flex-1 py-2.5 rounded-lg font-black text-[9px] uppercase active:scale-95 transition-all flex items-center justify-center gap-1.5 ${rejectingLoanId === loan.id ? 'bg-red-600 text-white' : 'bg-white/5 border border-white/10 text-red-500'} ${isProcessing || isGlobalProcessing ? 'opacity-50' : ''}`}
                                  >
                                    <XCircle size={12} /> {rejectingLoanId === loan.id ? 'Hủy' : 'Từ chối'}
                                  </button>
                                </div>
                                {rejectingLoanId === loan.id && (
                                  <div className="grid grid-cols-2 gap-1.5 animate-in slide-in-from-top-2 duration-200">
                                    {[
                                      "Hồ sơ không đạt",
                                      "Thông tin sai lệch",
                                      "Nợ xấu hệ thống",
                                      "Vượt quá hạn mức",
                                      "Chữ ký không khớp",
                                      "Nghi vấn giả mạo"
                                    ].map((reason) => (
                                      <button 
                                        key={reason}
                                        onClick={async () => { 
                                          if (isProcessing || isGlobalProcessing) return;
                                          setIsProcessing(loan.id);
                                          await onAction(loan.id, 'REJECT', reason);
                                          setRejectingLoanId(null);
                                          setIsProcessing(null);
                                        }}
                                        disabled={!!isProcessing || isGlobalProcessing}
                                        className="bg-red-500/10 text-red-500/70 py-1.5 rounded-md font-bold text-[7px] uppercase border border-red-500/10 hover:bg-red-500/20 transition-all"
                                      >
                                        {reason}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            {loan.status === 'ĐÃ DUYỆT' && (
                              <div className="flex flex-col gap-2">
                                <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-2.5">
                                  <p className="text-[7px] font-bold text-gray-400 uppercase leading-relaxed">
                                    <span className="text-green-500">Lưu ý:</span> Hệ thống sẽ trừ <span className="text-white">85%</span> giá trị khoản vay vào ngân sách. Admin vui lòng chuyển khoản thủ công số tiền <span className="text-white font-black">{(loan.amount * 0.85).toLocaleString()} đ</span> cho khách hàng.
                                  </p>
                                </div>
                                <button 
                                  onClick={async () => {
                                    if (isProcessing || isGlobalProcessing) return;
                                    setIsProcessing(loan.id);
                                    await onAction(loan.id, 'DISBURSE');
                                    setIsProcessing(null);
                                  }}
                                  disabled={!!isProcessing || isGlobalProcessing}
                                  className={`w-full bg-green-600 text-white py-2.5 rounded-lg font-black text-[9px] uppercase active:scale-95 transition-all ${isProcessing === loan.id || isGlobalProcessing ? 'opacity-50' : ''}`}
                                >
                                  {isProcessing === loan.id || isGlobalProcessing ? 'Đang giải ngân...' : 'Xác nhận đã giải ngân'}
                                </button>
                              </div>
                            )}
                            {loan.status === 'CHỜ TẤT TOÁN' && (
                              <div className="flex flex-col gap-1.5 w-full">
                                <div className="flex gap-1.5">
                                  <button 
                                    onClick={async () => {
                                      if (isProcessing || isGlobalProcessing) return;
                                      setIsProcessing(loan.id);
                                      await onAction(loan.id, 'SETTLE');
                                      setIsProcessing(null);
                                    }}
                                    disabled={!!isProcessing || isGlobalProcessing}
                                    className={`flex-1 bg-green-600 text-white py-2.5 rounded-lg font-black text-[9px] uppercase active:scale-95 transition-all flex items-center justify-center gap-1.5 ${isProcessing === loan.id || isGlobalProcessing ? 'opacity-50' : ''}`}
                                  >
                                    <CheckCircle2 size={12} /> {isProcessing === loan.id || isGlobalProcessing ? 'Đang xác nhận...' : 'Xác nhận bill'}
                                  </button>
                                  <button 
                                    onClick={() => setRejectingLoanId(rejectingLoanId === loan.id ? null : loan.id)}
                                    disabled={!!isProcessing || isGlobalProcessing}
                                    className={`flex-1 py-2.5 rounded-lg font-black text-[9px] uppercase active:scale-95 transition-all flex items-center justify-center gap-1.5 ${rejectingLoanId === loan.id ? 'bg-red-600 text-white' : 'bg-white/5 border border-white/10 text-red-500'} ${isProcessing || isGlobalProcessing ? 'opacity-50' : ''}`}
                                  >
                                    <XCircle size={12} /> {rejectingLoanId === loan.id ? 'Hủy' : 'Từ chối'}
                                  </button>
                                </div>
                                
                                {rejectingLoanId === loan.id && (
                                  <div className="grid grid-cols-2 gap-1.5 animate-in slide-in-from-top-2 duration-200">
                                    {[
                                      "Bill không hợp lệ",
                                      "Sai nội dung",
                                      "Sai số tiền",
                                      "Ảnh mờ/Lỗi",
                                      "Giao dịch chưa khớp",
                                      "Bill giả mạo"
                                    ].map((reason) => (
                                      <button 
                                        key={reason}
                                        onClick={async () => { 
                                          if (isProcessing || isGlobalProcessing) return;
                                          setIsProcessing(loan.id);
                                          await onAction(loan.id, 'REJECT', reason);
                                          setRejectingLoanId(null);
                                          setIsProcessing(null);
                                        }}
                                        disabled={!!isProcessing || isGlobalProcessing}
                                        className="bg-red-500/10 text-red-500/70 py-1.5 rounded-md font-bold text-[7px] uppercase border border-red-500/10 hover:bg-red-500/20 transition-all"
                                      >
                                        {reason}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminLoanApproval;
