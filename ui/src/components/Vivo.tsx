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
    <Box p={2} bgcolor="#FAFAFA">
      <List>
        {records.map(record => {
          const fold = Object.entries(foldMap).some(([k, v]) => k === record.id && v)
          return (
            <ListItem key={record.id}>
              <Box borderLeft="3px solid #7B61FF" borderRadius="3px" bgcolor="white" width="100%" p={2}>
                <Stack direction="row" gap={1}>
                  <Box>
                    <Stack direction="row" gap={1} alignItems="center">
                      <Typography color="#7B61FF">{new Date(Number(record.data.date) * 1000).toLocaleDateString()}</Typography>
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
