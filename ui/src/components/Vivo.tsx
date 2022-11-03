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
import useTheme from "@mui/material/styles/useTheme"
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
import { SubCard } from "./SubCard"

const logAccentColor = "#7B61FF"

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
  const theme = useTheme()
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
          <Button sx={{ color: "text.primary" }} startIcon={<ArrowBackIosNew />} onClick={() => {
            setViewData(false)
          }}>
            Back
          </Button>
        </Box>
      )}>
        {currentPort !== null ? <>
          <SampleCommands port={currentPort} />
        </> : null}

        <Stack direction="row" alignItems="center" justifyContent="flex-end" mb={1}>
          <FormControlLabel label="Filter" control={(
            <Switch checked={filterEnabled} onChange={e => setFilterEnabled(e.target.checked)} />
          )} />
          <ButtonGroup variant="outlined">
            <Button sx={{ width: "calc(8ch + 2rem)" }} onClick={togglePause}>{pausedRecords ? "Continue" : "Pause"}</Button>
            <Button sx={{ width: "calc(8ch + 2rem)" }} onClick={clear}>{"Clear"}</Button>
          </ButtonGroup>
        </Stack>

        {filterEnabled && (
          <Box my={2} borderRadius={1} overflow="hidden" border="1px solid rgba(63, 81, 181, 0.08)">
            <CodeMirror
              placeholder="Search through your logs records that include the following text"
              maxHeight="40vh"
              height="auto"
              theme={theme.palette.mode}
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
  const theme = useTheme()
  const [foldMap, setFoldMap] = useState({})

  const onFold = id => {
    setFoldMap(m => ({ ...m, [id]: !m[id] }))
  }

  return (
    <SubCard maxHeight="60vh" sx={{ overflowY: "auto" }}>
      <List sx={{ display: "flex", flexDirection: "column-reverse" }}>
        {records.map(record => {
          const fold = Object.entries(foldMap).some(([k, v]) => k === record.id && v)
          return (
            <ListItem key={record.id}>
              <Box borderRadius="3px" width="100%" px={2} py={0.5} bgcolor={fold ? theme.palette.mode === "dark" ? "#224154" : "#F1F0F9" : theme.palette.mode === "dark" ? "#274252" : "#fff"} borderLeft={"3px solid " + logAccentColor}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Box>
                    <Stack direction="row" gap={1} alignItems="center">
                      <Typography color={logAccentColor}>{new Date(Number(record.data.date) * 1000).toLocaleString()}</Typography>
                      <IconButton onClick={() => onFold(record.id)}>
                        {fold ? (
                          <UnfoldMore />
                        ) : (
                          <UnfoldLess />
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
    </SubCard>
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
    <Box sx={{ width: '100%' }}>
      <Typography>Sample Commands to Send Data</Typography>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab label="Fluent Bit" value="1" />
            <Tab label="Curl" value="2" />
          </TabList>
        </Box>
        <TabPanel value="1" sx={{ pl: 0, pr: 0 }}>
          <SubCard overflow="auto" py={0}>
            <pre>{exampleFluentBitCommand(props.port)}</pre>
          </SubCard>
        </TabPanel>
        <TabPanel value="2" sx={{ pl: 0, pr: 0 }}>
          <SubCard overflow="auto" py={0}>
            <pre>{exampleCurlCommand(props.port)}</pre>
          </SubCard>
        </TabPanel>
      </TabContext>
    </Box>
  )
}
