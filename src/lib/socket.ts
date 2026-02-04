import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

const normalizeBackendUrl = (value: string) =>
  value.replace(/localhost/g, '127.0.0.1').replace(/\/+$/, '');
const getSocketUrl = () =>
  normalizeBackendUrl(env.PUBLIC_BACKEND_URL || 'http://127.0.0.1:5001');

export const connectSocket = () => {
  if (!browser) {
    return null;
  }
  if (socket) {
    return socket;
  }
  socket = io(getSocketUrl(), {
    withCredentials: true
  });
  console.log('Socket: connecting', { url: getSocketUrl() });
  socket.on('connect', () => {
    console.log('Socket: connected', { id: socket?.id });
  });
  socket.on('error', (payload) => {
    console.log('Socket: server error', payload);
  });
  socket.on('connect_error', (error) => {
    console.log('Socket: connect_error', error);
  });
  socket.on('disconnect', (reason) => {
    console.log('Socket: disconnected', { reason });
  });
  socket.onAny((event, ...args) => {
    console.log('Socket: onAny', { event, args });
  });
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinPlan = (planId: string) => {
  const client = connectSocket();
  if (!client) {
    return;
  }
  if (client.connected) {
    console.log('Socket: plan:join emit (connected)', { plan_id: planId });
    client.emit('plan:join', { plan_id: planId });
  } else {
    client.once('connect', () => {
      console.log('Socket: plan:join emit (after connect)', { plan_id: planId });
      client.emit('plan:join', { plan_id: planId });
    });
  }
};

export const leavePlan = (planId: string) => {
  if (!socket || !socket.connected) {
    return;
  }
  console.log('Socket: plan:leave emit', { plan_id: planId });
  socket.emit('plan:leave', { plan_id: planId });
};

export const sendMessage = (planId: string, message: string) =>
  new Promise<{ sender_id: string; sender_name?: string; text: string; date: string } | null>((resolve) => {
    const client = connectSocket();
    if (!client) {
      resolve(null);
      return;
    }
    console.log('Socket: plan:message:send emit', { plan_id: planId, message });
    client.emit('plan:message:send', { plan_id: planId, message }, (payload: any) => {
      console.log('Socket: plan:message:send ack', payload);
      resolve(payload ?? null);
    });
  });

export const onMessage = (
  handler: (payload: { sender_id: string; sender_name?: string; text: string; date: string }) => void
) => {
  const client = connectSocket();
  if (!client) {
    return () => {};
  }
  const listener = (payload: { sender_id: string; sender_name?: string; text: string; date: string }) => {
    handler(payload);
  };
  client.on('plan:message:new', listener);
  return () => {
    client.off('plan:message:new', listener);
  };
};

export const onUsers = (
  handler: (payload: { msg?: { count?: number } | number; count?: number }) => void
) => {
  const client = connectSocket();
  if (!client) {
    return () => {};
  }
  const listener = (payload: { msg?: { count?: number } | number; count?: number }) => {
    handler(payload);
  };
  client.on('plan:users', listener);
  return () => {
    client.off('plan:users', listener);
  };
};

export const onAnnouncement = (handler: (payload: { msg?: string }) => void) => {
  const client = connectSocket();
  if (!client) {
    return () => {};
  }
  const listener = (payload: { msg?: string }) => {
    handler(payload);
  };
  client.on('plan:announcement', listener);
  return () => {
    client.off('plan:announcement', listener);
  };
};
