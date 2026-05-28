import { EventEmitter } from 'events';

declare global {
  var sseEmitterGlobal: EventEmitter | undefined;
}

// Ensure a single instance across hot-reloads in development
export const sseEmitter = globalThis.sseEmitterGlobal || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalThis.sseEmitterGlobal = sseEmitter;
}

// Increase max listeners to prevent memory leak warnings if many connections
sseEmitter.setMaxListeners(100);
