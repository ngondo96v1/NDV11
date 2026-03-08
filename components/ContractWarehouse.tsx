
import React, { useState } from 'react';
import { User } from '../types';
import { FileText, Download, Eye, X, ShieldCheck } from 'lucide-react';
import ContractModal from './ContractModal';

interface ContractWarehouseProps {
  user: User | null;
}

interface Contract {
  id: string;
  amount: number;
  date: string;
}

const ContractWarehouse: React.FC<ContractWarehouseProps> = ({ user }) => {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // System clean: Started with no contracts
  const contracts: Contract[] = [];

  return (
    <div className="w-full bg-black px-5 pb-24 space-y-5 animate-in fade-in duration-500">
      <div className="px-1 pt-3">
        <h2 className="text-xl font-black text-white tracking-tighter uppercase">Kho Hợp Đồng</h2>
      </div>

      <div className="space-y-3">
        {contracts.length === 0 ? (
          <div className="bg-[#111111]/50 border border-white/5 border-dashed rounded-2xl p-12 text-center">
             <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText size={20} className="text-gray-700" />
             </div>
             <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest leading-relaxed">
               Kho dữ liệu trống.<br/>Vui lòng thực hiện ký kết để lưu trữ.
             </p>
          </div>
        ) : (
          contracts.map((contract) => (
            <div 
              key={contract.id}
              className="bg-[#111111] border border-white/5 rounded-2xl p-4 flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1a1a20] rounded-lg flex items-center justify-center text-[#ff8c00]">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">{contract.id}</p>
                  <h4 className="text-sm font-black text-white leading-none">HĐ VAY {contract.amount.toLocaleString()} đ</h4>
                  <p className="text-[9px] font-bold text-gray-500 mt-1">{contract.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button className="w-8 h-8 bg-[#1a1a20] rounded-lg flex items-center justify-center text-gray-500 hover:text-white transition-colors">
                  <Download size={16} />
                </button>
                <button 
                  onClick={() => setSelectedContract(contract)}
                  className="w-8 h-8 bg-[#1a1a20] rounded-lg flex items-center justify-center text-gray-500 group-hover:bg-[#ff8c00] group-hover:text-black transition-all"
                >
                  <Eye size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedContract && (
        <ContractModal 
          contract={selectedContract} 
          user={user} 
          onClose={() => setSelectedContract(null)} 
        />
      )}
    </div>
  );
};

export default ContractWarehouse;
