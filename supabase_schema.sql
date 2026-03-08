-- SQL Schema for NDV Money App
-- Run this in your Supabase SQL Editor

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  "fullName" TEXT,
  "idNumber" TEXT,
  balance NUMERIC DEFAULT 0,
  "totalLimit" NUMERIC DEFAULT 0,
  rank TEXT DEFAULT 'standard',
  "rankProgress" NUMERIC DEFAULT 0,
  "isLoggedIn" BOOLEAN DEFAULT false,
  "isAdmin" BOOLEAN DEFAULT false,
  "pendingUpgradeRank" TEXT,
  "rankUpgradeBill" TEXT,
  address TEXT,
  "joinDate" TEXT,
  "idFront" TEXT,
  "idBack" TEXT,
  "refZalo" TEXT,
  relationship TEXT,
  password TEXT,
  "lastLoanSeq" INTEGER DEFAULT 0,
  "bankName" TEXT,
  "bankAccountNumber" TEXT,
  "bankAccountHolder" TEXT,
  "hasJoinedZalo" BOOLEAN DEFAULT false,
  "updatedAt" BIGINT
);

-- 2. Loans Table
CREATE TABLE IF NOT EXISTS loans (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES users(id),
  "userName" TEXT,
  amount NUMERIC NOT NULL,
  date TEXT,
  "createdAt" TEXT,
  status TEXT NOT NULL,
  fine NUMERIC DEFAULT 0,
  "billImage" TEXT,
  "bankTransactionId" TEXT,
  "settlementType" TEXT,
  signature TEXT,
  "rejectionReason" TEXT,
  "updatedAt" BIGINT
);

-- 3. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES users(id),
  title TEXT,
  message TEXT,
  time TEXT,
  read BOOLEAN DEFAULT false,
  type TEXT
);

-- 4. Config Table (for system settings)
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- Insert default config values
INSERT INTO config (key, value) VALUES 
('budget', '30000000'),
('rankProfit', '0'),
('loanProfit', '0'),
('monthlyStats', '[]')
ON CONFLICT (key) DO NOTHING;
