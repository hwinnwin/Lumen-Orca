import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketServer } from 'socket.io';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { postsRouter } from './routes/posts.js';
import { mediaRouter, publicMediaRouter } from './routes/media.js';
import { aiRouter } from './routes/ai.js';
import { queueRouter } from './routes/queue.js';
import { settingsRouter } from './routes/settings.js';
import { generatorRouter } from './routes/generator.js';
import { authMiddleware } from './middleware/auth.js';
import { publishWorker } from './queue/workers/publish.js';
import { schedulerWorker } from './queue/workers/scheduler.js';
import { metricsWorker } from './queue/workers/metrics.js';
import { mediaProcessWorker } from './queue/workers/media-process.js';
import { videoGenerateWorker } from './queue/workers/video-generate.js';
import { startTokenRefreshSweep } from './jobs/token-refresh-sweep.js';
import { initEventEmitter } from './services/event-emitter.js';

const app = express();
const httpServer = createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Trust proxy in production (Railway runs behind a reverse proxy)
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// HTTPS for local dev (TikTok OAuth requires https redirect URI)
const certsDir = resolve(__dirname, '../../../certs');
const certExists = existsSync(resolve(certsDir, 'localhost-cert.pem'));

let httpsServer: ReturnType<typeof createHttpsServer> | null = null;
if (certExists && env.NODE_ENV !== 'production') {
  httpsServer = createHttpsServer(
    {
      key: readFileSync(resolve(certsDir, 'localhost-key.pem')),
      cert: readFileSync(resolve(certsDir, 'localhost-cert.pem')),
    },
    app,
  );
}

// Socket.io – attach to whichever servers are available
const io = new SocketServer(httpsServer ?? httpServer, {
  cors: {
    origin: env.APP_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));

// In production, allow same-origin (frontend served by same Express server)
// plus the APP_URL for flexibility. In dev, just allow APP_URL.
const corsOrigin = env.NODE_ENV === 'production'
  ? [env.APP_URL, 'https://scc.hwinnwin.com'].filter(Boolean)
  : env.APP_URL;
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public auth routes (register, login) — no JWT required
app.use('/api/auth', authRouter);

// Public media routes — signed token auth for external platform access (Instagram, etc.)
app.use('/api/media', publicMediaRouter);

// Protected routes — JWT required
app.use('/api/posts', authMiddleware, postsRouter);
app.use('/api/media', authMiddleware, mediaRouter);
app.use('/api/ai', authMiddleware, aiRouter);
app.use('/api/queue', authMiddleware, queueRouter);
app.use('/api/settings', authMiddleware, settingsRouter);
app.use('/api/generator', authMiddleware, generatorRouter);

// Production: serve the built frontend as static files
if (env.NODE_ENV === 'production') {
  const frontendDist = resolve(__dirname, '../../web/dist');
  if (existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    // SPA fallback — serve index.html for all non-API routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
        res.sendFile(join(frontendDist, 'index.html'));
      }
    });
    console.log(`[Static] Serving frontend from ${frontendDist}`);
  } else {
    console.warn(`[Static] Frontend dist not found at ${frontendDist}`);
  }
}

// Catch-all: log any unmatched requests (helps debug OAuth redirect issues)
app.use((req, _res, next) => {
  if (!req.path.startsWith('/socket.io')) {
    console.log(`[Unmatched] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join-user', (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined room user:${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Initialize event emitter with Socket.io instance
initEventEmitter(io);

// Export io for use in other modules
export { io };

// Start BullMQ workers
console.log('[Workers] Starting publish, scheduler, metrics, media, video workers...');
publishWorker.on('ready', () => console.log('[Workers] Publish worker ready'));
schedulerWorker.on('ready', () => console.log('[Workers] Scheduler worker ready'));
metricsWorker.on('ready', () => console.log('[Workers] Metrics worker ready'));
mediaProcessWorker.on('ready', () => console.log('[Workers] Media process worker ready'));
videoGenerateWorker.on('ready', () => console.log('[Workers] Video generate worker ready'));

// Start token refresh sweep
startTokenRefreshSweep();

// Graceful shutdown
async function shutdown() {
  console.log('\n[Shutdown] Closing workers...');
  await Promise.all([
    publishWorker.close(),
    schedulerWorker.close(),
    metricsWorker.close(),
    mediaProcessWorker.close(),
    videoGenerateWorker.close(),
  ]);
  console.log('[Shutdown] Workers closed');
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server — Railway sets PORT env var, fallback to API_PORT
const port = env.PORT ?? env.API_PORT;
const primaryServer = httpsServer ?? httpServer;
const protocol = httpsServer ? 'https' : 'http';

primaryServer.listen(port, () => {
  console.log(`\n  Social Command Center API`);
  console.log(`  HwinNwin Enterprises x Lumen Systems`);
  console.log(`  ────────────────────────────────────`);
  console.log(`  Server:    ${protocol}://0.0.0.0:${port}`);
  console.log(`  Frontend:  ${env.APP_URL}`);
  console.log(`  Env:       ${env.NODE_ENV}`);
  console.log(`  SSL:       ${httpsServer ? 'enabled (self-signed)' : 'disabled'}`);
  console.log(`  Workers:   publish, scheduler, metrics, media`);
  console.log(`  ────────────────────────────────────\n`);
});
