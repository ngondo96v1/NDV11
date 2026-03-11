
import React from 'react';
import { Notification } from '../types';
import { X, Bell, CheckCircle2, Award, Info, XCircle } from 'lucide-react';

interface NotificationModalProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ notifications, onClose, onMarkRead }) => {
  const getIcon = (n: Notification) => {
    const isReject = n.title.toLowerCase().includes('từ chối');
    if (isReject) return <XCircle size={18} className="text-red-500" />;

    switch (n.type) {
      case 'LOAN': return <CheckCircle2 size={18} className="text-green-500" />;
      case 'RANK': return <Award size={18} className="text-[#ff8c00]" />;
      default: return <Info size={18} className="text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-[#111111] w-full max-w-md rounded-[3rem] p-8 space-y-8 relative shadow-2xl border border-white/5 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ff8c00]/10 rounded-xl flex items-center justify-center text-[#ff8c00]">
              <Bell size={20} />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Thông báo</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="py-20 text-center space-y-4 opacity-30">
              <Bell size={48} className="mx-auto text-gray-600" />
              <p className="text-[10px] font-black uppercase tracking-widest">Không có thông báo mới</p>
            </div>
          ) : (
            notifications.slice(0, 3).map((n) => {
              const isReject = n.title.toLowerCase().includes('từ chối');
              return (
                <div 
                  key={n.id} 
                  onClick={() => !n.read && onMarkRead(n.id)}
                  className={`p-5 rounded-[2rem] border transition-all relative group ${
                    n.read 
                      ? 'bg-white/[0.02] border-white/5' 
                      : isReject 
                        ? 'bg-red-500/[0.03] border-red-500/20 shadow-lg shadow-red-500/5' 
                        : 'bg-white/[0.05] border-[#ff8c00]/20 shadow-lg shadow-orange-500/5'
                  }`}
                >
                  {!n.read && (
                    <div className={`absolute top-5 right-5 w-2 h-2 rounded-full ${isReject ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-[#ff8c00] shadow-[0_0_8px_rgba(255,140,0,0.5)]'}`}></div>
                  )}
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.read ? 'bg-white/5 text-gray-600' : 'bg-white/10 text-white'}`}>
                      {getIcon(n)}
                    </div>
                    <div className="space-y-1">
                      <h4 className={`text-xs font-black uppercase tracking-tight ${n.read ? 'text-gray-400' : isReject ? 'text-red-400' : 'text-white'}`}>{n.title}</h4>
                      <p className={`text-[10px] font-bold leading-relaxed ${n.read ? 'text-gray-600' : 'text-gray-400'}`}>{n.message}</p>
                      <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest pt-1">{n.time}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button 
          onClick={onClose}
          className="w-full py-5 bg-white/5 border border-white/10 rounded-[2rem] text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export default NotificationModal;
