import { createDockerDesktopClient } from "@docker/extension-api-client"
import { v1 } from "@docker/extension-api-client-types"
import ErrorIcon from "@mui/icons-material/Error"
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography
} from "@mui/material"
import { blueGrey } from "@mui/material/colors"
import React, { useEffect } from "react"
import { useProjectToken } from "../hooks/project-token"

// Note: This line relies on Docker Desktop's presence as a host application.
// If you're running this React app in a browser, it won't work properly.
const client = createDockerDesktopClient()

const DockerDesktop = "docker-desktop"
const IsK8sEnabled = "isK8sEnabled"

const isK8sEnabled = () => {
  return localStorage.getItem(IsK8sEnabled) === "true"
}

const refreshData = async (
  setCoreInstanceInfo: React.Dispatch<React.SetStateAction<any>>,
  setIsLoading: React.Dispatch<React.SetStateAction<any>>
) => {
  try {
    if (isK8sEnabled()) {
      const result = await Promise.all([
        getCoreInfo(client),
      ])
      setCoreInstanceInfo(result[0])
    }
  } catch (err: any) {
    if ("stdout" in err && err.stdout.includes("fatal")) {
      localStorage.setItem(IsK8sEnabled, "false")
    }
    console.log("error : ", JSON.stringify(err))
  }
  // Allow us to continue now
  setIsLoading(false)
}

// Common function to call host.cli.exec
const hostCli = async (
  ddClient: v1.DockerDesktopClient,
  command: string,
  args: string[]
) => {
  return ddClient.extension.host?.cli.exec(command, args)
}

// Retrieves `kubectl cluster-info` context-wise
const checkK8sConnection = async (ddClient: v1.DockerDesktopClient) => {
  // kubectl cluster-info --context context-name
  try {
    let output = await hostCli(ddClient, "kubectl", [
      "cluster-info",
      "--request-timeout",
      "1s",
      "--context",
      DockerDesktop,
    ])
    if (output?.stderr) {
      console.log("[checkK8sConnection] : ", output.stderr)
      localStorage.setItem(IsK8sEnabled, "false")
      return false
    }
    if (output?.stdout) {
      console.log("[checkK8sConnection] : ", output?.stdout)
    }
    localStorage.setItem(IsK8sEnabled, "true")
    return true
  } catch (e: any) {
    console.log("[checkK8sConnection] error : ", e)
    localStorage.setItem(IsK8sEnabled, "false")
    return false
  }
}

const getCoreInfo = async (ddClient: v1.DockerDesktopClient) => {
  // Get the UUID from the first deployment with the relevant lablel
  let output = await hostCli(ddClient, "kubectl", [
    "get",
    "deployments",
    "-l",
    "calyptia_aggregator_id",
    "--output=jsonpath={.items[0].metadata.labels.calyptia_aggregator_id}",
    "--context",
    DockerDesktop,
  ])
  if (output?.stderr) {
    console.log("[getCoreInfo] : ", output.stderr)
    return {}
  }
  return output?.stdout
}

export const Core = () => {
  const projectToken = useProjectToken()
  const [coreInstanceInfo, setCoreInstanceInfo] = React.useState<
    string | undefined
  >()
  // We need to ensure when loading we do not auto-launch anything as there is a slight delay checking what is deployed
  const [isLoading, setIsLoading] = React.useState(true)

  useEffect(() => {
    (async () => {
      // @ts-ignore
      checkK8sConnection(client)
      await refreshData(
        setCoreInstanceInfo,
        setIsLoading
      )
    })()

    const dataInterval = setInterval(() => {
      return refreshData(
        setCoreInstanceInfo,
        setIsLoading
      )
    }, 3000)

    return () => {
      clearInterval(dataInterval)
    }
  }, [])
  const createCoreInstance = async (
    ddClient: v1.DockerDesktopClient
  ) => {
    setCoreInstanceInfo(null)

    let args = [
      "create",
      "core_instance",
      "kubernetes",
      "--token",
      projectToken.token,
      "--kube-context",
      DockerDesktop
    ]

    if (process.env.REACT_APP_CLOUD_BASE_URL !== "https://cloud-api.calyptia.com") {
      args.push("--cloud-url", process.env.REACT_APP_CLOUD_BASE_URL)
    }

    let output = await hostCli(ddClient, "calyptia", args)

    if (output?.stderr) {
      console.log(output.stderr)
      return false
    }
    return true
  }

  const uiCreateCoreInstance = async () => {
    try {
      const isCreated = await createCoreInstance(client)
      if (isCreated) {
        client.desktopUI.toast.success("core instance creation successful")
      } else {
        client.desktopUI.toast.error("core instance creation failed")
      }
    } catch (err) {
      client.desktopUI.toast.error(
        "core instance creation failed: " + JSON.stringify(err)
      )
    }
  }

  let component
  if (isLoading) {
    component = (
      <Box
        sx={{
          marginBottom: "15px",
          textAlign: "center",
        }}
      >
        <CircularProgress
          size={50}
          sx={{
            color: blueGrey[500],
          }}
        />
      </Box>
    )
  } else {
    if (isK8sEnabled()) {
      // Check if we have any details
      if (coreInstanceInfo) {
        component = (
          <Stack direction="row" spacing={2}>
            <div>
              <Typography>Core Instance Info:</Typography>
              <Typography>{coreInstanceInfo}</Typography>
              <Button
                onClick={() =>
                  client.host.openExternal(
                    "https://core.calyptia.com/" + coreInstanceInfo
                  )
                }
                color="primary"
                variant="outlined"
              >
                View Core Instance
              </Button>
            </div>
          </Stack>
        )
      } else {
        component = (
          <Button
            onClick={uiCreateCoreInstance}
            color="primary"
            variant="outlined"
          >
            Create Core Instance
          </Button>
        )
      }
    } else {
      component = (
        <Box>
          <Alert
            iconMapping={{
              error: <ErrorIcon fontSize="inherit" />,
            }}
            severity="error"
            color="error"
          >
            Seems like a local Kubernetes cluster is not reachable from your Docker Desktop.
            Please take a look at the{" "}
            <a href="https://docs.docker.com/desktop/kubernetes/">
              docker documentation
            </a>{" "}
            on how to enable the Kubernetes server in Docker Desktop.
          </Alert>
        </Box>
      )
    }
  }
  return (
    <>
      <Typography variant="h3">Calyptia Core extension</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        Calyptia Core Docker Desktop extension
      </Typography>

      <Stack direction="row" alignItems="start" spacing={2} sx={{ mt: 4 }}>
        {component}
      </Stack>
    </>
  )
}
