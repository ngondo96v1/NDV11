
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  const testUserId = "TEST-OVERDUE-001";
  const testPhone = "0987654321";
  const testPassword = "password123"; // In a real app, this should be hashed if bcrypt is used on server

  console.log("Creating test user 1...");
  await supabase.from('users').upsert({
    id: testUserId,
    phone: testPhone,
    fullName: "Nguyễn Văn Test (Quá Hạn)",
    idNumber: "123456789012",
    balance: 5000000,
    totalLimit: 10000000,
    rank: 'standard',
    isLoggedIn: false,
    password: testPassword,
    joinDate: new Date().toLocaleDateString('vi-VN'),
    address: "123 Đường Test, Hà Nội",
    bankName: "Timo",
    bankAccountNumber: "0877203996",
    bankAccountHolder: "NGUYEN VAN TEST"
  });

  console.log("Creating test user 2 (Simple)...");
  await supabase.from('users').upsert({
    id: "TEST-SIMPLE-001",
    phone: "0123456789",
    fullName: "Người Dùng Thử Nghiệm",
    idNumber: "987654321098",
    balance: 10000000,
    totalLimit: 10000000,
    rank: 'silver',
    isLoggedIn: false,
    password: "123456",
    joinDate: new Date().toLocaleDateString('vi-VN'),
    address: "456 Đường Lê Lợi, TP.HCM",
    bankName: "Vietcombank",
    bankAccountNumber: "1234567890",
    bankAccountHolder: "NGUYEN VAN TEST SIMPLE"
  });

  console.log("Creating overdue loan...");
  // Create a date 15 days ago for the loan date
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 15); 
  
  const d = String(pastDate.getDate()).padStart(2, '0');
  const m = String(pastDate.getMonth() + 1).padStart(2, '0');
  const y = pastDate.getFullYear();
  const dateStr = `${d}/${m}/${y}`;

  const now = new Date();
  const nowD = String(now.getDate()).padStart(2, '0');
  const nowM = String(now.getMonth() + 1).padStart(2, '0');
  const nowY = now.getFullYear();
  const nowStr = `${nowD}/${nowM}/${nowY}`;

  const { error: loanError } = await supabase.from('loans').upsert({
    id: `LOAN-TEST-OVERDUE`,
    userId: testUserId,
    userName: "Nguyễn Văn Test (Quá Hạn)",
    amount: 2000000,
    date: dateStr,
    createdAt: `${now.toLocaleTimeString('vi-VN')} ${nowStr}`,
    status: 'ĐANG NỢ',
    fine: 50000,
    updatedAt: Date.now()
  });

  if (loanError) {
    console.error("Error creating loan:", loanError);
    return;
  }

  console.log("Test data seeded successfully!");
  console.log("User ID:", testUserId);
  console.log("Phone:", testPhone);
  console.log("Password:", testPassword);
}

seed();
