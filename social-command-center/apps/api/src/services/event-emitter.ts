import type { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

/**
 * Initialize the event emitter with the Socket.io server instance.
 */
export function initEventEmitter(socketServer: SocketServer) {
  io = socketServer;
}

/**
 * Emit an event to a specific user's room.
 */
function emitToUser(userId: string, event: string, data: unknown) {
  if (!io) {
    console.warn('[Events] Socket.io not initialized');
    return;
  }
  io.to(`user:${userId}`).emit(event, data);
}

// Post lifecycle events
export function emitPostStatusChange(userId: string, postId: string, status: string) {
  emitToUser(userId, 'post:status', { postId, status, timestamp: Date.now() });
}

export function emitPostPublished(
  userId: string,
  postId: string,
  platform: string,
  platformPostId: string,
  platformUrl: string | null,
) {
  emitToUser(userId, 'post:published', {
    postId,
    platform,
    platformPostId,
    platformUrl,
    timestamp: Date.now(),
  });
}

export function emitPostFailed(
  userId: string,
  postId: string,
  platform: string,
  error: string,
) {
  emitToUser(userId, 'post:failed', {
    postId,
    platform,
    error,
    timestamp: Date.now(),
  });
}

// Media events
export function emitMediaProcessed(userId: string, mediaId: string, status: string) {
  emitToUser(userId, 'media:processed', { mediaId, status, timestamp: Date.now() });
}

// Metrics events
export function emitMetricsUpdated(userId: string, postId: string, platform: string, metrics: unknown) {
  emitToUser(userId, 'metrics:updated', { postId, platform, metrics, timestamp: Date.now() });
}

// Video generation events
export function emitVideoGenerated(
  userId: string,
  jobId: string,
  video: { videoUrl: string; storageKey: string; duration: number },
) {
  emitToUser(userId, 'video:generated', { jobId, ...video, timestamp: Date.now() });
}

export function emitVideoFailed(userId: string, jobId: string, error: string) {
  emitToUser(userId, 'video:failed', { jobId, error, timestamp: Date.now() });
}
