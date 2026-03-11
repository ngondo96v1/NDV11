
import React, { useState, useEffect, useMemo } from 'react';
import { AppView, User, UserRank, LoanRecord, Notification, MonthlyStat } from './types';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import LoanApplication from './components/LoanApplication';
import RankLimits from './components/RankLimits';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import AdminUserManagement from './components/AdminUserManagement';
import AdminBudget from './components/AdminBudget';
import AdminSystem from './components/AdminSystem';
import { User as UserIcon, Home, Briefcase, Medal, LayoutGrid, Users, Wallet, AlertTriangle, X, Database, Settings } from 'lucide-react';
import { compressImage, generateContractId } from './utils';
import BankUpdateWarning from './components/BankUpdateWarning';
import DatabaseErrorModal from './components/DatabaseErrorModal';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: any): ErrorBoundaryState { 
    return { hasError: true }; 
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle size={48} className="text-[#ff8c00] mb-4" />
          <h2 className="text-xl font-black uppercase mb-2 text-white">Hệ thống đang bảo trì</h2>
          <p className="text-xs text-gray-500 mb-6 uppercase">Đã xảy ra lỗi khởi tạo. Vui lòng tải lại trang.</p>
          <button onClick={() => window.location.reload()} className="px-8 py-4 bg-[#ff8c00] text-black font-black rounded-full text-[10px] uppercase tracking-widest">Tải lại trang</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
  const [settleLoanFromDash, setSettleLoanFromDash] = useState<LoanRecord | null>(null);
  const [viewLoanFromDash, setViewLoanFromDash] = useState<LoanRecord | null>(null);
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vnv_user');
    if (saved && saved !== 'null' && saved !== '') {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [systemBudget, setSystemBudget] = useState<number>(30000000); 
  const [rankProfit, setRankProfit] = useState<number>(0); 
  const [loanProfit, setLoanProfit] = useState<number>(0); 
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(() => {
    const saved = localStorage.getItem('vnv_remember');
    return saved === null ? true : saved === 'true';
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [showBankWarning, setShowBankWarning] = useState(false);
  const [storageFull, setStorageFull] = useState(false);
  const [storageUsage, setStorageUsage] = useState('0');
  const [isGlobalProcessing, setIsGlobalProcessing] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const isProcessingRef = React.useRef(false);

  const hasBankInfo = (u: User | null) => {
    if (!u || u.isAdmin) return true;
    return !!(u.bankName && u.bankAccountNumber && u.bankAccountHolder);
  };

  const addNotification = async (userId: string, title: string, message: string, type: 'LOAN' | 'RANK' | 'SYSTEM') => {
    const newNotif: Notification = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      title,
      message,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
      read: false,
      type
    };
    
    const newNotifs = [newNotif, ...notifications].slice(0, 3);
    setNotifications(newNotifs);

    // Sync notification to server immediately
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotifs)
      });
    } catch (e) {
      console.error("Lỗi lưu thông báo:", e);
    }
  };

  useEffect(() => {
    if (user && currentView === AppView.LOGIN) {
      setCurrentView(user.isAdmin ? AppView.ADMIN_DASHBOARD : AppView.DASHBOARD);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchData = async (isInitial = false, retries = 2) => {
      if (!isMounted) return;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

      try {
        const params = new URLSearchParams();
        if (user) {
          params.append('userId', user.id);
          if (user.isAdmin) params.append('isAdmin', 'true');
        }
        if (user?.isAdmin) params.append('checkStorage', 'true');
        
        params.append('t', Date.now().toString());
        const url = `/api/data?${params.toString()}`;
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
          let errorMessage = `Server returned ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            if (errorData.message) errorMessage = errorData.message;
            else if (errorData.error) errorMessage = errorData.error;
          } catch (e) {
            // Not a JSON error response
          }
          
          // Detect database errors
          if (response.status === 500 || errorMessage.toLowerCase().includes('database') || errorMessage.toLowerCase().includes('supabase')) {
            setDbError(errorMessage);
          }
          
          throw new Error(errorMessage);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("Server returned non-JSON response:", text.substring(0, 200));
          throw new Error(`Server không trả về JSON (Status: ${response.status})`);
        }

        const data = await response.json();
        if (!isMounted) return;
        
        // Use functional updates and deep comparison to avoid unnecessary re-renders
        // CRITICAL: Skip updates if an action is in progress to prevent "state reversion"
        if (data.loans && !isProcessingRef.current) {
          setLoans(prevLoans => {
            if (JSON.stringify(prevLoans) === JSON.stringify(data.loans)) return prevLoans;
            return data.loans;
          });
        }

        if (data.users && !isProcessingRef.current) {
          setRegisteredUsers(prevUsers => {
            if (JSON.stringify(prevUsers) === JSON.stringify(data.users)) return prevUsers;
            return data.users;
          });
        }

        if (data.notifications) {
          setNotifications(prev => {
            const limitedNotifs = data.notifications.slice(0, 3);
            if (JSON.stringify(prev) === JSON.stringify(limitedNotifs)) return prev;
            return limitedNotifs;
          });
        }

        if (data.budget !== undefined && data.budget !== systemBudget && !isProcessingRef.current) {
          setSystemBudget(data.budget);
        }
        if (data.rankProfit !== undefined && data.rankProfit !== rankProfit && !isProcessingRef.current) {
          setRankProfit(data.rankProfit);
        }
        if (data.loanProfit !== undefined && data.loanProfit !== loanProfit && !isProcessingRef.current) {
          setLoanProfit(data.loanProfit);
        }
        if (data.monthlyStats !== undefined && !isProcessingRef.current) {
          const limitedStats = [...data.monthlyStats].slice(0, 6);
          setMonthlyStats(limitedStats);
        }
        if (data.storageFull !== undefined) setStorageFull(data.storageFull);
        if (data.storageUsage !== undefined) setStorageUsage(data.storageUsage);

        // Update current user if they are in the fetched users list
        if (user && data.users) {
          const freshUser = data.users.find((u: User) => u.id === user.id);
          if (freshUser && (freshUser.updatedAt || 0) >= (user.updatedAt || 0)) {
            if (JSON.stringify(freshUser) !== JSON.stringify(user)) {
              setUser(freshUser);
            }
          }
        }
      } catch (e: any) {
        clearTimeout(timeout);
        if (e.name === 'AbortError') {
          console.warn("Yêu cầu tải dữ liệu bị quá hạn (timeout)");
        } else {
          console.error("Lỗi khi tải dữ liệu từ server:", e.message || e);
        }
        
        if (retries > 0 && isMounted) {
          // Retry sooner if it failed
          timeoutId = setTimeout(() => fetchData(isInitial, retries - 1), 3000);
          return;
        }
      } finally {
        if (isInitial) setIsInitialized(true);
        // Schedule next fetch only after current one finishes
        if (isMounted) {
          timeoutId = setTimeout(() => fetchData(false), 10000);
        }
      }
    };

    fetchData(true);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!isInitialized || isGlobalProcessing) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let usersUpdated = false;
    let loansUpdated = false;

    const newUsers = [...registeredUsers];
    const nowTime = Date.now();
    
    // 1. Calculate fines and cleanup old bill images
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    const cleanupThreshold = nowTime - threeDaysInMs;

    const newLoans = loans.map(loan => {
      let updated = false;
      let currentLoan = { ...loan };

      // Fine calculation
      if (loan.status === 'ĐANG NỢ' || loan.status === 'CHỜ TẤT TOÁN' || loan.status === 'ĐANG GIẢI NGÂN') {
        const [d, m, y] = loan.date.split('/').map(Number);
        const dueDate = new Date(y, m - 1, d);
        dueDate.setHours(0, 0, 0, 0);

        if (today > dueDate) {
          const diffTime = today.getTime() - dueDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          const maxFine = loan.amount * 0.3;
          const calculatedFine = Math.floor(loan.amount * 0.001 * diffDays);
          const newFine = Math.min(maxFine, calculatedFine);

          if (loan.fine !== newFine) {
            currentLoan.fine = newFine;
            updated = true;
          }
        }
      }

      // Bill image cleanup (after 3 days of settlement)
      if (loan.status === 'ĐÃ TẤT TOÁN' && loan.billImage && (loan.updatedAt || 0) < cleanupThreshold) {
        currentLoan.billImage = null;
        updated = true;
      }

      if (updated) {
        loansUpdated = true;
        currentLoan.updatedAt = nowTime;
        return currentLoan;
      }
      return loan;
    });

    // 2. Handle rank demotion for users
    newUsers.forEach((targetUser, userIdx) => {
      if (targetUser.isAdmin) return;

      const userLoans = newLoans.filter(l => 
        l.userId === targetUser.id && 
        (l.status === 'ĐANG NỢ' || l.status === 'CHỜ TẤT TOÁN' || l.status === 'ĐANG GIẢI NGÂN')
      );

      let maxDiffDays = 0;
      userLoans.forEach(loan => {
        const [d, m, y] = loan.date.split('/').map(Number);
        const dueDate = new Date(y, m - 1, d);
        dueDate.setHours(0, 0, 0, 0);
        if (today > dueDate) {
          const diffTime = today.getTime() - dueDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > maxDiffDays) maxDiffDays = diffDays;
        }
      });

      if (maxDiffDays > 0) {
        const rankOrder: UserRank[] = ['standard', 'bronze', 'silver', 'gold', 'diamond'];
        let currentRank = targetUser.rank;
        let currentProgress = targetUser.rankProgress;
        let remainingDays = maxDiffDays;

        if (currentRank === 'diamond') {
          currentRank = 'gold';
          currentProgress = 10;
          remainingDays -= 1;
        }

        while (remainingDays > 0 && currentRank !== 'standard') {
          if (currentProgress >= remainingDays) {
            currentProgress -= remainingDays;
            remainingDays = 0;
          } else {
            remainingDays -= (currentProgress + 1);
            const rankIdx = rankOrder.indexOf(currentRank);
            if (rankIdx > 0) {
              currentRank = rankOrder[rankIdx - 1];
              currentProgress = 10;
            } else {
              remainingDays = 0;
            }
          }
        }

        if (currentRank === 'standard' && remainingDays > 0) {
          currentProgress = Math.max(0, currentProgress - remainingDays);
          remainingDays = 0;
        }

        if (currentRank !== targetUser.rank || currentProgress !== targetUser.rankProgress) {
          let newLimit = targetUser.totalLimit;
          if (currentRank === 'standard') newLimit = 2000000;
          else if (currentRank === 'bronze') newLimit = 3000000;
          else if (currentRank === 'silver') newLimit = 4000000;
          else if (currentRank === 'gold') newLimit = 5000000;
          else if (currentRank === 'diamond') newLimit = 10000000;

          newUsers[userIdx] = {
            ...targetUser,
            rank: currentRank,
            rankProgress: currentProgress,
            totalLimit: newLimit,
            balance: Math.min(newLimit, targetUser.balance),
            updatedAt: nowTime
          };
          usersUpdated = true;
        }
      }
    });

    // Consolidate updates and persist to server
    if (loansUpdated || usersUpdated) {
      if (loansUpdated) setLoans(newLoans);
      if (usersUpdated) {
        setRegisteredUsers(newUsers);
        if (user && !user.isAdmin) {
          const updatedMe = newUsers.find(u => u.id === user.id);
          if (updatedMe) setUser(updatedMe);
        }
      }

      // Persist calculated fines/demotions to server
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loans: loansUpdated ? newLoans : undefined,
          users: usersUpdated ? newUsers : undefined
        })
      }).catch(e => console.error("Lỗi đồng bộ phạt/hạ hạng:", e));
    }
  }, [isInitialized, loans, registeredUsers, isGlobalProcessing]);

  // Only persist current user session to localStorage if rememberMe is true
  useEffect(() => {
    localStorage.setItem('vnv_remember', rememberMe.toString());
    
    if (!isInitialized) return; // Don't touch localStorage during initial load

    if (rememberMe && user) {
      localStorage.setItem('vnv_user', JSON.stringify(user));
    } else if (!user) {
      // Only remove if user is explicitly null (logged out)
      localStorage.removeItem('vnv_user');
    }
  }, [user, rememberMe, isInitialized]);

  const handleLogin = (phone: string, password?: string) => {
    setLoginError(null);
    const isAdmin = (phone === '0877203996' && password === '119011');
    if (isAdmin) {
      const adminUser: User = {
        id: 'AD01', phone: '0877203996', fullName: 'QUẢN TRỊ VIÊN', idNumber: 'SYSTEM_ADMIN',
        balance: 500000000, totalLimit: 500000000, rank: 'diamond', rankProgress: 10,
        isLoggedIn: true, isAdmin: true, password: '119011'
      };
      setUser(adminUser);
      setCurrentView(AppView.ADMIN_DASHBOARD);
      setShowBankWarning(false);
      return;
    }
    const existingUser = registeredUsers.find(u => u.phone === phone && u.password === password);
    if (existingUser) {
      const loggedInUser = { ...existingUser, isLoggedIn: true };
      setUser(loggedInUser);
      setCurrentView(AppView.DASHBOARD);
      if (!hasBankInfo(loggedInUser)) {
        setShowBankWarning(true);
      }
    } else {
      setLoginError("Số điện thoại hoặc mật khẩu không chính xác.");
    }
  };

  const handleRegister = async (userData: Partial<User>) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsGlobalProcessing(true);
    try {
      setRegisterError(null);
      const existingUser = registeredUsers.find(u => u.phone === userData.phone);
      if (existingUser) {
        setRegisterError("Số điện thoại này đã được đăng ký.");
        isProcessingRef.current = false;
        setIsGlobalProcessing(false);
        return;
      }

      const newUser: User = {
        id: Math.floor(1000 + Math.random() * 9000).toString(), 
        phone: userData.phone || '', fullName: userData.fullName || '',
        idNumber: userData.idNumber || '', address: userData.address || '',
        password: userData.password || '',
        balance: 2000000, totalLimit: 2000000, rank: 'standard', rankProgress: 0,
        isLoggedIn: true, isAdmin: false,
        joinDate: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
        idFront: userData.idFront, idBack: userData.idBack, refZalo: userData.refZalo, relationship: userData.relationship,
        lastLoanSeq: 0,
        updatedAt: Date.now()
      };
      
      const newUsers = [...registeredUsers, newUser];
      
      // Optimistic UI
      setRegisteredUsers(newUsers);
      setUser(newUser);
      setCurrentView(AppView.DASHBOARD);
      setShowBankWarning(true);

      // Background Sync - Only send the NEW user, not the whole array
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([newUser]) // Wrap in array for backend compatibility
      }).catch(err => console.error("Background sync error (register):", err));
      
      isProcessingRef.current = false;
      setIsGlobalProcessing(false);
    } catch (e) {
      console.error("Lỗi lưu đăng ký:", e);
      setRegisterError("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.");
      isProcessingRef.current = false;
      setIsGlobalProcessing(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLoginError(null);
    setRegisterError(null);
    setCurrentView(AppView.LOGIN);
  };

  const handleApplyLoan = async (amount: number, signature?: string) => {
    if (!user || isProcessingRef.current) return;

    // Chặn spam: Kiểm tra xem có khoản vay nào đang chờ xử lý không
    const userLoans = loans.filter(l => l.userId === user.id);
    const hasPending = userLoans.some(l => ['CHỜ DUYỆT', 'ĐÃ DUYỆT', 'ĐANG GIẢI NGÂN', 'CHỜ TẤT TOÁN'].includes(l.status));
    
    if (hasPending) {
      alert("Bạn đang có một khoản vay đang được xử lý. Vui lòng đợi cho đến khi khoản vay hiện tại hoàn tất trước khi đăng ký khoản mới.");
      return;
    }

    isProcessingRef.current = true;
    setIsGlobalProcessing(true);
    try {
      const now = new Date();
      
      // Logic tính ngày đến hạn: Ngày 1 của tháng kế tiếp
      // Nếu còn dưới 10 ngày thì chuyển sang tháng sau nữa
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
      const dueDate = `${dayStr}/${monthStr}/${finalDate.getFullYear()}`;
      
      // Logic tạo Mã hợp đồng: Sử dụng hàm sinh mã duy nhất
      const nextSeq = (user.lastLoanSeq || 0) + 1;
      const contractId = generateContractId(user.id);

      const newLoan: LoanRecord = {
        id: contractId,
        userId: user.id, 
        userName: user.fullName, 
        amount: amount,
        date: dueDate, 
        createdAt: now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN'), 
        status: 'CHỜ DUYỆT', 
        signature: signature,
        updatedAt: Date.now()
      };
      
      const updatedUser: User = { 
        ...user, 
        balance: user.balance - amount,
        lastLoanSeq: nextSeq,
        hasJoinedZalo: user.hasJoinedZalo || nextSeq === 1,
        updatedAt: Date.now()
      };

      const newLoans = [newLoan, ...loans];
      const newRegisteredUsers = registeredUsers.some(u => u.id === user.id)
        ? registeredUsers.map(u => u.id === user.id ? updatedUser : u)
        : [...registeredUsers, updatedUser];

      // Optimistic UI Update - 0ms response
      setLoans(newLoans);
      setUser(updatedUser);
      setRegisteredUsers(newRegisteredUsers);

      // Background Sync - Targeted (only send changed records)
      Promise.all([
        fetch('/api/loans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([newLoan]) // Only 1 loan
        }),
        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([updatedUser]) // Only 1 user
        })
      ])
      .then(async responses => {
        for (const res of responses) {
          if (!res.ok) {
            const errorData = await res.json();
            console.error("Sync error (apply):", errorData);
            alert(`Lỗi đồng bộ: ${errorData.message || 'Không thể lưu dữ liệu khoản vay'}. Vui lòng thử lại.`);
          }
        }
      })
      .catch(err => {
        console.error("Background sync error (loans):", err);
        alert("Lỗi kết nối mạng. Vui lòng kiểm tra lại kết nối và thử lại.");
      });

      // Chuyển sang Zalo nếu là khoản vay đầu tiên và chưa từng chuyển
      const hasAnyPriorLoans = loans.some(l => l.userId === user.id);
      if (nextSeq === 1 && !user.hasJoinedZalo && !hasAnyPriorLoans) {
        setTimeout(() => {
          window.location.assign('https://zalo.me/g/escncv086');
        }, 800);
      }
      
      // Clear processing state early for better responsiveness
      isProcessingRef.current = false;
      setIsGlobalProcessing(false);
    } catch (e) {
      console.error("Lỗi lưu khoản vay:", e);
      isProcessingRef.current = false;
      setIsGlobalProcessing(false);
    }
  };

  const handleUpgradeRank = async (targetRank: UserRank, bill: string) => {
    if (!user || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsGlobalProcessing(true);
    try {
      const updatedUser = { ...user, pendingUpgradeRank: targetRank, rankUpgradeBill: bill, updatedAt: Date.now() };
      const newRegisteredUsers = registeredUsers.some(u => u.id === user.id)
        ? registeredUsers.map(u => u.id === user.id ? updatedUser : u)
        : [...registeredUsers, updatedUser];
      
      // Optimistic UI Update - 0ms response
      setUser(updatedUser);
      setRegisteredUsers(newRegisteredUsers);

      // Background Sync - Targeted (only send changed records)
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([updatedUser])
      }).catch(err => console.error("Background sync error (upgrade):", err));
      
      isProcessingRef.current = false;
      setIsGlobalProcessing(false);
    } catch (e) {
      console.error("Lỗi nâng hạng:", e);
      isProcessingRef.current = false;
      setIsGlobalProcessing(false);
    }
  };

  const handleSettleLoan = async (loanId: string, bill: string, settlementType: 'ALL' | 'PRINCIPAL', bankTransactionId?: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsGlobalProcessing(true);
    try {
      let updatedLoan: LoanRecord | null = null;
      const newLoans = loans.map(loan => {
        if (loan.id === loanId) {
          updatedLoan = { 
            ...loan, 
            status: 'CHỜ TẤT TOÁN', 
            billImage: bill, 
            bankTransactionId,
            settlementType, 
            rejectionReason: null, // Clear old rejection reason on re-submission
            updatedAt: Date.now() 
          };
          return updatedLoan;
        }
        return loan;
      });

      // Optimistic UI
      setLoans(newLoans);

      // Background Sync - Only send the UPDATED loan
      if (updatedLoan) {
        fetch('/api/loans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([updatedLoan])
        })
        .then(async res => {
          if (!res.ok) {
            const errorData = await res.json();
            console.error("Sync error (settle):", errorData);
            alert(`Lỗi đồng bộ: ${errorData.message || 'Không thể lưu dữ liệu tất toán'}. Vui lòng thử lại.`);
          }
        })
        .catch(err => {
          console.error("Background sync error (settle):", err);
          alert("Lỗi kết nối mạng. Vui lòng kiểm tra lại kết nối và thử lại.");
        });
      }
      
    } catch (e) {
      console.error("Lỗi tất toán:", e);
    } finally {
      isProcessingRef.current = false;
      setIsGlobalProcessing(false);
    }
  };

  const handleAdminLoanAction = async (loanId: string, action: 'APPROVE' | 'DISBURSE' | 'SETTLE' | 'REJECT', reason?: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsGlobalProcessing(true);
    try {
      let newLoans = [...loans];
      let newRegisteredUsers = [...registeredUsers];
      let usersUpdated = false;
      let newBudget = systemBudget;

      const loanIdx = newLoans.findIndex(l => l.id === loanId);
      if (loanIdx === -1) {
        isProcessingRef.current = false;
        setIsGlobalProcessing(false);
        return;
      }

      const loan = newLoans[loanIdx];

      // Ngăn chặn xử lý lặp lại hoặc trạng thái không hợp lệ
      if (action === 'APPROVE' && loan.status !== 'CHỜ DUYỆT') {
        isProcessingRef.current = false;
        setIsGlobalProcessing(false);
        return;
      }
      if (action === 'DISBURSE' && loan.status !== 'ĐÃ DUYỆT') {
        isProcessingRef.current = false;
        setIsGlobalProcessing(false);
        return;
      }
      if (action === 'SETTLE' && loan.status !== 'CHỜ TẤT TOÁN') {
        isProcessingRef.current = false;
        setIsGlobalProcessing(false);
        return;
      }
      if (action === 'REJECT' && loan.status !== 'CHỜ DUYỆT' && loan.status !== 'CHỜ TẤT TOÁN') {
        isProcessingRef.current = false;
        setIsGlobalProcessing(false);
        return;
      }

      let newStatus = loan.status;
      let rejectionReason = action === 'REJECT' ? (reason || loan.rejectionReason) : null;

      if (action === 'DISBURSE') newBudget -= (loan.amount * 0.85); // Only deduct 85% of loan amount (15% fee kept in budget)
      else if (action === 'SETTLE') {
        if (loan.settlementType === 'PRINCIPAL') {
          // Vay Gốc: Pay 15% fee + fines
          newBudget += ((loan.amount * 0.15) + (loan.fine || 0));
        } else {
          // Tất Cả: Pay principal + fines
          newBudget += (loan.amount + (loan.fine || 0));
        }
      }

      if (action === 'REJECT') {
        if (loan.status === 'CHỜ TẤT TOÁN') {
          newStatus = 'ĐANG NỢ';
        } else {
          newStatus = 'BỊ TỪ CHỐI';
          const loanUser = newRegisteredUsers.find(u => u.id === loan.userId);
          if (loanUser) {
            const updatedUser = { ...loanUser, balance: Math.min(loanUser.totalLimit, loanUser.balance + loan.amount), updatedAt: Date.now() };
            newRegisteredUsers = newRegisteredUsers.map(u => u.id === loan.userId ? updatedUser : u);
            usersUpdated = true;
          }
        }
      } else {
        switch(action) {
          case 'APPROVE': newStatus = 'ĐÃ DUYỆT'; break;
          case 'DISBURSE': newStatus = 'ĐANG NỢ'; break;
          case 'SETTLE': newStatus = 'ĐÃ TẤT TOÁN'; break;
        }
      }

      if (action === 'SETTLE') {
        const loanUser = newRegisteredUsers.find(u => u.id === loan.userId);
        if (loanUser) {
          let updatedUser;
          if (loan.settlementType === 'PRINCIPAL') {
            // Vay Gốc: Limit doesn't change (only fee paid), rank progress increases
            updatedUser = { ...loanUser, rankProgress: Math.min(10, loanUser.rankProgress + 1), updatedAt: Date.now() };
          } else {
            // Tất Cả: Restore balance
            updatedUser = { ...loanUser, balance: Math.min(loanUser.totalLimit, loanUser.balance + loan.amount), rankProgress: Math.min(10, loanUser.rankProgress + 1), updatedAt: Date.now() };
          }
          newRegisteredUsers = newRegisteredUsers.map(u => u.id === loan.userId ? updatedUser : u);
          usersUpdated = true;
        }
      }

      // Logic tính chu kỳ tiếp theo cho Vay Gốc: Cộng thêm 1 tháng (đến ngày 1 tháng sau)
      let newDueDate = loan.date;
      if (action === 'SETTLE' && loan.settlementType === 'PRINCIPAL') {
        const [d, m, y] = loan.date.split('/').map(Number);
        const currentDueDate = new Date(y, m - 1, d);
        // Cộng thêm 1 tháng và đặt về ngày 1 của tháng tiếp theo
        const nextCycleDate = new Date(currentDueDate.getFullYear(), currentDueDate.getMonth() + 1, 1);
        const dayStr = nextCycleDate.getDate().toString().padStart(2, '0');
        const monthStr = (nextCycleDate.getMonth() + 1).toString().padStart(2, '0');
        newDueDate = `${dayStr}/${monthStr}/${nextCycleDate.getFullYear()}`;
      }

      const updatedLoan = { 
        ...loan, 
        status: (action === 'SETTLE' && loan.settlementType === 'PRINCIPAL') ? 'ĐANG NỢ' : (newStatus as any), 
        date: newDueDate,
        rejectionReason, 
        // Clear bill and type if it's a successful Principal Settlement to keep the next cycle clean
        billImage: (action === 'SETTLE' && loan.settlementType === 'PRINCIPAL') ? null : loan.billImage,
        settlementType: (action === 'SETTLE' && loan.settlementType === 'PRINCIPAL') ? null : loan.settlementType,
        updatedAt: Date.now() 
      };
      newLoans[loanIdx] = updatedLoan;

      // Calculate new stats for sync
      let newLoanProfit = loanProfit;
      let newMonthlyStats = [...monthlyStats];

      const updateProfit = (amount: number) => {
        if (amount <= 0) return;
        newLoanProfit += amount;
        const now = new Date();
        const monthKey = `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
        const existingIdx = newMonthlyStats.findIndex(s => s.month === monthKey);
        if (existingIdx !== -1) {
          const stat = { ...newMonthlyStats[existingIdx] };
          stat.loanProfit += amount;
          stat.totalProfit = stat.rankProfit + stat.loanProfit;
          newMonthlyStats[existingIdx] = stat;
        } else {
          newMonthlyStats = [{ month: monthKey, rankProfit: 0, loanProfit: amount, totalProfit: amount }, ...newMonthlyStats].slice(0, 6);
        }
      };

      if (action === 'DISBURSE') {
        updateProfit(loan.amount * 0.15); // Recognize 15% fee at disbursement
      } else if (action === 'SETTLE') {
        if (loan.settlementType === 'PRINCIPAL') {
          // Vay Gốc: Recognize 15% fee for the next cycle + fines
          updateProfit((loan.amount * 0.15) + (loan.fine || 0));
        } else {
          // Tất Cả: Only recognize fines (15% was already recognized at disbursement)
          updateProfit(loan.fine || 0);
        }
      }

      // Persist to server using sync endpoint - Targeted sync for bandwidth
      const syncData = {
        loans: [updatedLoan], // Only the changed loan
        budget: newBudget,
        users: usersUpdated ? [newRegisteredUsers.find(u => u.id === loan.userId)] : undefined,
        loanProfit: (action === 'SETTLE' || action === 'DISBURSE') ? newLoanProfit : undefined,
        monthlyStats: (action === 'SETTLE' || action === 'DISBURSE') ? newMonthlyStats : undefined
      };

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncData)
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      // Update local state ONLY after successful sync for Admin
      setLoans(newLoans);
      setSystemBudget(newBudget);
      setLoanProfit(newLoanProfit);
      setMonthlyStats(newMonthlyStats);

      if (usersUpdated) {
        setRegisteredUsers(newRegisteredUsers);
        if (user && !user.isAdmin) {
          const updatedMe = newRegisteredUsers.find(u => u.id === user.id);
          if (updatedMe) setUser(updatedMe);
        }
      }

      // Notifications
      if (action === 'DISBURSE') {
        addNotification(loan.userId, 'Giải ngân thành công', `Khoản vay ID ${loan.id} đã được giải ngân vào tài khoản của bạn.`, 'LOAN');
      } else if (action === 'SETTLE') {
        addNotification(loan.userId, 'Tất toán thành công', `Khoản vay ID ${loan.id} đã được tất toán hoàn tất.`, 'LOAN');
      } else if (action === 'REJECT') {
        addNotification(loan.userId, 'Yêu cầu bị từ chối', `Yêu cầu cho khoản vay ID ${loan.id} đã bị từ chối. Lý do: ${rejectionReason || 'Không xác định'}`, 'LOAN');
      }
    } catch (e: any) {
      console.error("Lỗi lưu thay đổi khoản vay Admin:", e.message || e);
    } finally {
      isProcessingRef.current = false;
      setIsGlobalProcessing(false);
    }
  };

  const handleAdminUserAction = async (userId: string, action: 'APPROVE_RANK' | 'REJECT_RANK') => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsGlobalProcessing(true);
    try {
      let newUsers = [...registeredUsers];
      let updatedUser: User | null = null;

      const targetUser = newUsers.find(u => u.id === userId);
      if (!targetUser) {
        isProcessingRef.current = false;
        setIsGlobalProcessing(false);
        return;
      }

      if (action === 'APPROVE_RANK') {
        if (targetUser.pendingUpgradeRank) {
          const newRank = targetUser.pendingUpgradeRank;
          let newLimit = targetUser.totalLimit;
          
          if (newRank === 'bronze') newLimit = 3000000;
          else if (newRank === 'silver') newLimit = 4000000;
          else if (newRank === 'gold') newLimit = 5000000;
          else if (newRank === 'diamond') newLimit = 10000000;
          
          updatedUser = { 
            ...targetUser, 
            rank: newRank, 
            totalLimit: newLimit, 
            balance: newLimit - (targetUser.totalLimit - targetUser.balance), 
            pendingUpgradeRank: null, 
            rankUpgradeBill: undefined,
            updatedAt: Date.now()
          };
          
          newUsers = newUsers.map(u => u.id === userId ? updatedUser! : u);
          
          const rankNames: Record<string, string> = {
            'bronze': 'Đồng',
            'silver': 'Bạc',
            'gold': 'Vàng',
            'diamond': 'Kim cương'
          };
          addNotification(userId, 'Nâng hạng thành công', `Hạng của bạn đã được nâng lên ${rankNames[newRank] || newRank}.`, 'RANK');
        }
      } else if (action === 'REJECT_RANK') {
        updatedUser = { ...targetUser, pendingUpgradeRank: null, rankUpgradeBill: undefined, updatedAt: Date.now() };
        newUsers = newUsers.map(u => u.id === userId ? updatedUser! : u);
        addNotification(userId, 'Từ chối nâng hạng', `Yêu cầu nâng hạng của bạn đã bị từ chối. Vui lòng kiểm tra lại hồ sơ.`, 'RANK');
      }

      if (updatedUser) {
        const upgradeFee = action === 'APPROVE_RANK' ? (updatedUser.totalLimit * 0.05) : 0;
        const newBudget = systemBudget + upgradeFee;
        
        let newRankProfit = rankProfit;
        let newMonthlyStats = [...monthlyStats];

        if (upgradeFee > 0) {
          newRankProfit += upgradeFee;
          const now = new Date();
          const monthKey = `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
          const existingIdx = newMonthlyStats.findIndex(s => s.month === monthKey);
          if (existingIdx !== -1) {
            const stat = { ...newMonthlyStats[existingIdx] };
            stat.rankProfit += upgradeFee;
            stat.totalProfit = stat.rankProfit + stat.loanProfit;
            newMonthlyStats[existingIdx] = stat;
          } else {
            newMonthlyStats = [{ month: monthKey, rankProfit: upgradeFee, loanProfit: 0, totalProfit: upgradeFee }, ...newMonthlyStats].slice(0, 6);
          }
        }

        // Persist to server using sync endpoint - Targeted sync
        const syncData = {
          users: [updatedUser], // Only the changed user
          budget: upgradeFee > 0 ? newBudget : undefined,
          rankProfit: upgradeFee > 0 ? newRankProfit : undefined,
          monthlyStats: upgradeFee > 0 ? newMonthlyStats : undefined
        };

        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncData)
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        // Update local state ONLY after successful sync for Admin
        setRegisteredUsers(newUsers);
        if (user?.id === userId) setUser(updatedUser);
        if (upgradeFee > 0) {
          setSystemBudget(newBudget);
          setRankProfit(newRankProfit);
          setMonthlyStats(newMonthlyStats);
        }
      }
    } catch (e: any) {
      console.error("Lỗi xử lý nâng hạng Admin:", e.message || e);
    } finally {
      isProcessingRef.current = false;
      setIsGlobalProcessing(false);
    }
  };

  const handleResetRankProfit = async () => {
    setRankProfit(0);
    try {
      await fetch('/api/rankProfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rankProfit: 0 })
      });
    } catch (e) {
      console.error("Lỗi khi reset phí nâng hạng:", e);
    }
  };

  const handleResetLoanProfit = async () => {
    setLoanProfit(0);
    try {
      await fetch('/api/loanProfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanProfit: 0 })
      });
    } catch (e) {
      console.error("Lỗi khi reset lợi nhuận phí và phạt:", e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      setRegisteredUsers(prev => prev.filter(u => u.id !== userId));
      setLoans(prev => prev.filter(l => l.userId !== userId));
    } catch (e) {
      console.error("Lỗi khi xóa user:", e);
    }
  };

  const handleAutoCleanupUsers = async () => {
    const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const usersToDelete = registeredUsers.filter(u => {
      if (u.isAdmin) return false;
      
      const userLoans = loans.filter(l => l.userId === u.id);
      
      // Check if user has any active/pending loans
      const hasActiveLoans = userLoans.some(l => 
        !['ĐÃ TẤT TOÁN', 'BỊ TỪ CHỐI'].includes(l.status)
      );
      
      if (hasActiveLoans) return false;

      // Find the latest activity timestamp for this user
      let lastActivity = u.updatedAt || 0;
      userLoans.forEach(l => {
        if (l.updatedAt && l.updatedAt > lastActivity) {
          lastActivity = l.updatedAt;
        }
      });

      // If no activity recorded at all (shouldn't happen with updatedAt), use joinDate as fallback
      if (lastActivity === 0 && u.joinDate) {
        try {
          // joinDate format: "HH:mm:ss DD/MM/YYYY"
          const parts = u.joinDate.split(' ');
          if (parts.length === 2) {
            const [d, m, y] = parts[1].split('/').map(Number);
            const [h, min, s] = parts[0].split(':').map(Number);
            lastActivity = new Date(y, m - 1, d, h, min, s).getTime();
          }
        } catch (e) {
          lastActivity = 0;
        }
      }

      // Only delete if inactive for more than 60 days
      return (now - lastActivity) > SIXTY_DAYS_MS;
    });
    
    for (const u of usersToDelete) {
      try {
        await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
      } catch (e) {
        console.error("Lỗi khi dọn dẹp user:", u.id, e);
      }
    }
    
    setRegisteredUsers(prev => prev.filter(u => !usersToDelete.some(td => td.id === u.id)));
    setLoans(prev => prev.filter(l => !usersToDelete.some(td => td.id === l.userId)));
    return usersToDelete.length;
  };

  const adminNotificationCount = useMemo(() => 
    loans.filter(l => l.status === 'CHỜ DUYỆT' || l.status === 'CHỜ TẤT TOÁN').length +
    registeredUsers.filter(u => u.pendingUpgradeRank).length
  , [loans, registeredUsers]);

  const handleUpdateProfile = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData, updatedAt: Date.now() };
      const newUsers = registeredUsers.map(u => u.id === user.id ? updatedUser : u);
      // Optimistic UI Update - 0ms response
      setUser(updatedUser);
      setRegisteredUsers(newUsers);
      
      // If password was updated, add a specific notification
      if (userData.password) {
        addNotification(user.id, 'Bảo mật tài khoản', 'Mật khẩu của bạn đã được thay đổi thành công.', 'SYSTEM');
      } else {
        addNotification(user.id, 'Cập nhật thông tin', 'Thông tin cá nhân của bạn đã được cập nhật thành công.', 'SYSTEM');
      }

      // Persist to server - Targeted sync
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([updatedUser])
      }).catch(e => console.error("Lỗi lưu hồ sơ:", e));
    }
  };

  const handleUpdateBank = (bankData: { bankName: string; bankAccountNumber: string; bankAccountHolder: string }) => {
    if (user) {
      const updatedUser = { ...user, ...bankData, updatedAt: Date.now() };
      const newUsers = registeredUsers.map(u => u.id === user.id ? updatedUser : u);
      // Optimistic UI Update - 0ms response
      setUser(updatedUser);
      setRegisteredUsers(newUsers);
      addNotification(user.id, 'Cập nhật tài khoản', 'Thông tin tài khoản nhận tiền của bạn đã được cập nhật.', 'SYSTEM');
      setShowBankWarning(false);
      
      // Persist to server - Targeted sync
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([updatedUser])
      }).catch(e => console.error("Lỗi lưu tài khoản ngân hàng:", e));
    }
  };

  const handleSystemRefresh = async (targetView: AppView = AppView.LOGIN) => {
    setIsGlobalProcessing(true);
    try {
      // Clear local storage if logging out
      if (targetView === AppView.LOGIN) {
        localStorage.removeItem('ndv_user_id');
        setUser(null);
      }
      
      // Force immediate data fetch
      const params = new URLSearchParams();
      params.append('checkStorage', 'true');
      params.append('t', Date.now().toString());
      
      const response = await fetch(`/api/data?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      
      if (data.users) setRegisteredUsers(data.users);
      if (data.loans) setLoans(data.loans);
      if (data.notifications) setNotifications(data.notifications);
      if (data.budget !== undefined) setSystemBudget(data.budget);
      if (data.rankProfit !== undefined) setRankProfit(data.rankProfit);
      if (data.loanProfit !== undefined) setLoanProfit(data.loanProfit);
      if (data.monthlyStats) setMonthlyStats(data.monthlyStats);
      
      setStorageFull(data.storageFull);
      setStorageUsage(data.storageUsage);
      
      setCurrentView(targetView);
    } catch (e) {
      console.error("Lỗi làm mới hệ thống:", e);
      // Fallback to reload if everything fails
      window.location.href = window.location.origin;
    } finally {
      setIsGlobalProcessing(false);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.LOGIN: return (
        <Login 
          onLogin={handleLogin} 
          onNavigateRegister={() => { setRegisterError(null); setCurrentView(AppView.REGISTER); }} 
          error={loginError}
          rememberMe={rememberMe}
          onToggleRememberMe={setRememberMe}
        />
      );
      case AppView.REGISTER: return <Register onBack={() => setCurrentView(AppView.LOGIN)} onRegister={handleRegister} onClearError={() => setRegisterError(null)} error={registerError} />;
      case AppView.DASHBOARD: 
        return (
          <Dashboard 
            user={user} 
            loans={loans.filter(l => l.userId === user?.id)} 
            notifications={notifications.filter(n => n.userId === user?.id)}
            systemBudget={systemBudget} 
            onApply={() => {
              if (!hasBankInfo(user)) {
                setShowBankWarning(true);
                return;
              }
              setCurrentView(AppView.APPLY_LOAN);
            }} 
            onLogout={handleLogout} 
            onViewAllLoans={() => {
              if (!hasBankInfo(user)) {
                setShowBankWarning(true);
                return;
              }
              setCurrentView(AppView.APPLY_LOAN);
            }}
            onSettleLoan={(loan) => {
              setSettleLoanFromDash(loan);
              setCurrentView(AppView.APPLY_LOAN);
            }}
            onViewContract={(loan) => {
              setViewLoanFromDash(loan);
              setCurrentView(AppView.APPLY_LOAN);
            }}
            onMarkNotificationRead={(id) => {
              const updatedNotif = notifications.find(n => n.id === id);
              if (updatedNotif) {
                const newNotif = { ...updatedNotif, read: true };
                setNotifications(prev => prev.map(n => n.id === id ? newNotif : n));
                // Targeted Sync - Only send the changed notification
                fetch('/api/notifications', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify([newNotif])
                }).catch(e => console.error("Lỗi lưu trạng thái thông báo:", e));
              }
            }}
            onMarkAllNotificationsRead={() => {
              if (user) {
                const userNotifs = notifications.filter(n => n.userId === user.id);
                const updatedNotifs = userNotifs.map(n => ({ ...n, read: true }));
                setNotifications(prev => prev.map(n => n.userId === user.id ? { ...n, read: true } : n));
                // Targeted Sync - Only send notifications for this user
                fetch('/api/notifications', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updatedNotifs)
                });
              }
            }}
          />
        );
      case AppView.APPLY_LOAN: 
        return (
          <LoanApplication 
            user={user} 
            loans={loans.filter(l => l.userId === user?.id)} 
            systemBudget={systemBudget} 
            isGlobalProcessing={isGlobalProcessing}
            onApplyLoan={handleApplyLoan} 
            onSettleLoan={handleSettleLoan} 
            onBack={() => {
              setSettleLoanFromDash(null);
              setViewLoanFromDash(null);
              setCurrentView(AppView.DASHBOARD);
            }}
            initialLoanToSettle={settleLoanFromDash}
            initialLoanToView={viewLoanFromDash}
          />
        );
      case AppView.RANK_LIMITS: return <RankLimits user={user} isGlobalProcessing={isGlobalProcessing} onBack={() => setCurrentView(AppView.DASHBOARD)} onUpgrade={handleUpgradeRank} />;
      case AppView.PROFILE: 
        return (
          <Profile 
            user={user} 
            onBack={() => setCurrentView(AppView.DASHBOARD)} 
            onLogout={handleLogout} 
            onUpdateBank={handleUpdateBank}
            onUpdateProfile={handleUpdateProfile}
          />
        );
      case AppView.ADMIN_DASHBOARD: return <AdminDashboard user={user} loans={loans} registeredUsersCount={registeredUsers.length} systemBudget={systemBudget} rankProfit={rankProfit} loanProfit={loanProfit} monthlyStats={monthlyStats} onResetRankProfit={handleResetRankProfit} onResetLoanProfit={handleResetLoanProfit} onNavigateToUsers={() => setCurrentView(AppView.ADMIN_USERS)} onLogout={handleLogout} />;
      case AppView.ADMIN_USERS: return <AdminUserManagement users={registeredUsers} loans={loans} isGlobalProcessing={isGlobalProcessing} onAction={handleAdminUserAction} onLoanAction={handleAdminLoanAction} onDeleteUser={handleDeleteUser} onAutoCleanup={handleAutoCleanupUsers} onBack={() => setCurrentView(AppView.ADMIN_DASHBOARD)} />;
      case AppView.ADMIN_BUDGET: 
        return (
          <AdminBudget 
            currentBudget={systemBudget} 
            onUpdate={async (val) => {
              setSystemBudget(val);
              try {
                await fetch('/api/budget', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ budget: val })
                });
              } catch (e) {
                console.error("Lỗi cập nhật ngân sách:", e);
              }
            }} 
            onBack={() => setCurrentView(AppView.ADMIN_DASHBOARD)} 
          />
        );
      case AppView.ADMIN_SYSTEM:
        return (
          <AdminSystem 
            onReset={async () => {
              try {
                await fetch('/api/reset', { method: 'POST' });
                handleSystemRefresh(AppView.LOGIN);
              } catch (e) {
                console.error("Lỗi reset hệ thống:", e);
              }
            }}
            onImportSuccess={() => handleSystemRefresh(AppView.LOGIN)}
            onBack={() => setCurrentView(AppView.ADMIN_DASHBOARD)} 
          />
        );
      default: 
        return (
          <Dashboard 
            user={user} 
            loans={loans.filter(l => l.userId === user?.id)} 
            notifications={notifications.filter(n => n.userId === user?.id)}
            systemBudget={systemBudget} 
            onApply={() => {
              if (!hasBankInfo(user)) {
                setShowBankWarning(true);
                return;
              }
              setCurrentView(AppView.APPLY_LOAN);
            }} 
            onLogout={handleLogout} 
            onViewAllLoans={() => {
              if (!hasBankInfo(user)) {
                setShowBankWarning(true);
                return;
              }
              setCurrentView(AppView.APPLY_LOAN);
            }}
            onSettleLoan={(loan) => {
              setSettleLoanFromDash(loan);
              setCurrentView(AppView.APPLY_LOAN);
            }}
            onViewContract={(loan) => {
              setViewLoanFromDash(loan);
              setCurrentView(AppView.APPLY_LOAN);
            }}
            onMarkNotificationRead={(id) => {
              const updatedNotif = notifications.find(n => n.id === id);
              if (updatedNotif) {
                const newNotif = { ...updatedNotif, read: true };
                setNotifications(prev => prev.map(n => n.id === id ? newNotif : n));
                // Targeted Sync - Only send the changed notification
                fetch('/api/notifications', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify([newNotif])
                }).catch(e => console.error("Lỗi lưu trạng thái thông báo:", e));
              }
            }}
            onMarkAllNotificationsRead={() => {
              if (user) {
                const userNotifs = notifications.filter(n => n.userId === user.id);
                const updatedNotifs = userNotifs.map(n => ({ ...n, read: true }));
                setNotifications(prev => prev.map(n => n.userId === user.id ? { ...n, read: true } : n));
                // Targeted Sync - Only send notifications for this user
                fetch('/api/notifications', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updatedNotifs)
                });
              }
            }}
          />
        );
    }
  };

  const showNavbar = user && currentView !== AppView.LOGIN && currentView !== AppView.REGISTER;

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ff8c00] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-[100dvh] bg-black text-white flex flex-col max-w-md mx-auto relative overflow-hidden">
        {storageFull && !user?.isAdmin && (
          <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center text-[#ff8c00] animate-pulse">
              <AlertTriangle size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Hệ thống bảo trì</h2>
              <p className="text-sm font-bold text-gray-500 leading-relaxed">
                Hệ thống đang quá tải dung lượng lưu trữ và cần bảo trì định kỳ. Vui lòng quay lại sau ít phút.
              </p>
            </div>
            <div className="w-12 h-1 bg-orange-500/20 rounded-full"></div>
          </div>
        )}

        {storageFull && user?.isAdmin && (
          <div className="fixed top-0 left-0 right-0 z-[1000] bg-red-600 text-white px-4 py-2 flex items-center justify-between shadow-lg max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="animate-bounce" />
              <span className="text-[10px] font-black uppercase tracking-widest">CẢNH BÁO: DUNG LƯỢNG SẮP HẾT ({storageUsage}MB/45MB)</span>
            </div>
            <button onClick={() => setStorageFull(false)} className="text-white/50 hover:text-white"><X size={14} /></button>
          </div>
        )}

        <div className={`flex-1 overflow-y-auto scroll-smooth ${showNavbar ? 'pb-24' : ''}`}>
          {renderView()}
        </div>
        {dbError && (
          <DatabaseErrorModal 
            error={dbError} 
            onRetry={() => {
              setDbError(null);
              window.location.reload();
            }} 
            onClose={() => setDbError(null)} 
          />
        )}
        {showBankWarning && currentView !== AppView.PROFILE && (
          <BankUpdateWarning onUpdate={() => {
            setShowBankWarning(false);
            setCurrentView(AppView.PROFILE);
          }} />
        )}
        {showNavbar && (
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#111111]/95 backdrop-blur-xl border-t border-white/10 px-4 py-4 flex justify-between items-center z-[50] safe-area-bottom">
            {user?.isAdmin ? (
              <>
                <button onClick={() => setCurrentView(AppView.ADMIN_DASHBOARD)} className={`flex flex-col items-center gap-1 flex-1 ${currentView === AppView.ADMIN_DASHBOARD ? 'text-[#ff8c00]' : 'text-gray-500'}`}><LayoutGrid size={22} /><span className="text-[7px] font-black uppercase tracking-widest">Tổng quan</span></button>
                <button onClick={() => setCurrentView(AppView.ADMIN_USERS)} className={`flex flex-col items-center gap-1 flex-1 relative ${currentView === AppView.ADMIN_USERS ? 'text-[#ff8c00]' : 'text-gray-500'}`}>
                  <div className="relative"><Users size={22} />{adminNotificationCount > 0 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center border-2 border-[#111111] animate-bounce"><span className="text-[7px] font-black text-white">{adminNotificationCount}</span></div>}</div>
                  <span className="text-[7px] font-black uppercase tracking-widest">Người dùng</span>
                </button>
                <button onClick={() => setCurrentView(AppView.ADMIN_BUDGET)} className={`flex flex-col items-center gap-1 flex-1 ${currentView === AppView.ADMIN_BUDGET ? 'text-[#ff8c00]' : 'text-gray-500'}`}><Wallet size={22} /><span className="text-[7px] font-black uppercase tracking-widest">Ngân sách</span></button>
                <button onClick={() => setCurrentView(AppView.ADMIN_SYSTEM)} className={`flex flex-col items-center gap-1 flex-1 ${currentView === AppView.ADMIN_SYSTEM ? 'text-[#ff8c00]' : 'text-gray-500'}`}><Settings size={22} /><span className="text-[7px] font-black uppercase tracking-widest">Hệ thống</span></button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => {
                    setSettleLoanFromDash(null);
                    setViewLoanFromDash(null);
                    setCurrentView(AppView.DASHBOARD);
                  }} 
                  className={`flex flex-col items-center gap-1 flex-1 ${currentView === AppView.DASHBOARD ? 'text-[#ff8c00]' : 'text-gray-500'}`}
                >
                  <Home size={22} />
                  <span className="text-[7px] font-black uppercase tracking-widest">Trang chủ</span>
                </button>
                <button 
                  onClick={() => {
                    if (!hasBankInfo(user)) {
                      setShowBankWarning(true);
                      return;
                    }
                    setSettleLoanFromDash(null);
                    setViewLoanFromDash(null);
                    setCurrentView(AppView.APPLY_LOAN);
                  }} 
                  className={`flex flex-col items-center gap-1 flex-1 ${currentView === AppView.APPLY_LOAN ? 'text-[#ff8c00]' : 'text-gray-500'}`}
                >
                  <Briefcase size={22} />
                  <span className="text-[7px] font-black uppercase tracking-widest">Vay</span>
                </button>
                <button 
                  onClick={() => {
                    if (!hasBankInfo(user)) {
                      setShowBankWarning(true);
                      return;
                    }
                    setSettleLoanFromDash(null);
                    setViewLoanFromDash(null);
                    setCurrentView(AppView.RANK_LIMITS);
                  }} 
                  className={`flex flex-col items-center gap-1 flex-1 ${currentView === AppView.RANK_LIMITS ? 'text-[#ff8c00]' : 'text-gray-500'}`}
                >
                  <Medal size={22} />
                  <span className="text-[7px] font-black uppercase tracking-widest">Hạn mức</span>
                </button>
                <button 
                  onClick={() => {
                    setSettleLoanFromDash(null);
                    setViewLoanFromDash(null);
                    setCurrentView(AppView.PROFILE);
                  }} 
                  className={`flex flex-col items-center gap-1 flex-1 ${currentView === AppView.PROFILE ? 'text-[#ff8c00]' : 'text-gray-500'}`}
                >
                  <UserIcon size={22} />
                  <span className="text-[7px] font-black uppercase tracking-widest">Cá nhân</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
