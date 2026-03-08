import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

const isValidUrl = (url: string) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

const isPlaceholder = (val: string) => 
  !val || val.includes("your-project-id") || val.includes("your-service-role-key") || val === "https://your-project-id.supabase.co";

const supabase = (() => {
  try {
    if (SUPABASE_URL && SUPABASE_KEY && isValidUrl(SUPABASE_URL) && !isPlaceholder(SUPABASE_URL) && !isPlaceholder(SUPABASE_KEY)) {
      console.log("Initializing Supabase client with URL:", SUPABASE_URL);
      return createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    console.warn("Supabase credentials missing, invalid, or using placeholders.");
    return null;
  } catch (e) {
    console.error("Failed to initialize Supabase client:", e);
    return null;
  }
})();

const STORAGE_LIMIT_MB = 45; // Virtual limit for demo purposes

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Debug middleware to log incoming requests on Vercel
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    console.log(`[API] ${req.method} ${req.url}`);
  }
  next();
});

// Helper to safely stringify data that might contain BigInt
const safeJsonStringify = (data: any) => {
  return JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
};

// Helper to estimate JSON size in MB
const getStorageUsage = (data: any) => {
  try {
    const str = safeJsonStringify(data);
    return (Buffer.byteLength(str, 'utf8') / (1024 * 1024));
  } catch (e) {
    console.error("Error calculating storage usage:", e);
    return 0;
  }
};

let isCleaningUp = false;

// Auto-cleanup task: Delete old notifications and loans efficiently
const autoCleanupStorage = async () => {
  if (!supabase || isCleaningUp) return;
  
  isCleaningUp = true;
  try {
    console.log("[Cleanup] Starting storage cleanup...");
    const now = new Date();
    
    // 1. Cleanup Notifications: Delete all but the 10 most recent per user
    const { data: allNotifs, error: fetchError } = await supabase.from('notifications')
      .select('id, userId')
      .order('id', { ascending: false });
    
    if (fetchError) throw fetchError;

    if (allNotifs && allNotifs.length > 0) {
      const userNotifCounts: Record<string, number> = {};
      const idsToDelete: string[] = [];
      
      for (const notif of allNotifs) {
        userNotifCounts[notif.userId] = (userNotifCounts[notif.userId] || 0) + 1;
        if (userNotifCounts[notif.userId] > 3) {
          idsToDelete.push(notif.id);
        }
      }
      
      if (idsToDelete.length > 0) {
        for (let i = 0; i < idsToDelete.length; i += 100) {
          const chunk = idsToDelete.slice(i, i + 100);
          await supabase.from('notifications').delete().in('id', chunk);
        }
        console.log(`[Cleanup] Deleted ${idsToDelete.length} old notifications`);
      }
    }

    // 2. Cleanup Loans: Delete Rejected and Settled (>3d)
    // This mechanism keeps the database clean by removing old history
    // Rejected loans are deleted after 3 days
    // Settled loans are deleted after 3 days to save storage space
    const threeDaysAgo = now.getTime() - (3 * 24 * 60 * 60 * 1000);

    const { error: err1 } = await supabase.from('loans')
      .delete()
      .eq('status', 'BỊ TỪ CHỐI')
      .lt('updatedAt', threeDaysAgo);
    
    const { error: err2 } = await supabase.from('loans')
      .delete()
      .eq('status', 'ĐÃ TẤT TOÁN')
      .lt('updatedAt', threeDaysAgo);

    if (err1 || err2) console.error("[Cleanup] Error deleting old loans:", err1 || err2);
    
    console.log("[Cleanup] Storage cleanup completed.");
  } catch (e) {
    console.error("Lỗi auto-cleanup:", e);
  } finally {
    isCleaningUp = false;
  }
};

// Supabase Status check for Admin
app.get(["/api/supabase-status", "/supabase-status"], async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ 
        connected: false, 
        error: "Chưa cấu hình Supabase hoặc URL không hợp lệ. Vui lòng kiểm tra biến môi trường." 
      });
    }
    
    // Use a more standard count query
    const { error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error("Supabase connection error details:", error);
      return res.json({ 
        connected: false, 
        error: `Lỗi kết nối Supabase: ${error.message} (${error.code})` 
      });
    }
    
    res.json({ connected: true, message: "Kết nối Supabase ổn định" });
  } catch (e: any) {
    console.error("Critical error in /supabase-status:", e);
    res.json({ connected: false, error: `Lỗi hệ thống: ${e.message}` });
  }
});

// API Routes
app.get(["/api/data", "/data"], async (req, res) => {
  try {
    if (!supabase) {
      console.error("Supabase client not initialized. Check environment variables.");
      return res.status(500).json({
        error: "Cấu hình Supabase không hợp lệ",
        message: "Hệ thống chưa được cấu hình Supabase URL hoặc Service Role Key."
      });
    }

    const userId = req.query.userId as string;
    const isAdmin = req.query.isAdmin === 'true';

    // Individual query functions with role-based filtering
    const fetchUsers = async () => {
      try {
        let query = supabase.from('users').select('*');
        if (!isAdmin && userId) {
          query = query.eq('id', userId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (e) {
        console.error("Lỗi fetch users:", e);
        return [];
      }
    };

    const fetchLoans = async () => {
      try {
        let query = supabase.from('loans').select('*');
        if (!isAdmin && userId) {
          query = query.eq('userId', userId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (e) {
        console.error("Lỗi fetch loans:", e);
        return [];
      }
    };

    const fetchNotifications = async () => {
      try {
        let query = supabase.from('notifications').select('*').order('id', { ascending: false });
        if (!isAdmin && userId) {
          query = query.eq('userId', userId);
        }
        const { data, error } = await query.limit(100);
        if (error) throw error;
        return data || [];
      } catch (e) {
        console.error("Lỗi fetch notifications:", e);
        return [];
      }
    };

    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase.from('config').select('*');
        if (error) throw error;
        return data || [];
      } catch (e) {
        console.error("Lỗi fetch config:", e);
        return [];
      }
    };

    // Parallelize queries
    const [users, loans, notifications, config] = await Promise.all([
      fetchUsers(),
      fetchLoans(),
      fetchNotifications(),
      fetchConfig()
    ]);

    const budget = Number(config?.find(c => c.key === 'budget')?.value ?? 30000000);
    const rankProfit = Number(config?.find(c => c.key === 'rankProfit')?.value ?? 0);
    const loanProfit = Number(config?.find(c => c.key === 'loanProfit')?.value ?? 0);
    const monthlyStats = config?.find(c => c.key === 'monthlyStats')?.value || [];

    const payload = {
      users,
      loans,
      notifications,
      budget,
      rankProfit,
      loanProfit,
      monthlyStats
    };

    // Only calculate storage usage if explicitly requested
    let usage = 0;
    if (req.query.checkStorage === 'true') {
      usage = getStorageUsage(payload);
    }
    
    const isFull = usage > STORAGE_LIMIT_MB;

    // Run cleanup in background if usage is high
    if (usage > STORAGE_LIMIT_MB * 0.8) {
      autoCleanupStorage();
    }

    res.json({
      ...payload,
      storageFull: isFull,
      storageUsage: usage.toFixed(2)
    });
  } catch (e: any) {
    console.error("Lỗi nghiêm trọng trong /api/data:", e);
    res.status(500).json({ 
      error: "Lỗi hệ thống", 
      message: e.message || "Đã xảy ra lỗi không xác định khi truy xuất dữ liệu từ Supabase. Vui lòng kiểm tra lại bảng và quyền truy cập." 
    });
  }
});

app.post(["/api/users", "/users"], async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    const incomingUsers = req.body;
    if (!Array.isArray(incomingUsers)) {
      return res.status(400).json({ error: "Dữ liệu phải là mảng" });
    }

    // Bulk upsert is much more efficient than a loop
    const { error } = await supabase.from('users').upsert(incomingUsers, { onConflict: 'id' });
    if (error) {
      console.error("Lỗi upsert users:", error);
      return res.status(500).json({ 
        error: "Lỗi cơ sở dữ liệu", 
        message: error.message, 
        code: error.code,
        hint: error.hint || "Hãy đảm bảo bạn đã chạy SQL schema trong Supabase SQL Editor."
      });
    }
    
    res.json({ success: true });
  } catch (e) {
    console.error("Lỗi trong /api/users:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post(["/api/loans", "/loans"], async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    const incomingLoans = req.body;
    if (!Array.isArray(incomingLoans)) {
      return res.status(400).json({ error: "Dữ liệu phải là mảng" });
    }

    // Anti-replay check for bankTransactionId
    for (const loan of incomingLoans) {
      if (loan.bankTransactionId) {
        const { data: existing, error: checkError } = await supabase
          .from('loans')
          .select('id')
          .eq('bankTransactionId', loan.bankTransactionId)
          .neq('id', loan.id)
          .limit(1);
        
        if (checkError) {
          console.error("Lỗi check bankTransactionId:", checkError);
        } else if (existing && existing.length > 0) {
          return res.status(400).json({ 
            error: "Giao dịch đã tồn tại", 
            message: `Mã giao dịch ${loan.bankTransactionId} đã được sử dụng cho một khoản vay khác. Vui lòng kiểm tra lại.` 
          });
        }
      }
    }

    // Bulk upsert
    const { error } = await supabase.from('loans').upsert(incomingLoans, { onConflict: 'id' });
    if (error) {
      console.error("Lỗi upsert loans:", error);
      return res.status(500).json({ 
        error: "Lỗi cơ sở dữ liệu", 
        message: error.message, 
        code: error.code,
        hint: error.hint || "Hãy đảm bảo bạn đã chạy SQL schema trong Supabase SQL Editor."
      });
    }
    
    res.json({ success: true });
  } catch (e) {
    console.error("Lỗi trong /api/loans:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post(["/api/notifications", "/notifications"], async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    const incomingNotifs = req.body;
    if (!Array.isArray(incomingNotifs)) {
      return res.status(400).json({ error: "Dữ liệu phải là mảng" });
    }

    // Bulk upsert
    const { error } = await supabase.from('notifications').upsert(incomingNotifs, { onConflict: 'id' });
    if (error) {
      console.error("Lỗi upsert notifications:", error);
      return res.status(500).json({ 
        error: "Lỗi cơ sở dữ liệu", 
        message: error.message, 
        code: error.code,
        hint: error.hint || "Hãy đảm bảo bạn đã chạy SQL schema trong Supabase SQL Editor."
      });
    }
    
    res.json({ success: true });
  } catch (e) {
    console.error("Lỗi trong /api/notifications:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post(["/api/budget", "/budget"], async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    const { budget } = req.body;
    const { error } = await supabase.from('config').upsert({ key: 'budget', value: budget }, { onConflict: 'key' });
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    console.error("Lỗi trong /api/budget:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post(["/api/rankProfit", "/rankProfit"], async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    const { rankProfit } = req.body;
    const { error } = await supabase.from('config').upsert({ key: 'rankProfit', value: rankProfit }, { onConflict: 'key' });
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    console.error("Lỗi trong /api/rankProfit:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post(["/api/loanProfit", "/loanProfit"], async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    const { loanProfit } = req.body;
    const { error } = await supabase.from('config').upsert({ key: 'loanProfit', value: loanProfit }, { onConflict: 'key' });
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    console.error("Lỗi trong /api/loanProfit:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post(["/api/monthlyStats", "/monthlyStats"], async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    const { monthlyStats } = req.body;
    const { error } = await supabase.from('config').upsert({ key: 'monthlyStats', value: monthlyStats }, { onConflict: 'key' });
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    console.error("Lỗi trong /api/monthlyStats:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete(["/api/users/:id", "/users/:id"], async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    const userId = req.params.id;
    await Promise.all([
      supabase.from('users').delete().eq('id', userId),
      supabase.from('loans').delete().eq('userId', userId),
      supabase.from('notifications').delete().eq('userId', userId)
    ]);
    res.json({ success: true });
  } catch (e) {
    console.error("Lỗi trong DELETE /api/users/:id:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post(["/api/sync", "/sync"], async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    const { users, loans, notifications, budget, rankProfit, loanProfit, monthlyStats } = req.body;
    
    const tasks = [];
    
    if (users && Array.isArray(users)) {
      tasks.push(supabase.from('users').upsert(users, { onConflict: 'id' }));
    }
    
    if (loans && Array.isArray(loans)) {
      tasks.push(supabase.from('loans').upsert(loans, { onConflict: 'id' }));
    }
    
    if (notifications && Array.isArray(notifications)) {
      tasks.push(supabase.from('notifications').upsert(notifications, { onConflict: 'id' }));
    }
    
    if (budget !== undefined) {
      tasks.push(supabase.from('config').upsert({ key: 'budget', value: budget }, { onConflict: 'key' }));
    }
    
    if (rankProfit !== undefined) {
      tasks.push(supabase.from('config').upsert({ key: 'rankProfit', value: rankProfit }, { onConflict: 'key' }));
    }

    if (loanProfit !== undefined) {
      tasks.push(supabase.from('config').upsert({ key: 'loanProfit', value: loanProfit }, { onConflict: 'key' }));
    }

    if (monthlyStats !== undefined) {
      tasks.push(supabase.from('config').upsert({ key: 'monthlyStats', value: monthlyStats }, { onConflict: 'key' }));
    }
    
    const results = await Promise.all(tasks);
    const errors = results.filter(r => r.error).map(r => r.error);
    
    if (errors.length > 0) {
      console.error("Sync errors:", errors);
      return res.status(207).json({ success: false, errors });
    }
    
    res.json({ success: true });
  } catch (e: any) {
    console.error("Lỗi trong /api/sync:", e);
    res.status(500).json({ error: e.message || "Internal Server Error" });
  }
});

// Specific health check for Vercel deployment verification
app.get(["/api/api-health", "/api-health", "/api", "/"], (req, res) => {
  res.json({ 
    status: "ok", 
    environment: process.env.NODE_ENV || 'production', 
    supabase: !!supabase,
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method
  });
});

// 404 handler for API routes
app.use((req, res) => {
  console.warn(`404 API Route: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: "API Route Not Found", 
    path: req.url,
    method: req.method,
    message: "Nếu bạn thấy lỗi này trên Vercel, hãy kiểm tra lại cấu hình rewrites trong vercel.json. Đảm bảo /api/(.*) trỏ về /api/index.ts"
  });
});

// Export the app for Vercel
export default app;
