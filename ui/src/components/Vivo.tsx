import { useState, useEffect } from 'react'
import { ObjectInspector } from 'react-inspector';
import Card from "@mui/material/Card"
import Button from "@mui/material/Button"

import { vivoConnection,
         VivoConnection,
         VivoStdoutEventData,
         VivoStdoutEventListener,
         VivoErrorEventListener } from '../lib/vivo'

interface VivoProps {
  setViewData: (val: boolean) => void
}

export default function Vivo({ setViewData }: VivoProps) {
  const [connection, setConnection] = useState<VivoConnection>();
  const [token, setToken] = useState('')

  useEffect(() => {
    const conn = vivoConnection(5489, 'http')
    setConnection(conn)
    conn.once('token-received', tok => {
      setToken(tok);
    })
    return () => {
      conn.close();
    }
  }, []);

  return (
    <div>
    <Button sx={{ paddingLeft: "3rem", paddingRight: "3rem", backgroundColor: "#1669AA", color: "#FFFFFF" }} onClick={() => setViewData(false)}>Go back</Button>

    <p>Sample fluent-bit command:</p>
    <pre>fluent-bit -i cpu -o http -pformat=json -phost=localhost -pport=5489 -puri=/console -ptls=off</pre>

    {connection ? (
      <>
      <FluentBitData connection={connection} limit={100} />
      </>
    ): null}
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
  return rv;
}

function limitRecords(d: VivoStdoutEventData[], max: number): VivoStdoutEventData[] {
  const delta = d.length - max;
  if (delta > 0) {
    return d.slice(delta)
  }
  return d;
}

function FluentBitData({ limit, connection }: FluentBitDataProps) {
  const [records, setRecords] = useState([] as VivoStdoutEventData[]);

  useEffect(() => {
    const stdoutListener: VivoStdoutEventListener = (data) => {
      setRecords(r => limitRecords(r.concat(data), limit))
    };

    const errorListener: VivoErrorEventListener = (data) => {
      console.error('Failed to parse stdout JSON:', data.message)
      console.error('Raw payload:', data.raw)
    };

    connection.on('stdout', stdoutListener);
    connection.on('error', errorListener);

    return () => {
      connection.off('stdout', stdoutListener);
      connection.off('error', errorListener);
    }
  }, [connection, limit])

  return (
    <Card sx={{height: "500px", overflow: 'scroll'}}>
      {reverseMap(records, (r => (
        <ObjectInspector key={r.id} data={r.data}
        />
      )))}
    </Card>
  )
}
