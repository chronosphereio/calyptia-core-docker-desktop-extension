import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import { useEffect, useState } from 'react'
import { ObjectInspector } from 'react-inspector'
import { useDockerDesktopClient } from "../hooks/docker-desktop"

import {
  vivoConnection,
  VivoConnection, VivoErrorEventListener, VivoStdoutEventData,
  VivoStdoutEventListener
} from '../lib/vivo'

interface VivoProps {
  setViewData: (val: boolean) => void
}

export default function Vivo({ setViewData }: VivoProps) {
  const dd = useDockerDesktopClient()
  const [connection, setConnection] = useState<VivoConnection | null>(null)

  useEffect(() => {
    loadVivoPort().then(port => {
      console.log({ port })
      const conn = vivoConnection(port, 'http')
      setConnection(conn)
    }, (err: Error) => {
      console.error(err)
      dd.desktopUI.toast.error(err.message)
    })

    return () => {
      if (connection !== null) {
        connection.close()
      }
    }
  }, [])

  const loadVivoPort = async () => {
    // Get the NodePort value for the HTTP port of the service
    const output = await dd.extension.host.cli.exec("kubectl", [
      "get",
      "service/calyptia-vivo",
      "--output='jsonpath={.spec.ports[?(@.name==\"http\")].nodePort}'",
      "--context", "docker-desktop",
    ])
    if (output.stderr !== "") {
      throw new Error(output.stderr)
    }

    return Number(output.stdout)
  }

  return (
    <div>
      <Button variant="contained" sx={{ backgroundColor: "#1669AA" }} onClick={() => setViewData(false)}>Go back</Button>

      <p>Sample fluent-bit command:</p>
      <pre>fluent-bit -i cpu -o http -pformat=json -phost=calyptia-vivo -pport=5489 -puri=/console -ptls=off</pre>

      {connection !== null ? (
        <>
          <FluentBitData connection={connection} limit={100} />
        </>
      ) : null}
    </div>
  )
}

interface FluentBitDataProps {
  connection: VivoConnection
  limit: number
}

function reverseMap<T>(array: VivoStdoutEventData[], fn: (r: VivoStdoutEventData) => T) {
  const rv = []
  for (let i = array.length - 1; i >= 0; i--) {
    rv.push(fn(array[i]))
  }
  return rv
}

function limitRecords(d: VivoStdoutEventData[], max: number): VivoStdoutEventData[] {
  const delta = d.length - max
  if (delta > 0) {
    return d.slice(delta)
  }
  return d
}

function FluentBitData({ limit, connection }: FluentBitDataProps) {
  const [records, setRecords] = useState([] as VivoStdoutEventData[])

  useEffect(() => {
    const stdoutListener: VivoStdoutEventListener = (data) => {
      setRecords(r => limitRecords(r.concat(data), limit))
    }

    const errorListener: VivoErrorEventListener = (data) => {
      console.error('Failed to parse stdout JSON:', data.message)
      console.error('Raw payload:', data.raw)
    }

    connection.on('stdout', stdoutListener)
    connection.on('error', errorListener)

    return () => {
      connection.off('stdout', stdoutListener)
      connection.off('error', errorListener)
    }
  }, [connection, limit])

  return (
    <Card sx={{ height: "500px", overflow: 'scroll' }}>
      {reverseMap(records, (r => (
        <ObjectInspector key={r.id} data={r.data}
        />
      )))}
    </Card>
  )
}
