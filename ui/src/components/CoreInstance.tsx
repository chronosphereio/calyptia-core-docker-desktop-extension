import ErrorIcon from "@mui/icons-material/Error"
import Alert from "@mui/material/Alert"
import AlertTitle from "@mui/material/AlertTitle"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import Chip, { ChipTypeMap } from "@mui/material/Chip"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import LinearProgress from "@mui/material/LinearProgress"
import Stack from "@mui/material/Stack"
import useTheme from "@mui/material/styles/useTheme"
import Typography from "@mui/material/Typography"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from 'react'
import { CLOUD_BASE_URL } from "../consts"
import { useCloudClient } from "../hooks/cloud"
import { useVivoPorts } from "../hooks/vivo"
import { useDockerDesktopClient } from "../hooks/docker-desktop"
import birdDarkSrc from "../images/bird-dark.svg"
import { CoreInstance as CoreInstanceType, CoreInstanceStatus } from "../lib/cloud"
import CoreInstanceMenu from "./CoreInstanceMenu"
import StyledCard from "./StyledCard"
import { SubCard } from "./SubCard"
import Vivo from "./Vivo"

type Props = {
  instanceID: string
  deploymentName: string
}

export default function CoreInstance(props: Props) {
  const dd = useDockerDesktopClient()
  const cloud = useCloudClient()
  const [viewData, setViewData] = useState(false)
  const {
    uiPort,
    httpInputPort,
    forwardInputPort
  } = useVivoPorts();

  const { isError, error: err, isLoading, data: coreInstance } = useQuery(
    ["core_instance", props.instanceID],
    ({ signal }) => cloud.fetchCoreInstance(signal, props.instanceID).then(resp => resp.data),
    {
      refetchInterval: 3000, // 3s
    },
  )

  useEffect(() => {
    if (dd.extension.host === undefined) {
      return
    }

    const deleted = async () => {
      const result = await dd.extension.host?.cli.exec("kubectl", [
        "wait",
        "--for", "delete",
        "deployment/" + props.deploymentName,
        "--timeout", "3s",
        "--context", "docker-desktop",
      ])
      if (result.stderr !== "") {
        throw new Error(result.stderr)
      }
      return result.stdout
    }

    const id = setInterval(() => {
      deleted().then(() => {
        dd.desktopUI.toast.warning("Deployment was deleted")
        window.location.reload()
      }, err => {
        const timeoutSubstr = "error: timed out waiting for the condition"
        if ((err instanceof Error && err.message.includes(timeoutSubstr)) || (typeof err.stderr === "string" && err.stderr.includes(timeoutSubstr))) {
          return
        }
      })
    }, 3000)

    return () => {
      clearInterval(id)
    }
  }, [props.instanceID])

  if (uiPort && viewData) {
    return (
      <Vivo
        uiPort={uiPort}
        httpInputPort={httpInputPort}
        forwardInputPort={forwardInputPort}
        setViewData={setViewData}
      />
    )
  }

  return (
    <Box mb={10}>
      <StyledCard title={coreInstance?.name ?? props.instanceID} subheader={coreInstance?.id} action={coreInstance !== undefined ? (
        <CoreInstanceMenu instanceID={coreInstance.id} />
      ) : undefined}>
        {isError ? (
          <Alert iconMapping={{
            error: <ErrorIcon fontSize="inherit" />,
          }} severity="error" color="error">
            <AlertTitle>Could not fetch core instance from Cloud</AlertTitle>
            {(err as Error).message}
          </Alert>
        ) : isLoading ? (
          <LinearProgress />
        ) : (
          <CoreInstanceView coreInstance={coreInstance} />
        )}
      </StyledCard>
      <Card sx={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", padding: "1rem" }}>
        <div>
          <Typography variant="body1" fontWeight={500}>
            Check your live data with <b>Vivo</b>!
          </Typography>
          <Typography variant="body1">
            Inspect your events live in one space. To get started just add a <b>Vivo</b> destination to your
            pipeline ;)
          </Typography>
        </div>
        <Button variant="contained" onClick={() =>
          setViewData(true)}>Open Vivo</Button>
      </Card>
    </Box>
  )
}

type CoreInstanceViewProps = {
  coreInstance: CoreInstanceType
}

function CoreInstanceView(props: CoreInstanceViewProps) {
  const theme = useTheme()

  delete props.coreInstance["token"]

  return (
    <Stack>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <SubCard>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-end" pb={2}>
              <Typography variant="body1" fontWeight={500}>Core</Typography>
              <CoreInstanceStatusChip status={props.coreInstance.status} />
            </Stack>
            <Divider />
            <Box display="grid" gridTemplateColumns="auto 1fr" gridTemplateRows="auto" mt={2} gap={2}>
              <Typography sx={{ opacity: 0.7 }}>Name</Typography>
              <Typography>{props.coreInstance.name}</Typography>

              <Typography sx={{ opacity: 0.7 }}>Version</Typography>
              <Typography>{props.coreInstance.version}</Typography>

              {Array.isArray(props.coreInstance.tags) && props.coreInstance.tags.length !== 0 ? (
                <>
                  <Typography sx={{ opacity: 0.7 }}>Tags</Typography>
                  <Stack direction="row" gap={1}>{props.coreInstance.tags.map(tag => (
                    <Chip key={tag} label={tag} sx={{ color: theme.palette.mode !== "dark" ? "white" : undefined, bgcolor: theme.palette.mode === "dark" ? "#3D6178" : "#9FA7DA" }} />
                  ))}</Stack>
                </>
              ) : null}
            </Box>
          </SubCard>
        </Grid>

        <Grid item xs={6}>
          <SubCard height="100%">
            <Typography variant="body1" fontWeight={500} pb={2} pt={1}>Kubernetes</Typography>
            <Divider />
            <Box display="grid" gridTemplateColumns="auto 1fr" gridTemplateRows="auto" mt={2} gap={2}>
              <Typography sx={{ opacity: 0.7 }}>Cluster Name</Typography>
              <Typography>{props.coreInstance.metadata?.["k8s.cluster_name"] ?? "Unknown"}</Typography>

              <Typography sx={{ opacity: 0.7 }}>Version</Typography>
              <Typography>{props.coreInstance.metadata?.["k8s.cluster_version"] ?? "Unknown"}</Typography>
            </Box>
          </SubCard>
        </Grid>
      </Grid >
      <Stack my={4} alignItems="center" gap={2}>
        <Typography color="text.secondary" sx={{ opacity: 0.8 }}>Manage your core instance from your browser:</Typography>
        <ManageCoreBtn instanceID={props.coreInstance.id} />
      </Stack>
    </Stack >
  )
}

type ManageCoreBtnProps = {
  instanceID: string
}

function ManageCoreBtn(props: ManageCoreBtnProps) {
  const dd = useDockerDesktopClient()

  return (
    <Button startIcon={<img src={birdDarkSrc} alt="Calyptia bird" />} variant="contained" onClick={() => {
      // TODO: Project selection is not part of the URL yet.
      const host = CLOUD_BASE_URL !== "https://cloud-api.calyptia.com" ? "core-next.calyptia.com" : "core.calyptia.com"
      dd.host.openExternal(`https://${host}/core-instances/${encodeURIComponent(props.instanceID)}`)
    }}>Manage Core</Button>
  )
}

type CoreInstanceStatusProps = {
  status: CoreInstanceStatus
}

function CoreInstanceStatusChip(props: CoreInstanceStatusProps) {
  let c: ChipTypeMap["props"]["color"] = "default"
  switch (props.status) {
    case CoreInstanceStatus.unreachable:
      c = "error"
      break
    case CoreInstanceStatus.running:
      c = "success"
      break
  }
  return <Chip label={props.status} color={c} />
}
