import UnfoldLess from "@mui/icons-material/UnfoldLess"
import UnfoldMore from "@mui/icons-material/UnfoldMore"
import Box from "@mui/material/Box"
import Checkbox from '@mui/material/Checkbox';
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import {linter, Diagnostic} from "@codemirror/lint"
import { stringToIncludes, applyVivoFilter, Filter } from '../lib/filter'

import {
  VivoConnection, VivoStdoutEventData,
} from '../lib/vivo'

interface VivoProps {
  connection: VivoConnection
  records: VivoStdoutEventData[]
  setViewData: (val: boolean) => void
  clearRecords: () => void
  changeFilter: (filter: Filter | null) => void
  filteredRecords: VivoStdoutEventData[]
  filter: Filter | null
}

function exampleFluentBitCommand(port: number) {
  return `fluent-bit -i dummy -o http -pformat=json -phost=localhost -pport=${port} -puri=/console -ptls=off`
}

function exampleCurlCommand(port: number) {
  return `curl -H 'Content-Type: application/json' -d '[{"log": "line 1"},{"log":"line 2"}]' http://localhost:${port}/console`
}

export default function Vivo({
  connection, records, setViewData, clearRecords, filteredRecords, changeFilter, filter
}: VivoProps) {
  const [currentPort, setCurrentPort] = useState(connection.currentPort())
  const [pausedRecords, setPausedRecords] = useState<VivoStdoutEventData[] | null>(null);
  const [filterDiagnostics, setFilterDiagnostics] = useState([] as Diagnostic[])
  const [filterEnabled, setFilterEnabled] = useState(true)

  function linterCallback(): Diagnostic[] {
    return filterDiagnostics
  }

  function filterChanged(fstr: string) {
    if (fstr.trim() === '') {
      return changeFilter(null);
    }
    try {
      const filter = stringToIncludes(fstr);
      changeFilter(filter);
      setFilterDiagnostics([])
    } catch (err) {
      setFilterDiagnostics([{
        from: 1,
        to: 1,
        severity: 'error',
        message: err.message
      }]);
    }
  }

  function togglePause() {
    if (pausedRecords) {
      setPausedRecords(null);
    } else {
      setPausedRecords(records.slice());
    }
  }

  function clear() {
    if (pausedRecords) {
      setPausedRecords([]);
    } else {
      clearRecords();
    }
  }

  function getRecords() {
    if (pausedRecords) {
      return filter && filterEnabled ? applyVivoFilter(filter, pausedRecords) : pausedRecords
    }

    if (filterEnabled) {
      return filteredRecords
    }

    return records
  }

  useEffect(() => {
    connection.on('port-changed', setCurrentPort)

    return () => {
      connection.off('port-changed', setCurrentPort)
    }
  }, [])

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Button variant="contained" sx={{ backgroundColor: "#1669AA" }} onClick={() => setViewData(false)}>Go back</Button>
        <Button variant="contained" sx={{ backgroundColor: "#1669AA" }} onClick={togglePause}>{ pausedRecords ? "Continue" : "Pause" }</Button>
        <Button variant="contained" sx={{ backgroundColor: "#1669AA" }} onClick={clear}>{ "Clear" }</Button>
      </div>

      {currentPort !== null ? <>
        <p>Sample commands to post data:</p>
        <pre>{exampleFluentBitCommand(currentPort)}</pre>
        <pre>{exampleCurlCommand(currentPort)}</pre>
      </> : null}

      <div>
      <Checkbox checked={filterEnabled} onChange={e => setFilterEnabled(e.target.checked)} />
      <span>Filter:</span>
      <CodeMirror
        maxHeight="100px"
        height="auto"
        onChange={filterChanged}
        extensions={[json(), linter(linterCallback)]}
        basicSetup={{ lineNumbers: false }}/>
      <FluentBitData connection={connection} records={getRecords()} />
      </div>
    </div>
  )
}

interface FluentBitDataProps {
  connection: VivoConnection
  records: VivoStdoutEventData[]
}

function FluentBitData({ records, connection }: FluentBitDataProps) {
  const [foldMap, setFoldMap] = useState({})

  const onFold = id => {
    setFoldMap(m => ({ ...m, [id]: !m[id] }))
  }

  return (
    <Box p={2} bgcolor="#FAFAFA" border="1px solid rgba(63, 81, 181, 0.08)" borderRadius={1} maxHeight="60vh" sx={{ overflowY: "auto" }}>
      <List sx={{ display: "flex", flexDirection: "column-reverse" }}>
        {records.map(record => {
          const fold = Object.entries(foldMap).some(([k, v]) => k === record.id && v)
          return (
            <ListItem key={record.id}>
              <Box borderLeft="3px solid #7B61FF" borderRadius="3px" bgcolor={fold ? "#F1F0F9" : "white"} width="100%" px={2} py={0}>
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
