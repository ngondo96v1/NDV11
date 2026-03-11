
import React, { useState, useRef } from 'react';
import { Database, Settings, AlertCircle, RefreshCw, X, Check, Download, Upload, Loader2 } from 'lucide-react';

interface AdminSystemProps {
  onReset: () => void;
  onImportSuccess: () => void;
  onBack: () => void;
}

const AdminSystem: React.FC<AdminSystemProps> = ({ onReset, onImportSuccess, onBack }) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleResetExecute = () => {
    onReset();
    setShowResetConfirm(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/data?isAdmin=true');
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      
      // Remove sensitive or unnecessary fields if needed
      const exportData = {
        ...data,
        exportDate: new Date().toISOString(),
        version: '1.26'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ndv_money_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export error:', e);
      alert('Lỗi khi xuất dữ liệu');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);

          // Basic validation
          if (!data.users || !data.loans) {
            throw new Error('Định dạng file không hợp lệ');
          }

          const response = await fetch('/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Lỗi khi nhập dữ liệu');
          }

          setImportMessage({ type: 'success', text: 'Nhập dữ liệu thành công! Hệ thống đang cập nhật...' });
          setTimeout(() => onImportSuccess(), 1500);
        } catch (err: any) {
          setImportMessage({ type: 'error', text: err.message || 'Lỗi khi xử lý file' });
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (e) {
      setIsImporting(false);
      setImportMessage({ type: 'error', text: 'Lỗi khi đọc file' });
    }
    
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="w-full bg-black px-5 pb-24 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex items-center gap-3 pt-8 mb-6 px-1">
        <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
          CÀI ĐẶT HỆ THỐNG
        </h1>
      </div>

      {/* Data Management Section */}
      <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 space-y-6 mb-5">
        <div className="flex items-center gap-2.5">
          <Database className="text-[#ff8c00]" size={18} />
          <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Quản lý dữ liệu</h4>
        </div>

        {/* Backup & Restore */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3 hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
          >
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
              {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
            </div>
            <div className="text-center">
              <h5 className="text-[9px] font-black text-white uppercase tracking-widest">Xuất dữ liệu</h5>
              <p className="text-[7px] font-bold text-gray-500 uppercase mt-1">Sao lưu JSON</p>
            </div>
          </button>

          <button 
            onClick={handleImportClick}
            disabled={isImporting}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3 hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
          >
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
              {isImporting ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
            </div>
            <div className="text-center">
              <h5 className="text-[9px] font-black text-white uppercase tracking-widest">Nhập dữ liệu</h5>
              <p className="text-[7px] font-bold text-gray-500 uppercase mt-1">Khôi phục từ file</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json" 
              className="hidden" 
            />
          </button>
        </div>

        {importMessage && (
          <div className={`p-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
            importMessage.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            {importMessage.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
            {importMessage.text}
          </div>
        )}

        <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5 space-y-5">
          <div className="flex gap-3.5">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle className="text-red-500" size={20} />
            </div>
            <div className="space-y-1.5">
              <h5 className="text-[9px] font-black text-red-500 uppercase tracking-widest">Khôi phục mặc định (Reset)</h5>
              <p className="text-[9px] font-bold text-gray-400 leading-relaxed uppercase tracking-tighter">
                Hành động này sẽ xóa toàn bộ danh sách khách hàng, lịch sử vay, nhật ký hệ thống và đưa ngân sách về mặc định là 30.000.000 VNĐ.
              </p>
            </div>
          </div>

          <button 
            onClick={() => setShowResetConfirm(true)}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-red-900/20 active:scale-95 transition-all flex items-center justify-center gap-2.5"
          >
            <RefreshCw size={14} />
            Thực thi Reset toàn bộ
          </button>
        </div>
      </div>

      {/* Rules Configuration Section */}
      <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-2.5">
          <Settings className="text-blue-500" size={18} />
          <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Cấu hình quy định</h4>
        </div>

        <div className="p-3">
          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-relaxed italic text-center">
            Tính năng cấu hình lãi suất, ngày trả cố định, API Zalo... đang được phát triển trong phiên bản tiếp theo.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-10 text-center opacity-30">
        <p className="text-[7px] font-black text-gray-500 uppercase tracking-[0.3em]">System Kernel v1.26 PRO</p>
      </div>

      {/* Popup xác nhận Reset hệ thống */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className="bg-[#111111] border border-red-500/20 w-full max-w-sm rounded-3xl p-6 space-y-6 relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 bg-red-600/10 rounded-full flex items-center justify-center text-red-600">
                 <AlertCircle size={28} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">RESET HỆ THỐNG?</h3>
                <p className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed px-3">
                  Thao tác này sẽ <span className="text-red-500 font-black">XÓA VĨNH VIỄN</span> toàn bộ khách hàng, lịch sử vay và logs. Ngân sách sẽ quay về <span className="text-white font-black">30.000.000 đ</span>.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5">
               <button 
                 onClick={() => setShowResetConfirm(false)}
                 className="flex-1 py-3.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-gray-500 uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 <X size={12} /> HỦY BỎ
               </button>
               <button 
                 onClick={handleResetExecute}
                 className="flex-1 py-3.5 bg-red-600 rounded-xl text-[9px] font-black text-white uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/40"
               >
                 <Check size={12} /> ĐỒNG Ý RESET
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSystem;
