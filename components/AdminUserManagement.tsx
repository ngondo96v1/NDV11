// Admin management component for users and loans
import React, { useState } from 'react';
import { User as UserType, LoanRecord } from '../types';
import { 
  Search, 
  User, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  TrendingUp, 
  Hash, 
  Phone, 
  Image as ImageIcon,
  Users,
  MapPin,
  Calendar,
  ChevronLeft,
  FileText,
  CheckCircle2,
  Briefcase,
  Clock,
  Eye,
  Coins,
  ArrowDownToLine,
  AlertTriangle,
  ChevronRight,
  History,
  Camera,
  Trash2,
  X,
  AlertCircle,
  RefreshCcw,
  CheckCircle,
  XCircle,
  Landmark,
  Copy,
  Check,
  Maximize2,
  Download
} from 'lucide-react';
import ContractModal from './ContractModal';

interface AdminUserManagementProps {
  users: UserType[];
  loans: LoanRecord[];
  isGlobalProcessing: boolean;
  onAction: (userId: string, action: 'APPROVE_RANK' | 'REJECT_RANK') => Promise<void> | void;
  onLoanAction: (loanId: string, action: 'APPROVE' | 'DISBURSE' | 'SETTLE' | 'REJECT', reason?: string) => Promise<void> | void;
  onDeleteUser: (userId: string) => void;
  onAutoCleanup: () => Promise<number>;
  onBack: () => void;
}

const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ users, loans, isGlobalProcessing, onAction, onLoanAction, onDeleteUser, onAutoCleanup, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Record<string, 'INFO' | 'LOANS'>>({});
  const [showAllLoansAdmin, setShowAllLoansAdmin] = useState<Record<string, boolean>>({});
  const [selectedContract, setSelectedContract] = useState<{ loan: LoanRecord, owner: UserType } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
  const [cleanupResultCount, setCleanupResultCount] = useState<number | null>(null);
  const [rejectingLoanId, setRejectingLoanId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterPendingOnly, setFilterPendingOnly] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getUserNotificationCount = (userId: string) => {
    const user = users.find(u => u.id === userId);
    const userLoans = loans.filter(l => l.userId === userId);
    
    let count = 0;
    count += userLoans.filter(l => l.status === 'CHỜ DUYỆT' || l.status === 'CHỜ TẤT TOÁN').length;
    if (user?.pendingUpgradeRank) count += 1;
    
    return count;
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.phone.includes(searchTerm) ||
      u.id.includes(searchTerm);
    
    if (!matchesSearch) return false;
    if (filterPendingOnly) return getUserNotificationCount(u.id) > 0;
    return true;
  }).sort((a, b) => {
    const countA = getUserNotificationCount(a.id);
    const countB = getUserNotificationCount(b.id);
    if (countA !== countB) return countB - countA;
    return a.fullName.localeCompare(b.fullName);
  });

  const isUserBadDebt = (userId: string) => {
    const userLoans = loans.filter(l => l.userId === userId && (l.status === 'ĐANG NỢ' || l.status === 'CHỜ TẤT TOÁN'));
    const today = new Date();
    return userLoans.some(l => {
      const [d, m, y] = l.date.split('/').map(Number);
      const dueDate = new Date(y, m - 1, d);
      return dueDate < today;
    });
  };

  const getRankName = (rank: string) => {
    switch(rank) {
      case 'standard': return 'TIÊU CHUẨN';
      case 'bronze': return 'HẠNG ĐỒNG';
      case 'silver': return 'HẠNG BẠC';
      case 'gold': return 'HẠNG VÀNG';
      case 'diamond': return 'KIM CƯƠNG';
      default: return 'TIÊU CHUẨN';
    }
  };

  const getStatusStyles = (status: string, isOverdue: boolean) => {
    if (isOverdue) return 'bg-red-500/20 text-red-500';
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

  const handleToggleUser = (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
    } else {
      setExpandedUserId(userId);
      if (!activeSection[userId]) {
        setActiveSection(prev => ({ ...prev, [userId]: 'INFO' }));
      }
    }
  };

  const toggleShowAllLoans = (userId: string) => {
    setShowAllLoansAdmin(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleDeleteConfirm = () => {
    if (confirmDeleteId) {
      onDeleteUser(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  const handleCleanupConfirm = async () => {
    const count = await onAutoCleanup();
    setCleanupResultCount(count);
    setShowCleanupConfirm(false);
  };

  return (
    <div className="w-full bg-[#0a0a0a] px-5 pb-10 animate-in fade-in duration-500 relative">
      <div className="flex items-center justify-between pt-6 mb-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 bg-[#16161a] border border-white/5 rounded-full flex items-center justify-center text-white active:scale-90">
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-xl font-black text-white uppercase tracking-tighter">QUẢN LÝ KHÁCH HÀNG</h1>
        </div>
        <button 
          onClick={() => setShowCleanupConfirm(true)}
          className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 hover:bg-white/10 transition-colors active:scale-95"
          title="Dọn dẹp tự động (60 ngày)"
        >
           <RefreshCcw size={12} className="text-[#ff8c00]" />
           <span className="text-[8px] font-black text-white uppercase tracking-widest">Dọn dẹp</span>
        </button>
      </div>

      <div className="relative mb-6 flex gap-2">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
            <Search size={18} />
          </div>
          <input 
            type="text"
            placeholder="Tìm Tên, Số Zalo hoặc ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111111] border border-white/5 rounded-2xl py-4 pl-12 pr-5 text-xs font-bold text-white placeholder-gray-600 focus:outline-none focus:border-white/20 transition-all"
          />
        </div>
        <button 
          onClick={() => setFilterPendingOnly(!filterPendingOnly)}
          className={`px-4 rounded-2xl border transition-all flex items-center gap-2 ${filterPendingOnly ? 'bg-[#ff8c00] border-[#ff8c00] text-black' : 'bg-[#111111] border-white/5 text-gray-500'}`}
        >
          <Clock size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Chờ duyệt</span>
          {users.filter(u => getUserNotificationCount(u.id) > 0).length > 0 && !filterPendingOnly && (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </button>
      </div>

      <div className="space-y-3">
        {filteredUsers.map((u) => {
          const notificationCount = getUserNotificationCount(u.id);
          const isExpanded = expandedUserId === u.id;
          const userLoans = [...loans]
            .filter(l => l.userId === u.id)
            .sort((a, b) => {
              // Status priority mapping (lower number = higher priority)
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

              if (priorityA !== priorityB) {
                return priorityA - priorityB;
              }
              
              // If same priority, sort by updatedAt descending
              if (a.updatedAt !== b.updatedAt) {
                return (b.updatedAt || 0) - (a.updatedAt || 0);
              }

              // Fallback to parsing createdAt
              const parseCreatedAt = (str: string) => {
                try {
                  const [time, date] = str.split(' ');
                  const [h, m, s] = time.split(':').map(Number);
                  const [d, mo, y] = date.split('/').map(Number);
                  return new Date(y, mo - 1, d, h, m, s).getTime();
                } catch (e) {
                  return 0;
                }
              };
              return parseCreatedAt(b.createdAt) - parseCreatedAt(a.createdAt);
            });
          const currentSection = activeSection[u.id] || 'INFO';
          const badDebt = isUserBadDebt(u.id);
          const showAll = showAllLoansAdmin[u.id] || false;
          const displayedUserLoans = showAll ? userLoans : userLoans.slice(0, 3);

          const disbursedLoans = userLoans.filter(l => 
            ['ĐANG NỢ', 'CHỜ TẤT TOÁN', 'ĐANG GIẢI NGÂN', 'ĐANG ĐỐI SOÁT'].includes(l.status)
          );
          const tongThucThu = disbursedLoans.reduce((sum, l) => sum + l.amount + (l.fine || 0), 0);

          return (
            <div key={u.id} className={`bg-[#111111] border rounded-3xl overflow-hidden relative shadow-lg transition-all ${badDebt ? 'border-red-600/50 ring-1 ring-red-600/20' : 'border-white/5'}`}>
              <div 
                onClick={() => handleToggleUser(u.id)}
                className="cursor-pointer active:bg-white/[0.01] transition-all"
              >
                <div className="p-4 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-[#1a1a1e] rounded-xl flex items-center justify-center text-gray-500 border border-white/5 relative">
                      <User size={20} className={isExpanded ? 'text-[#ff8c00]' : ''} />
                      {notificationCount > 0 && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center border-2 border-[#111111] shadow-lg">
                          <span className="text-[9px] font-black text-white">{notificationCount}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="text-sm font-black text-white tracking-tight uppercase leading-none">{u.fullName}</h3>
                        {badDebt && (
                          <div className="flex items-center gap-1 bg-red-600 px-1.5 py-0.5 rounded-md animate-pulse">
                            <AlertTriangle size={8} className="text-white" />
                            <span className="text-[7px] font-black text-white uppercase tracking-tighter">NỢ XẤU</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[8px] font-bold text-gray-600 tracking-widest uppercase">MÃ KHÁCH: {u.id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-gray-500">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                <div className="mx-3 mb-3 bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-gray-600">
                      <Coins size={18} />
                    </div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">TỔNG THỰC THU:</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-white tracking-tight leading-none mb-1">{tongThucThu.toLocaleString()} đ</p>
                    <p className="text-[6px] font-black text-gray-600 uppercase tracking-tighter">
                      (GỐC + PHẠT TRÊN DƯ NỢ)
                    </p>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-8 space-y-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex gap-1.5 p-1 bg-black/40 rounded-xl mx-1 border border-white/5">
                    <button 
                      onClick={() => setActiveSection(prev => ({ ...prev, [u.id]: 'INFO' }))}
                      className={`flex-1 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${currentSection === 'INFO' ? 'bg-[#ff8c00] text-black shadow-lg shadow-orange-500/10' : 'text-gray-500'}`}
                    >
                      <FileText size={12} /> Thông tin
                    </button>
                    <button 
                      onClick={() => setActiveSection(prev => ({ ...prev, [u.id]: 'LOANS' }))}
                      className={`flex-1 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 relative ${currentSection === 'LOANS' ? 'bg-[#ff8c00] text-black shadow-lg shadow-orange-500/10' : 'text-gray-500'}`}
                    >
                      <Briefcase size={12} /> Khoản vay
                    </button>
                  </div>

                  {currentSection === 'INFO' ? (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      {u.pendingUpgradeRank && (
                        <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 space-y-4">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                 <ShieldCheck size={18} className="text-[#ff8c00]" />
                                 <div>
                                    <h4 className="text-[9px] font-black text-[#ff8c00] uppercase tracking-widest">Nâng hạng</h4>
                                    <p className="text-xs font-black text-white uppercase">{getRankName(u.pendingUpgradeRank)}</p>
                                 </div>
                              </div>
                           </div>
                           <div className="aspect-video w-full bg-black rounded-xl border border-white/5 overflow-hidden group/img relative cursor-zoom-in" onClick={() => u.rankUpgradeBill && setZoomImage(u.rankUpgradeBill)}>
                              {u.rankUpgradeBill ? (
                                <>
                                  <img src={u.rankUpgradeBill} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" alt="Upgrade bill" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                                      <Maximize2 size={20} />
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-800 text-[7px] font-black uppercase">Thiếu bill</div>
                              )}
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              <button 
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (isGlobalProcessing) return;
                                  await onAction(u.id, 'APPROVE_RANK');
                                }} 
                                disabled={isGlobalProcessing}
                                className={`py-3.5 bg-[#ff8c00] text-black font-black text-[9px] uppercase rounded-lg flex items-center justify-center gap-1.5 ${isGlobalProcessing ? 'opacity-50' : ''}`}
                              >
                                {isGlobalProcessing ? 'Đang xử lý...' : 'Duyệt hạng'}
                              </button>
                              <button 
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (isGlobalProcessing) return;
                                  await onAction(u.id, 'REJECT_RANK');
                                }} 
                                disabled={isGlobalProcessing}
                                className={`py-3.5 bg-white/5 border border-white/10 text-gray-500 font-black text-[9px] uppercase rounded-lg ${isGlobalProcessing ? 'opacity-50' : ''}`}
                              >
                                {isGlobalProcessing ? '...' : 'Từ chối'}
                              </button>
                           </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-y-8 px-1">
                        <div className="space-y-0.5"><div className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-[#ff8c00]" /><p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Hạng</p></div><p className="text-xs font-black text-[#ff8c00] uppercase">{getRankName(u.rank)}</p></div>
                        <div className="space-y-0.5"><div className="flex items-center gap-1.5"><TrendingUp size={12} className="text-[#ff8c00]" /><p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Hạn mức</p></div><p className="text-xs font-black text-white">{(u.totalLimit || 0).toLocaleString()} đ</p></div>
                        <div className="space-y-0.5"><div className="flex items-center gap-1.5"><Hash size={12} className="text-[#ff8c00]" /><p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">CCCD</p></div><p className="text-xs font-black text-white">{u.idNumber}</p></div>
                        <div className="space-y-0.5"><div className="flex items-center gap-1.5"><Phone size={12} className="text-[#ff8c00]" /><p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Zalo</p></div><p className="text-xs font-black text-white">{u.phone}</p></div>
                        <div className="space-y-0.5"><div className="flex items-center gap-1.5"><Users size={12} className="text-[#ff8c00]" /><p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Tham chiếu</p></div><p className="text-xs font-black text-white truncate">{u.refZalo || 'CHƯA CẬP NHẬT'}</p></div>
                        <div className="space-y-0.5"><div className="flex items-center gap-1.5"><MapPin size={12} className="text-[#ff8c00]" /><p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Địa chỉ</p></div><p className="text-[11px] font-black text-white leading-tight line-clamp-2">{u.address || 'CHƯA CẬP NHẬT'}</p></div>
                      </div>

                      <div className="space-y-4 px-1 pt-5 border-t border-white/5">
                        <div className="flex items-center gap-1.5 text-[#ff8c00]">
                          <Camera size={16} />
                          <h4 className="text-[9px] font-black uppercase tracking-widest">Hồ sơ CCCD gốc</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest ml-0.5">Mặt trước</p>
                            <div className="aspect-video w-full bg-black rounded-xl border border-white/5 overflow-hidden flex items-center justify-center group/img relative cursor-zoom-in" onClick={() => u.idFront && setZoomImage(u.idFront)}>
                              {u.idFront ? (
                                <>
                                  <img src={u.idFront} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" alt="CCCD Front" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                                      <Maximize2 size={20} />
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <ImageIcon size={20} className="text-gray-900" />
                              )}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest ml-0.5">Mặt sau</p>
                            <div className="aspect-video w-full bg-black rounded-xl border border-white/5 overflow-hidden flex items-center justify-center group/img relative cursor-zoom-in" onClick={() => u.idBack && setZoomImage(u.idBack)}>
                              {u.idBack ? (
                                <>
                                  <img src={u.idBack} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" alt="CCCD Back" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                                      <Maximize2 size={20} />
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <ImageIcon size={20} className="text-gray-900" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 px-1 pt-5 border-t border-white/5">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-gray-600"><Calendar size={12} /><span className="text-[7px] font-black uppercase">Gia nhập: {u.joinDate || '--'}</span></div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setConfirmDeleteId(u.id)}
                                className="px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-lg text-[9px] font-black uppercase text-red-600 active:scale-95 transition-all flex items-center gap-1.5"
                              >
                                <Trash2 size={12} /> Xóa User
                              </button>
                            </div>
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-in fade-in duration-300">
                       <div className="flex justify-between items-center px-1 mb-1.5">
                          <div className="flex items-center gap-1.5 text-gray-500">
                             <History size={12} />
                             <span className="text-[9px] font-black uppercase tracking-widest">Lịch sử giao dịch</span>
                          </div>
                          {userLoans.length > 3 && (
                            <button 
                              onClick={() => toggleShowAllLoans(u.id)}
                              className="flex items-center gap-1 text-[8px] font-black text-[#ff8c00] uppercase tracking-widest hover:opacity-70 transition-opacity"
                            >
                              {showAll ? 'Thu gọn' : 'Xem tất cả'} <ChevronRight size={9} className={`transform transition-transform ${showAll ? '-rotate-90' : ''}`} />
                            </button>
                          )}
                       </div>

                       {userLoans.length === 0 ? (
                         <div className="py-12 text-center space-y-2.5 opacity-30">
                            <Briefcase size={20} className="mx-auto" />
                            <p className="text-[9px] font-black uppercase tracking-widest">Chưa có hợp đồng vay nào</p>
                         </div>
                       ) : (
                         displayedUserLoans.map(loan => {
                           const [d, m, y] = loan.date.split('/').map(Number);
                           const isOverdue = (loan.status === 'ĐANG NỢ' || loan.status === 'CHỜ TẤT TOÁN') && new Date(y, m - 1, d) < new Date();
                           const statusStyles = getStatusStyles(loan.status, isOverdue);

                           return (
                             <div key={loan.id} className={`bg-black/40 border rounded-2xl p-4 space-y-4 shadow-inner ${isOverdue ? 'border-red-600/30 ring-1 ring-red-600/10' : 'border-white/5'}`}>
                                <div className="flex justify-between items-start">
                                   <div className="flex-1">
                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{loan.id}</p>
                                        <button onClick={() => setSelectedContract({ loan, owner: u })} className="w-5 h-5 bg-white/5 rounded-md flex items-center justify-center text-gray-500 hover:text-[#ff8c00]"><Eye size={12} /></button>
                                      </div>
                                      <h4 className="text-base font-black text-white leading-none">{loan.amount.toLocaleString()} đ</h4>
                                   </div>
                                   <div className={`px-2.5 py-1 rounded-lg text-[7px] font-black uppercase flex items-center gap-1 ${statusStyles}`}>
                                      {isOverdue ? 'QUÁ HẠN' : loan.status}
                                      {loan.status === 'CHỜ TẤT TOÁN' && (
                                        <span className="bg-white/20 px-1 rounded text-[6px] ml-1">
                                          {loan.settlementType === 'PRINCIPAL' ? 'VG' : 'TT'}
                                        </span>
                                      )}
                                   </div>
                                </div>

                                {loan.status === 'CHỜ TẤT TOÁN' && (
                                  <div className="space-y-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                                     <div className="flex items-center justify-between">
                                       <div className="flex items-center gap-1.5 text-blue-500"><ImageIcon size={12} /><span className="text-[8px] font-black uppercase tracking-widest">Bill Tất Toán</span></div>
                                       {loan.bankTransactionId && (
                                         <div className="flex items-center gap-1.5 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                                           <span className="text-[7px] font-black text-blue-400 uppercase tracking-tighter">Mã GD: {loan.bankTransactionId}</span>
                                           <button 
                                             onClick={() => handleCopy(loan.bankTransactionId || '', 'tx' + loan.id)}
                                             className="text-blue-400 hover:text-white"
                                           >
                                             <Copy size={8} />
                                           </button>
                                         </div>
                                       )}
                                     </div>
                                     <div className="aspect-video w-full bg-black rounded-lg overflow-hidden border border-white/5 group/img relative cursor-zoom-in" onClick={() => loan.billImage && setZoomImage(loan.billImage)}>
                                        {loan.billImage ? (
                                          <>
                                            <img src={loan.billImage} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" alt="Bill payment" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                                                <Maximize2 size={20} />
                                              </div>
                                            </div>
                                          </>
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center"><Clock size={14} className="text-gray-800" /></div>
                                        )}
                                     </div>
                                  </div>
                                )}

                                {['CHỜ DUYỆT', 'ĐÃ DUYỆT'].includes(loan.status) && (
                                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 space-y-2.5">
                                    <div className="flex items-center gap-1.5 text-blue-500">
                                      <Landmark size={12} />
                                      <h4 className="text-[8px] font-black uppercase tracking-widest">Tài khoản nhận tiền</h4>
                                    </div>
                                    {u.bankName ? (
                                      <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                          <span className="text-[6px] font-black text-gray-600 uppercase">Ngân hàng:</span>
                                          <span className="text-[8px] font-black text-white uppercase">{u.bankName}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-[6px] font-black text-gray-600 uppercase">Số tài khoản:</span>
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-black text-blue-400 tracking-widest">{u.bankAccountNumber}</span>
                                            <button 
                                              onClick={() => handleCopy(u.bankAccountNumber || '', u.id + loan.id)}
                                              className={`p-1 rounded-md transition-all ${copiedId === u.id + loan.id ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                                            >
                                              {copiedId === u.id + loan.id ? <Check size={9} /> : <Copy size={9} />}
                                            </button>
                                          </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-[6px] font-black text-gray-600 uppercase">Chủ tài khoản:</span>
                                          <span className="text-[8px] font-black text-white uppercase">{u.bankAccountHolder}</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-[7px] font-black text-red-500 uppercase text-center">Khách chưa cập nhật tài khoản</p>
                                    )}
                                  </div>
                                )}

                                <div className="space-y-4 pt-1">
                                  <div className="flex gap-1.5">
                                    {loan.status === 'CHỜ DUYỆT' && (
                                      <div className="flex flex-col gap-1.5 w-full">
                                        <div className="flex gap-1.5">
                                          <button 
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              if (isGlobalProcessing) return;
                                              await onLoanAction(loan.id, 'APPROVE');
                                            }} 
                                            disabled={isGlobalProcessing}
                                            className={`flex-1 bg-[#ff8c00] text-black py-3 rounded-lg font-black text-[9px] uppercase active:scale-95 transition-all ${isGlobalProcessing ? 'opacity-50' : ''}`}
                                          >
                                            {isGlobalProcessing ? 'Đang xử lý...' : 'Duyệt vay'}
                                          </button>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setRejectingLoanId(rejectingLoanId === loan.id ? null : loan.id);
                                            }} 
                                            disabled={isGlobalProcessing}
                                            className={`flex-1 py-3 rounded-lg font-black text-[9px] uppercase active:scale-95 transition-all flex items-center justify-center gap-1.5 ${rejectingLoanId === loan.id ? 'bg-red-600 text-white' : 'bg-white/5 border border-white/10 text-red-500'} ${isGlobalProcessing ? 'opacity-50' : ''}`}
                                          >
                                            <XCircle size={12} /> {rejectingLoanId === loan.id ? 'Hủy' : 'Từ chối'}
                                          </button>
                                        </div>
                                        {rejectingLoanId === loan.id && (
                                          <div className="grid grid-cols-2 gap-1.5 animate-in slide-in-from-top-2 duration-200">
                                            {["Hồ sơ không đạt", "Thông tin sai lệch", "Nợ xấu hệ thống", "Vượt quá hạn mức"].map((reason) => (
                                              <button 
                                                key={reason}
                                                onClick={async (e) => { 
                                                  e.stopPropagation();
                                                  if (isGlobalProcessing) return;
                                                  await onLoanAction(loan.id, 'REJECT', reason); 
                                                  setRejectingLoanId(null); 
                                                }}
                                                disabled={isGlobalProcessing}
                                                className={`bg-red-500/10 text-red-500/70 py-1.5 rounded-md font-bold text-[7px] uppercase border border-red-500/10 hover:bg-red-500/20 transition-all ${isGlobalProcessing ? 'opacity-50' : ''}`}
                                              >
                                                {reason}
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {loan.status === 'ĐÃ DUYỆT' && (
                                      <button 
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (isGlobalProcessing) return;
                                          await onLoanAction(loan.id, 'DISBURSE');
                                        }} 
                                        disabled={isGlobalProcessing}
                                        className={`w-full bg-green-600 text-white py-3 rounded-lg font-black text-[9px] uppercase active:scale-95 transition-all ${isGlobalProcessing ? 'opacity-50' : ''}`}
                                      >
                                        {isGlobalProcessing ? 'Đang xử lý...' : 'Giải ngân tiền'}
                                      </button>
                                    )}
                                    {loan.status === 'CHỜ TẤT TOÁN' && (
                                      <div className="flex flex-col gap-1.5 w-full">
                                        <div className="flex gap-1.5">
                                          <button 
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              if (isGlobalProcessing) return;
                                              await onLoanAction(loan.id, 'SETTLE');
                                            }} 
                                            disabled={isGlobalProcessing}
                                            className={`flex-1 bg-green-600 text-white py-3 rounded-lg font-black text-[9px] uppercase flex items-center justify-center gap-1.5 active:scale-95 transition-all ${isGlobalProcessing ? 'opacity-50' : ''}`}
                                          >
                                            <CheckCircle2 size={12} /> {isGlobalProcessing ? 'Đang xử lý...' : 'Duyệt bill'}
                                          </button>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setRejectingLoanId(rejectingLoanId === loan.id ? null : loan.id);
                                            }} 
                                            disabled={isGlobalProcessing}
                                            className={`flex-1 py-3 rounded-lg font-black text-[9px] uppercase active:scale-95 transition-all flex items-center justify-center gap-1.5 ${rejectingLoanId === loan.id ? 'bg-red-600 text-white' : 'bg-white/5 border border-white/10 text-red-500'} ${isGlobalProcessing ? 'opacity-50' : ''}`}
                                          >
                                            <XCircle size={12} /> {rejectingLoanId === loan.id ? 'Hủy' : 'Từ chối'}
                                          </button>
                                        </div>
                                        {rejectingLoanId === loan.id && (
                                          <div className="grid grid-cols-2 gap-1.5 animate-in slide-in-from-top-2 duration-200">
                                            {["Bill không hợp lệ", "Sai nội dung", "Sai số tiền", "Ảnh mờ/Lỗi"].map((reason) => (
                                              <button 
                                                key={reason}
                                                onClick={async (e) => { 
                                                  e.stopPropagation();
                                                  if (isGlobalProcessing) return;
                                                  await onLoanAction(loan.id, 'REJECT', reason); 
                                                  setRejectingLoanId(null); 
                                                }}
                                                disabled={isGlobalProcessing}
                                                className={`bg-red-500/10 text-red-500/70 py-1.5 rounded-md font-bold text-[7px] uppercase border border-red-500/10 hover:bg-red-500/20 transition-all ${isGlobalProcessing ? 'opacity-50' : ''}`}
                                              >
                                                {reason}
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {['CHỜ DUYỆT', 'ĐÃ DUYỆT'].includes(loan.status) && (
                                    <div className="flex flex-col items-center justify-center gap-1 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl">
                                      <div className="flex items-center gap-1.5">
                                        <ArrowDownToLine size={10} className="text-[#ff8c00]" />
                                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Số tiền Thực Giải ngân:</span>
                                      </div>
                                      <p className="text-xs font-black text-white tracking-tight">
                                        {(loan.amount * 0.85).toLocaleString()} VNĐ
                                      </p>
                                    </div>
                                  )}
                                </div>
                             </div>
                           );
                         })
                       )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="py-20 text-center space-y-4 opacity-30">
           <AlertTriangle size={32} className="mx-auto" />
           <p className="text-[10px] font-black uppercase tracking-widest">Không tìm thấy khách hàng</p>
        </div>
      )}

      {/* Confirmation Modal for Manual Delete */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#111111] border border-red-600/20 w-full max-w-sm rounded-[2.5rem] p-8 space-y-8 relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center text-red-600">
                 <AlertCircle size={32} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">XÓA NGƯỜI DÙNG?</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed px-4">
                  Bạn có chắc chắn muốn xóa vĩnh viễn khách hàng này cùng toàn bộ lịch sử vay? Thao tác này <span className="text-red-500 font-black">KHÔNG THỂ HOÀN TÁC</span>.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
               <button 
                 onClick={() => setConfirmDeleteId(null)}
                 className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 <X size={14} /> HỦY BỎ
               </button>
               <button 
                 onClick={handleDeleteConfirm}
                 className="flex-1 py-4 bg-red-600 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/40"
               >
                 <Trash2 size={14} /> ĐỒNG Ý XÓA
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Auto Cleanup */}
      {showCleanupConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#111111] border border-orange-600/20 w-full max-w-sm rounded-[2.5rem] p-8 space-y-8 relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-600"></div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-orange-600/10 rounded-full flex items-center justify-center text-orange-600">
                 <RefreshCcw size={32} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">XÁC NHẬN DỌN DẸP?</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed px-4">
                  Hệ thống sẽ tự động xóa tất cả người dùng <span className="text-orange-500">không hoạt động trên 60 ngày</span> kể từ lần tất toán cuối. Bạn có chắc chắn?
                </p>
              </div>
            </div>

            <div className="flex gap-3">
               <button 
                 onClick={() => setShowCleanupConfirm(false)}
                 className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 <X size={14} /> HỦY BỎ
               </button>
               <button 
                 onClick={handleCleanupConfirm}
                 className="flex-1 py-4 bg-orange-600 rounded-2xl text-[10px] font-black text-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-900/40"
               >
                 <CheckCircle size={14} /> BẮT ĐẦU
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Cleanup Result Summary Modal */}
      {cleanupResultCount !== null && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className="bg-[#111111] border border-green-600/20 w-full max-w-sm rounded-[2.5rem] p-8 space-y-8 relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-green-600"></div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-green-600/10 rounded-full flex items-center justify-center text-green-600">
                 <CheckCircle2 size={48} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">BÁO CÁO DỌN DẸP</h3>
                <div className="bg-black/40 rounded-2xl p-6 border border-white/5 shadow-inner">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Kết quả thực thi</p>
                   <p className="text-3xl font-black text-green-500">{cleanupResultCount} <span className="text-sm">User</span></p>
                   <p className="text-[9px] font-bold text-gray-600 uppercase mt-2 leading-tight">Đã được dọn dẹp vĩnh viễn khỏi hệ thống (Dữ liệu {'>'} 60 ngày).</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setCleanupResultCount(null)}
              className="w-full py-4 bg-green-600 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-green-900/40"
            >
              ĐÃ HIỂU & ĐÓNG
            </button>
          </div>
        </div>
      )}

      {selectedContract && (
        <ContractModal 
          contract={selectedContract.loan} 
          user={selectedContract.owner} 
          onClose={() => setSelectedContract(null)} 
        />
      )}

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300 cursor-zoom-out"
          onClick={() => setZoomImage(null)}
        >
          <div className="absolute top-6 right-6 flex gap-4">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const link = document.createElement('a');
                link.href = zoomImage;
                link.download = 'bill-payment.png';
                link.click();
              }}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
            >
              <Download size={24} />
            </button>
            <button 
              onClick={() => setZoomImage(null)}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
            >
              <X size={24} />
            </button>
          </div>
          <img 
            src={zoomImage} 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in duration-500" 
            alt="Zoomed bill" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;