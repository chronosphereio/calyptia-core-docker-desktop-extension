import { createDockerDesktopClient } from "@docker/extension-api-client"
import { EventEmitter } from 'events'

function sleep(duration: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
}

export interface VivoStdoutEventData {
  id: string
  data: Record<string, unknown>
}

export interface VivoErrorEventData {
  message: string
  raw: string
}

export interface VivoStdoutEventListener {
  (newRecords: VivoStdoutEventData[]): void
}

export interface VivoStderrEventListener {
  (data: string): void
}

export interface VivoErrorEventListener {
  (data: VivoErrorEventData): void
}

export interface VivoPortChangedEventListener {
  (newPort: number): void
}

export interface VivoConnection {
  on(event: 'stdout', listener: VivoStdoutEventListener): this
  on(event: 'stderr', listener: VivoStderrEventListener): this
  on(event: 'error', listener: VivoErrorEventListener): this
  on(event: 'port-changed', listener: VivoPortChangedEventListener): this
  off(event: 'stdout', listener: VivoStdoutEventListener): this
  off(event: 'stderr', listener: VivoStderrEventListener): this
  off(event: 'error', listener: VivoErrorEventListener): this
  off(event: 'port-changed', listener: VivoPortChangedEventListener): this
  close(): void
}

let connectionId = 1
const dd = createDockerDesktopClient()

async function getVivoPort(): Promise<number> {
  while (true) {
    try {
      // Get the NodePort value for the HTTP port of the service
      const output = await dd.extension.host.cli.exec("kubectl", [
        "get",
        "service/calyptia-vivo",
        "--output=jsonpath='{.spec.ports[?\\(@.name==\\\"http\\\"\\)].nodePort}'",
        "--context", "docker-desktop",
      ])
      if (output.stderr !== "") {
        console.warn('failed to get kubernetes port:', output.stderr)
        await sleep(5000)
        continue
      }
      return parseInt(output.stdout)
    } catch (err: any) {
      console.error('error invoking desktop extension api:', err)
      await sleep(10000)
      continue
    }
  }
}

export function vivoConnection(): VivoConnection {
  const emitter = new EventEmitter()
  let socket: WebSocket
  // unique id of the record, used by "key" react property
  let recordId = 1
  let connId = connectionId++
  let firstMessage = true
  let timer: ReturnType<typeof setTimeout>


  function reset() {
    if (timer) {
      clearTimeout(timer)
    }
    if (socket && socket.readyState !== 3) {
      socket.close()
    }
    firstMessage = true
    timer = setTimeout(init, 100)
  }

  async function init() {
    const port = await getVivoPort()
    emitter.emit('port-changed', port)
    const url = `ws://localhost:${port}/flb`
    socket = new WebSocket(url)

    socket.onopen = function (event) {
      console.log('Connected to:', (event.currentTarget as any).url)
      socket.send(JSON.stringify({ datasource: 'http' }))
    }

    socket.onerror = function (err) {
      console.log('Websocket error:', err)
    }

    socket.onmessage = function (event) {
      const eventData = JSON.parse(event.data)
      console.log(eventData)
      if (firstMessage) {
        firstMessage = false
        return
      }

      if (eventData.event === 'stdout') {
        if (eventData.records) {
          emitter.emit('stdout', eventData.records.map((r: any) => ({ id: `${connId}:${recordId++}`, data: r })))
        } else {
          emitter.emit('error', {
            message: `Failed to parse stdout JSON: ${eventData.error}`,
            raw: eventData.raw
          })
        }
      } else if (eventData.event === 'stderr') {
        emitter.emit('stderr', eventData.payload)
      }
    }

    socket.onclose = reset

    socket.onerror = function (e) {
      console.error('websocket error:', e)
      reset()
    }
  }

  reset()

  const rv: VivoConnection = {
    on(event, listener) {
      emitter.on(event, listener)
      return this
    },

    off(event, listener) {
      emitter.off(event, listener)
      return this
    },

    close() {
      clearTimeout(timer)
      if (socket && socket.readyState !== 3) {
        socket.close()
      }
    }
  }

  return rv
}
