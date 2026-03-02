import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketServer } from 'socket.io';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { postsRouter } from './routes/posts.js';
import { mediaRouter } from './routes/media.js';
import { aiRouter } from './routes/ai.js';
import { queueRouter } from './routes/queue.js';
import { authMiddleware } from './middleware/auth.js';
import { publishWorker } from './queue/workers/publish.js';
import { schedulerWorker } from './queue/workers/scheduler.js';
import { metricsWorker } from './queue/workers/metrics.js';
import { mediaProcessWorker } from './queue/workers/media-process.js';
import { startTokenRefreshSweep } from './jobs/token-refresh-sweep.js';
import { initEventEmitter } from './services/event-emitter.js';

const app = express();
const httpServer = createServer(app);

// HTTPS for TikTok OAuth (requires https redirect URI)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const certsDir = resolve(__dirname, '../../../certs');
const certExists = existsSync(resolve(certsDir, 'localhost-cert.pem'));

let httpsServer: ReturnType<typeof createHttpsServer> | null = null;
if (certExists) {
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
app.use(cors({ origin: env.APP_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public auth routes (register, login) — no JWT required
app.use('/api/auth', authRouter);

// Protected routes — JWT required
app.use('/api/posts', authMiddleware, postsRouter);
app.use('/api/media', authMiddleware, mediaRouter);
app.use('/api/ai', authMiddleware, aiRouter);
app.use('/api/queue', authMiddleware, queueRouter);

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
console.log('[Workers] Starting publish, scheduler, metrics, media workers...');
publishWorker.on('ready', () => console.log('[Workers] Publish worker ready'));
schedulerWorker.on('ready', () => console.log('[Workers] Scheduler worker ready'));
metricsWorker.on('ready', () => console.log('[Workers] Metrics worker ready'));
mediaProcessWorker.on('ready', () => console.log('[Workers] Media process worker ready'));

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
  ]);
  console.log('[Shutdown] Workers closed');
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
const primaryServer = httpsServer ?? httpServer;
const protocol = httpsServer ? 'https' : 'http';

primaryServer.listen(env.API_PORT, () => {
  console.log(`\n  Social Command Center API`);
  console.log(`  HwinNwin Enterprises x Lumen Systems`);
  console.log(`  ────────────────────────────────────`);
  console.log(`  Server:    ${protocol}://localhost:${env.API_PORT}`);
  console.log(`  Frontend:  ${env.APP_URL}`);
  console.log(`  Env:       ${env.NODE_ENV}`);
  console.log(`  SSL:       ${httpsServer ? 'enabled (self-signed)' : 'disabled'}`);
  console.log(`  Workers:   publish, scheduler, metrics, media`);
  console.log(`  ────────────────────────────────────\n`);
});
