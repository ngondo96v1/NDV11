
import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

import apiRouter from "./api/index";

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);

  app.use((req, res, next) => {
    // Skip logging for static assets in development to reduce noise
    if (process.env.NODE_ENV !== "production" && (req.url.endsWith(".tsx") || req.url.endsWith(".ts") || req.url.endsWith(".css") || req.url.includes("node_modules"))) {
      return next();
    }
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Mount the API router
  app.use("/api", apiRouter);

  // Fall-through for /api that didn't match any route in apiRouter
  app.use("/api", (req, res) => {
    console.warn(`[SERVER WARN] API route not found in router: ${req.method} ${req.url}`);
    res.status(404).json({
      error: "API Route Not Found",
      message: `Đường dẫn API không tồn tại: ${req.method} ${req.url}`
    });
  });

  // Vite middleware for development
  const distPath = path.join(process.cwd(), "dist");
  const useVite = process.env.NODE_ENV !== "production" || !fs.existsSync(distPath);

  if (useVite) {
    console.log("Using Vite middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files from dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Production build not found. Please run 'npm run build'.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("UNHANDLED ERROR:", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });
}

startServer();
