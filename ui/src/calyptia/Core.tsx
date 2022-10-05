import React, {useEffect} from "react";
import { createDockerDesktopClient } from '@docker/extension-api-client';
import {v1} from "@docker/extension-api-client-types";
import {Alert, Box, Button, CircularProgress, TextField, Stack, Typography } from "@mui/material";
import {blueGrey} from "@mui/material/colors";
import ErrorIcon from '@mui/icons-material/Error';

// Note: This line relies on Docker Desktop's presence as a host application.
// If you're running this React app in a browser, it won't work properly.
const client = createDockerDesktopClient();

export const DockerDesktop = "docker-desktop";
export const CurrentExtensionContext = "currentExtensionContext"
export const IsK8sEnabled = "isK8sEnabled"

const isK8sEnabled = () => {
  return localStorage.getItem(IsK8sEnabled) === "true";
}

const refreshData = async (setCurrentHostContext: React.Dispatch<React.SetStateAction<any>>) => {
    try {
        if (isK8sEnabled()) {
            const result = await Promise.all([getCurrentHostContext(client)]);
            setCurrentHostContext(result[0]);
        }
    } catch (err: any) {
        if ("stdout" in err && err.stdout.includes("fatal")) {
            localStorage.setItem(IsK8sEnabled, "false")
        }
        console.log("error : ", JSON.stringify(err));
    }
}

// set context on extension container
export const setExtensionContext = async (ddClient: v1.DockerDesktopClient, context: string) => {
  // update current extension context using localstorage
  localStorage.setItem(CurrentExtensionContext, context);
}

// Change context on extension container
export const getExtensionContext = () => {
  // retrieve extension current context
  return localStorage.getItem(CurrentExtensionContext) || DockerDesktop;
}

// Common function to call host.cli.exec
const hostCli = async (ddClient: v1.DockerDesktopClient, command: string, args: string[]) => {
  return ddClient.extension.host?.cli.exec(command, args);
}


// Retrieves host's current k8s context
export const getCurrentHostContext = async (ddClient: v1.DockerDesktopClient) => {
  // kubectl config view -o jsonpath='{.current-context}'
  let output = await hostCli(ddClient, "kubectl", ["config", "view", "-o", "jsonpath='{.current-context}'"]);
  if (output?.stderr) {
      console.log("[getCurrentHostContext] : ", output.stderr);
      return {};
  }
  return output?.stdout;
}

// Retrieves `kubectl cluster-info` context-wise
export const checkK8sConnection = async (ddClient: v1.DockerDesktopClient) => {
  // kubectl cluster-info --context context-name
  try {
      let output = await hostCli(ddClient, "kubectl", ["cluster-info", "--request-timeout", "2s", "--context", getExtensionContext()]);
      if (output?.stderr) {
          console.log("[checkK8sConnection] : ", output.stderr);
          localStorage.setItem(IsK8sEnabled, "false")
          return false;
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

export const Core = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentHostContext, setCurrentHostContext] = React.useState("");
  const [projectToken, setProjectToken] = React.useState<string | undefined>();
  const [coreInstanceInfo, setCoreInstanceInfo] = React.useState<string | undefined>();

  useEffect(() => {
    (async () => {
        // @ts-ignore
        checkK8sConnection(client);
        await refreshData(setCurrentHostContext)
    })();

    const dataInterval = setInterval(() => {
        return refreshData(setCurrentHostContext)
    }, 5000);

    return () => {
        clearInterval(dataInterval);
    }
}, []);
    const runCore = async (ddClient: v1.DockerDesktopClient, args: string[]) => {
        setCoreInstanceInfo(null)
        let output = await hostCli(ddClient, "calyptia", args);

        if (output?.stderr) {
            console.log(output.stderr);
            return false;
        }
        if (output?.stdout) {
            setCoreInstanceInfo(output.stdout)
        }
        return true;
    }

  const uiRunCore = async () => {
    if ( projectToken === "" ) {
        client.desktopUI.toast.error("no project token");   
    } else {
        try {
            let args = ["create", "core_instance", "kubernetes", "--token", projectToken]
            const isCreated = await runCore(client, args);
            if (isCreated) {
                client.desktopUI.toast.success("core instance creation successful");
            } else {
                client.desktopUI.toast.error("core instance creation failed");
            }
        } catch (err) {
            client.desktopUI.toast.error("core instance creation failed: " + JSON.stringify(err));
        }
    }
};

  let component
  if (isLoading) {
    component = <Box sx={{
        marginBottom: "15px",
        textAlign: "center"
    }}>
        <CircularProgress
            size={50}
            sx={{
                color: blueGrey[500],
            }}
        />
    </Box>
} else {
    if (isK8sEnabled()) {
        // client.host.openExternal("https://cloud.calyptia.com");
        component =<Stack direction="row" spacing={2}>
                <TextField
        value={projectToken}
        onChange={(event) => setProjectToken(event.target.value)}
        autoFocus
        variant="outlined"
        margin="dense"
        id="token"
        label="Calyptia Project Token"
        type="text"
        size="medium"
        fullWidth
        required/>
        <Button onClick={uiRunCore} color="primary" variant="outlined">
            Create Core Instance
        </Button>
        {coreInstanceInfo ? (
        <div>
          <Typography>Core Instance Info:</Typography>
          <Typography>{coreInstanceInfo}</Typography>
        </div>
        ) : (
            ''
          )}
    </Stack>
        } else {
      component = <Box>
      <Alert iconMapping={{
          error: <ErrorIcon fontSize="inherit"/>,
      }} severity="error" color="error">
          Seems like Kubernetes is not reachable from your Docker Desktop.
          Please take a look at the <a href="https://docs.docker.com/desktop/kubernetes/">docker
          documentation</a> on how to enable the Kubernetes server in docker-desktop and then select
          docker-desktop context.
          For other type of k8s clusters, check if kube-apiserver of your k8s cluster is reachable from your
          host machine.
      </Alert>
  </Box>
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
  );
}
}
