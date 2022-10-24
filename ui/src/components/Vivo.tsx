import { json } from '@codemirror/lang-json'
import { Diagnostic, linter } from "@codemirror/lint"
import ArrowBackIosNew from "@mui/icons-material/ArrowBackIosNew"
import UnfoldLess from "@mui/icons-material/UnfoldLess"
import UnfoldMore from "@mui/icons-material/UnfoldMore"
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import ButtonGroup from "@mui/material/ButtonGroup"
import FormControlLabel from "@mui/material/FormControlLabel"
import IconButton from "@mui/material/IconButton"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import Stack from "@mui/material/Stack"
import Switch from "@mui/material/Switch"
import Tab from '@mui/material/Tab'
import Typography from "@mui/material/Typography"
import CodeMirror from '@uiw/react-codemirror'
import { useEffect, useState } from 'react'
import { applyVivoFilter, Filter, stringToIncludes } from '../lib/filter'
import {
  VivoConnection, VivoStdoutEventData
} from '../lib/vivo'
import StyledCard from "./StyledCard"

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
  const [pausedRecords, setPausedRecords] = useState<VivoStdoutEventData[] | null>(null)
  const [filterDiagnostics, setFilterDiagnostics] = useState([] as Diagnostic[])
  const [filterEnabled, setFilterEnabled] = useState(true)

  function linterCallback(): Diagnostic[] {
    return filterDiagnostics
  }

  function filterChanged(fstr: string) {
    if (fstr.trim() === '') {
      return changeFilter(null)
    }
    try {
      const filter = stringToIncludes(fstr)
      changeFilter(filter)
      setFilterDiagnostics([])
    } catch (err) {
      setFilterDiagnostics([{
        from: 1,
        to: 1,
        severity: 'error',
        message: err.message
      }])
    }
  }

  function togglePause() {
    if (pausedRecords) {
      setPausedRecords(null)
    } else {
      setPausedRecords(records.slice())
    }
  }

  function clear() {
    if (pausedRecords) {
      setPausedRecords([])
    } else {
      clearRecords()
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
    <Box mb={10}>
      <StyledCard title="Live Data Viewer" subheader="All your events in only one space" action={(
        <Box>
          <Button sx={{ color: "#404186" }} startIcon={<ArrowBackIosNew />} onClick={() => {
            setViewData(false)
          }}>
            Back
          </Button>
        </Box>
      )}>
        {currentPort !== null ? <>
          <SampleCommands port={currentPort} />
        </> : null}

        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <ButtonGroup variant="outlined">
            <Button sx={{ width: "calc(8ch + 2rem)" }} onClick={togglePause}>{pausedRecords ? "Continue" : "Pause"}</Button>
            <Button sx={{ width: "calc(8ch + 2rem)" }} onClick={clear}>{"Clear"}</Button>
          </ButtonGroup>
          <FormControlLabel label="Filter" control={(
            <Switch checked={filterEnabled} onChange={e => setFilterEnabled(e.target.checked)} />
          )} />
        </Stack>

        {filterEnabled && (
          <Box bgcolor="#FAFAFA" border="1px solid rgba(63, 81, 181, 0.08)" borderRadius={1} my={2}>
            <CodeMirror
              placeholder="Search through your logs records that include the following text"
              maxHeight="40vh"
              height="auto"
              onChange={filterChanged}
              extensions={[json(), linter(linterCallback)]}
              basicSetup={{ lineNumbers: false }} />
          </Box>
        )}

        <FluentBitData records={getRecords()} />
      </StyledCard>
    </Box>
  )
}

interface FluentBitDataProps {
  records: VivoStdoutEventData[]
}

function FluentBitData({ records }: FluentBitDataProps) {
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

type SampleCommandsProps = {
  port: number
}

function SampleCommands(props: SampleCommandsProps) {
  const [value, setValue] = useState('1')

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue)
  }

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <Typography>Sample Commands to Send Data</Typography>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab label="Fluent-Bit" value="1" />
            <Tab label="Curl" value="2" />
          </TabList>
        </Box>
        <TabPanel value="1" sx={{ pl: 0, pr: 0 }}>
          <Box bgcolor="#FAFAFA" border="1px solid rgba(63, 81, 181, 0.08)" borderRadius={1} px={2} overflow="auto">
            <pre>{exampleFluentBitCommand(props.port)}</pre>
          </Box>
        </TabPanel>
        <TabPanel value="2" sx={{ pl: 0, pr: 0 }}>
          <Box bgcolor="#FAFAFA" border="1px solid rgba(63, 81, 181, 0.08)" borderRadius={1} px={2} overflow="auto">
            <pre>{exampleCurlCommand(props.port)}</pre>
          </Box>
        </TabPanel>
      </TabContext>
    </Box>
  )
}
