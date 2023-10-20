import ArrowBackIosNew from "@mui/icons-material/ArrowBackIosNew"
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Tab from '@mui/material/Tab'
import Typography from "@mui/material/Typography"
import { useState, useEffect, useRef } from 'react'
import StyledCard from "./StyledCard"
import { SubCard } from "./SubCard"

interface VivoProps {
  setViewData: (val: boolean) => void
  uiPort: number
  httpInputPort: number
  forwardInputPort: number
}

function exampleFluentBitCommand(port: number) {
  return `fluent-bit -i dummy -o http -pformat=json -phost=localhost -pport=${port} -puri=/sink -ptls=off`
}

function exampleCurlCommand(port: number) {
  return `curl -H 'Content-Type: application/json' -d '[{"log": "line 1"},{"log":"line 2"}]' http://localhost:${port}/sink`
}

export default function Vivo({
  setViewData,
  uiPort,
  httpInputPort,
  forwardInputPort
}: VivoProps) {
  const containerRef = useRef();

  const [dimensions, setDimensions] = useState({
    width: 1200,
    height: 900
  });

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const div = containerRef.current as HTMLElement
    function onWindowResize() {
      setDimensions(d => ({
        width: div.clientWidth,
        height: d.height
      }));
    }
    onWindowResize();
    window.addEventListener("resize", onWindowResize);

    return () => {
      window.removeEventListener("resize", onWindowResize);
    }
  }, []);

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
        <SampleCommands httpInputPort={httpInputPort} forwardInputPort={forwardInputPort} />

        <div ref={containerRef}>
          <iframe
            src={`http://localhost:${uiPort}`}
            width={`${dimensions.width}px`}
            height={`${dimensions.height}px`}
            title="vivo-frame"
            className="vivo-frame">
          </iframe>
        </div>

      </StyledCard>
    </Box>
  )
}

type SampleCommandsProps = {
  httpInputPort: number
  forwardInputPort: number
}

function SampleCommands(props: SampleCommandsProps) {
  const [value, setValue] = useState('1')

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue)
  }

  if (!props.httpInputPort || !props.forwardInputPort) {
    return (<></>)
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
            <pre>{exampleFluentBitCommand(props.httpInputPort)}</pre>
          </SubCard>
        </TabPanel>
        <TabPanel value="2" sx={{ pl: 0, pr: 0 }}>
          <SubCard overflow="auto" py={0}>
            <pre>{exampleCurlCommand(props.httpInputPort)}</pre>
          </SubCard>
        </TabPanel>
      </TabContext>
    </Box>
  )
}
