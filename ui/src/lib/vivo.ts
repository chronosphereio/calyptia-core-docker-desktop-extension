import { EventEmitter } from 'events'

export interface VivoStdoutEventData {
  id: string
  data: any
}

export interface VivoErrorEventData {
  message: string
  raw: string
}

export interface VivoTokenEventListener {
  (token: string): void
}

export interface VivoStdoutEventListener {
  (newRecords: VivoStdoutEventData[]): void
}

export interface VivoStderrEventListener {
  (data: string): void;
}

export interface VivoErrorEventListener {
  (data: VivoErrorEventData): void;
}

export interface VivoConnection {
  once(event: 'token-received', listener: VivoTokenEventListener): this;
  on(event: 'stdout', listener: VivoStdoutEventListener): this;
  on(event: 'stderr', listener: VivoStderrEventListener): this;
  on(event: 'error', listener: VivoErrorEventListener): this;
  off(event: 'stdout', listener: VivoStdoutEventListener): this;
  off(event: 'stderr', listener: VivoStderrEventListener): this;
  off(event: 'error', listener: VivoErrorEventListener): this;
  close(): void;
}

let connectionId = 1

export function vivoConnection(port: number, datasource: string): VivoConnection {
  const emitter = new EventEmitter()
  const url = `ws://localhost:${port}/flb`
  let socket: WebSocket
  // unique id of the record, used by "key" react property
  let recordId = 1;
  let connId = connectionId++;
  let token: string;

  function init() {
    socket = new WebSocket(url);

    socket.onopen = function(event) {
      console.log('Connected to:', (event.currentTarget as any).url);
      socket.send(JSON.stringify({ datasource }))
    }

    socket.onerror = function(err) {
      console.log('Websocket error:', err)
    }

    socket.onmessage = function(event) {
      const eventData = JSON.parse(event.data)
      if (!token) {
        // first message must be the token
        token = eventData.token;
        emitter.emit('token-received', token);
        return;
      }

      if (eventData.event === 'stdout') {
        if (eventData.records) {
          emitter.emit('stdout', eventData.records.map((r: any) => ({ id: `${connId}:${recordId++}`, data: r })));
        } else {
          emitter.emit('error', {
            message: `Failed to parse stdout JSON: ${eventData.error}`,
            raw: eventData.raw
          });
        }
      } else if (eventData.event === 'stderr') {
        emitter.emit('stderr', eventData.payload)
      }
    }
  }

  const timer = setTimeout(init, 100);

  const rv: VivoConnection = {
    once(event, listener) {
      emitter.once(event, listener);
      return this;
    },

    on(event, listener) {
      emitter.on(event, listener);
      return this;
    },

    off(event, listener) {
      emitter.off(event, listener);
      return this;
    },

    close() {
      clearTimeout(timer);
      if (socket && socket.readyState !== 3) {
        socket.close()
      }
    }
  }

  return rv
}
