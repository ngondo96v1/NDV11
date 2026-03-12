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

const router = express.Router();

// Debug middleware to log incoming requests
router.use((req, res, next) => {
  console.log(`[API DEBUG] ${req.method} ${req.url} (Base: ${req.baseUrl})`);
  next();
});

// Middleware to check Supabase reachability
router.use(async (req, res, next) => {
  if (req.path === '/api-health' || req.path === '/supabase-status') return next();
  
  if (!supabase) {
    return res.status(500).json({
      error: "Cấu hình Supabase không hợp lệ",
      message: "Hệ thống chưa được cấu hình Supabase URL hoặc Service Role Key."
    });
  }

  const reachability = await checkSupabaseReachability();
  if (!reachability.reachable) {
    console.error(`[API ERROR] Supabase unreachable for ${req.method} ${req.url}:`, reachability.error || reachability.status);
    return res.status(503).json({
      error: "Dịch vụ tạm thời không khả dụng",
      message: "Không thể kết nối tới cơ sở dữ liệu Supabase. Có thể dự án đã bị tạm dừng hoặc đang gặp sự cố kỹ thuật (502 Bad Gateway).",
      details: reachability.error || `Status: ${reachability.status}`
    });
  }
  next();
});

// Helper to safely stringify data that might contain BigInt
const safeJsonStringify = (data: any) => {
  return JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
};

// Helper to send JSON response safely
const sendSafeJson = (res: express.Response, data: any, status = 200) => {
  try {
    const json = safeJsonStringify(data);
    res.status(status).set('Content-Type', 'application/json').send(json);
  } catch (e: any) {
    console.error("[API ERROR] Failed to serialize JSON:", e);
    res.status(500).json({
      error: "Lỗi serialization",
      message: "Không thể chuyển đổi dữ liệu sang JSON: " + e.message
    });
  }
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
router.get("/supabase-status", async (req, res) => {
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

// Helper to check if Supabase is reachable
const checkSupabaseReachability = async () => {
  if (!SUPABASE_URL) return { reachable: false, error: "Supabase URL is missing" };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(SUPABASE_URL, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    return { reachable: response.ok || response.status < 500, status: response.status };
  } catch (e: any) {
    return { reachable: false, error: e.message };
  }
};

// API Routes
router.get("/data", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const isAdmin = req.query.isAdmin === 'true';

    if (!supabase) {
      return res.status(500).json({
        error: "Cấu hình Supabase không hợp lệ",
        message: "Hệ thống chưa được cấu hình Supabase URL hoặc Service Role Key."
      });
    }

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
      } catch (e: any) {
        console.error("Lỗi fetch users:", e.message || e);
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
      } catch (e: any) {
        console.error("Lỗi fetch loans:", e.message || e);
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
      } catch (e: any) {
        console.error("Lỗi fetch notifications:", e.message || e);
        return [];
      }
    };

    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase.from('config').select('*');
        if (error) throw error;
        return data || [];
      } catch (e: any) {
        console.error("Lỗi fetch config:", e.message || e);
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

    sendSafeJson(res, {
      ...payload,
      storageFull: isFull,
      storageUsage: usage.toFixed(2)
    });
  } catch (e: any) {
    console.error("Lỗi nghiêm trọng trong /api/data:", e);
    res.status(500).json({ 
      error: "Lỗi hệ thống", 
      message: `Đã xảy ra lỗi nghiêm trọng: ${e.message || "Không xác định"}. Vui lòng kiểm tra lại kết nối Supabase.` 
    });
  }
});

router.post("/users", async (req, res) => {
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
    
    sendSafeJson(res, { success: true });
  } catch (e: any) {
    console.error("Lỗi trong /api/users:", e);
    res.status(500).json({ error: "Internal Server Error", message: e.message });
  }
});

router.post("/loans", async (req, res) => {
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
    
    sendSafeJson(res, { success: true });
  } catch (e: any) {
    console.error("Lỗi trong /api/loans:", e);
    res.status(500).json({ error: "Internal Server Error", message: e.message });
  }
});

router.post("/notifications", async (req, res) => {
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
    
    sendSafeJson(res, { success: true });
  } catch (e: any) {
    console.error("Lỗi trong /api/notifications:", e);
    res.status(500).json({ error: "Internal Server Error", message: e.message });
  }
});

router.post("/budget", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    const { budget } = req.body;
    const { error } = await supabase.from('config').upsert({ key: 'budget', value: budget }, { onConflict: 'key' });
    if (error) throw error;
    sendSafeJson(res, { success: true });
  } catch (e: any) {
    console.error("Lỗi trong /api/budget:", e);
    res.status(500).json({ error: "Internal Server Error", message: e.message });
  }
});

router.post("/rankProfit", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    const { rankProfit } = req.body;
    const { error } = await supabase.from('config').upsert({ key: 'rankProfit', value: rankProfit }, { onConflict: 'key' });
    if (error) throw error;
    sendSafeJson(res, { success: true });
  } catch (e: any) {
    console.error("Lỗi trong /api/rankProfit:", e);
    res.status(500).json({ error: "Internal Server Error", message: e.message });
  }
});

router.post("/loanProfit", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    const { loanProfit } = req.body;
    const { error } = await supabase.from('config').upsert({ key: 'loanProfit', value: loanProfit }, { onConflict: 'key' });
    if (error) throw error;
    sendSafeJson(res, { success: true });
  } catch (e: any) {
    console.error("Lỗi trong /api/loanProfit:", e);
    res.status(500).json({ error: "Internal Server Error", message: e.message });
  }
});

router.post("/monthlyStats", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    const { monthlyStats } = req.body;
    const { error } = await supabase.from('config').upsert({ key: 'monthlyStats', value: monthlyStats }, { onConflict: 'key' });
    if (error) throw error;
    sendSafeJson(res, { success: true });
  } catch (e: any) {
    console.error("Lỗi trong /api/monthlyStats:", e);
    res.status(500).json({ error: "Internal Server Error", message: e.message });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    const userId = req.params.id;
    await Promise.all([
      supabase.from('users').delete().eq('id', userId),
      supabase.from('loans').delete().eq('userId', userId),
      supabase.from('notifications').delete().eq('userId', userId)
    ]);
    sendSafeJson(res, { success: true });
  } catch (e: any) {
    console.error("Lỗi trong DELETE /api/users/:id:", e);
    res.status(500).json({ error: "Internal Server Error", message: e.message });
  }
});

router.post("/sync", async (req, res) => {
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
    
    sendSafeJson(res, { success: true });
  } catch (e: any) {
    console.error("Lỗi trong /api/sync:", e);
    res.status(500).json({ error: "Internal Server Error", message: e.message });
  }
});

router.post("/reset", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    
    // Delete all data except admin
    await Promise.all([
      supabase.from('users').delete().neq('id', 'AD01'),
      supabase.from('loans').delete().neq('id', 'KEEP_NONE'),
      supabase.from('notifications').delete().neq('id', 'KEEP_NONE'),
      supabase.from('config').upsert({ key: 'budget', value: 30000000 }, { onConflict: 'key' }),
      supabase.from('config').upsert({ key: 'rankProfit', value: 0 }, { onConflict: 'key' }),
      supabase.from('config').upsert({ key: 'loanProfit', value: 0 }, { onConflict: 'key' }),
      supabase.from('config').upsert({ key: 'monthlyStats', value: [] }, { onConflict: 'key' })
    ]);
    
    sendSafeJson(res, { success: true });
  } catch (e: any) {
    console.error("Lỗi trong /api/reset:", e);
    res.status(500).json({ error: "Internal Server Error", message: e.message });
  }
});

router.post("/import", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase not configured" });
    const { users, loans, notifications, budget, rankProfit, loanProfit, monthlyStats } = req.body;
    
    // 1. Upsert users first to satisfy foreign key constraints in loans/notifications
    if (users && Array.isArray(users) && users.length > 0) {
      const { error: userError } = await supabase.from('users').upsert(users, { onConflict: 'id' });
      if (userError) {
        console.error("Import users error:", userError);
        return res.status(500).json({ success: false, message: "Lỗi khi lưu danh sách người dùng", error: userError });
      }
    }
    
    // 2. Upsert other data in parallel
    const tasks = [];
    
    if (loans && Array.isArray(loans) && loans.length > 0) {
      tasks.push(supabase.from('loans').upsert(loans, { onConflict: 'id' }));
    }
    
    if (notifications && Array.isArray(notifications) && notifications.length > 0) {
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
    
    if (tasks.length > 0) {
      const results = await Promise.all(tasks);
      const errors = results.filter(r => r.error).map(r => r.error);
      
      if (errors.length > 0) {
        console.error("Import secondary data errors:", errors);
        return res.status(500).json({ success: false, message: "Lỗi khi lưu dữ liệu phụ trợ", errors });
      }
    }
    
    sendSafeJson(res, { success: true });
  } catch (e: any) {
    console.error("Lỗi trong /api/import:", e);
    res.status(500).json({ error: "Internal Server Error", message: e.message });
  }
});

// Specific health check for Vercel deployment verification
router.get("/api-health", (req, res) => {
  res.json({ 
    status: "ok", 
    environment: process.env.NODE_ENV || 'production', 
    supabase: !!supabase,
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method
  });
});

// Export the router for Vercel
router.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[API ROUTER ERROR]:", err);
  const status = err.status || err.statusCode || 500;
  sendSafeJson(res, {
    error: "API Error",
    message: err.message || "Đã xảy ra lỗi trong quá trình xử lý API",
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  }, status);
});

export default router;
