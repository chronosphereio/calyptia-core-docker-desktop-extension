import UnfoldLess from "@mui/icons-material/UnfoldLess"
import UnfoldMore from "@mui/icons-material/UnfoldMore"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useEffect, useState } from 'react'

import {
  vivoConnection,
  VivoConnection, VivoErrorEventListener, VivoStdoutEventData,
  VivoStdoutEventListener
} from '../lib/vivo'

interface VivoProps {
  setViewData: (val: boolean) => void
}

export default function Vivo({ setViewData }: VivoProps) {
  const [connection, setConnection] = useState<VivoConnection | null>(null)
  const [currentPort, setCurrentPort] = useState<number | null>(null)

  useEffect(() => {
    const conn = vivoConnection()

    conn.on('port-changed', setCurrentPort)

    setConnection(conn)

    return () => {
      conn.off('port-changed', setCurrentPort)
      conn.close()
    }
  }, [])

  return (
    <div>
      <Button variant="contained" sx={{ backgroundColor: "#1669AA" }} onClick={() => setViewData(false)}>Go back</Button>

      {currentPort !== null ? <>
        <p>Sample fluent-bit command:</p>
        <pre>fluent-bit -i cpu -o http -pformat=json -phost=localhost -pport={currentPort} -puri=/console -ptls=off</pre>
      </> : null}

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

function limitRecords(d: VivoStdoutEventData[], max: number): VivoStdoutEventData[] {
  const delta = d.length - max
  if (delta > 0) {
    return d.slice(delta)
  }
  return d
}

function FluentBitData({ limit, connection }: FluentBitDataProps) {
  const [records, setRecords] = useState([] as VivoStdoutEventData[])
  const [foldMap, setFoldMap] = useState({})

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

  const onFold = id => {
    setFoldMap(m => ({ ...m, [id]: !m[id] }))
  }

  console.log({ records })

  return (
    <Box p={2} bgcolor="#FAFAFA" border="1px solid rgba(63, 81, 181, 0.08)" borderRadius={1}>
      <List sx={{ flexDirection: "column-reverse", maxHeight: "60vh", overflowY: "auto" }}>
        {records.map(record => {
          const fold = Object.entries(foldMap).some(([k, v]) => k === record.id && v)
          return (
            <ListItem key={record.id}>
              <Box borderLeft="3px solid #7B61FF" borderRadius="3px" bgcolor="white" width="100%" px={2} py={0}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Box>
                    <Stack direction="row" gap={1} alignItems="center">
                      <Typography color="#7B61FF">{new Date(Number(record.data.date) * 1000).toLocaleString()}</Typography>
                      <IconButton onClick={() => onFold(record.id)}>
                        {fold ? (
                          <UnfoldMore sx={{ color: "#7B61FF" }} />
                        ) : (
                          <UnfoldLess sx={{ color: "#7B61FF" }} />
                        )}
                      </IconButton>
                    </Stack>
                  </Box>
                  <code style={{ whiteSpace: "pre" }}>{JSON.stringify({ ...record.data, date: undefined }, null, fold ? 2 : undefined)}</code>
                </Stack>
              </Box>
            </ListItem>
          )
        })}
      </List>

    </Box>
  )
}
