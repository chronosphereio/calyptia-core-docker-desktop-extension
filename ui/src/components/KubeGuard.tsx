import ErrorIcon from "@mui/icons-material/Error"
import Alert from "@mui/material/Alert"
import LinearProgress from "@mui/material/LinearProgress"
import Link from "@mui/material/Link"
import { PropsWithChildren, useEffect, useState } from "react"
import { useDockerDesktopClient } from "../hooks/docker-desktop"

export default function KubeGuard(props: PropsWithChildren<unknown>) {
    const dd = useDockerDesktopClient()
    const [loading, setLoading] = useState(true)
    const [enabled, setEnabled] = useState(false)

    useEffect(() => {
        checkKubeEnabled().then(setEnabled).finally(() => {
            setLoading(false)
        })
    }, [])

    const checkKubeEnabled = async () => {
        if (dd.extension.host === undefined) {
            return false
        }

        try {
            const output = await dd.extension.host.cli.exec("kubectl", [
                "cluster-info",
                "--request-timeout", "1s",
                "--context", "docker-desktop"
            ])
            if (output.stderr !== "") {
                return false
            }

            return true
        } catch (err) {
            return false
        }
    }

    return loading ? (
        <LinearProgress />
    ) : enabled ? <>{props.children}</> : (
        <Alert
            iconMapping={{
                error: <ErrorIcon fontSize="inherit" />,
            }}
            severity="error"
            color="error"
        >
            Seems like a local Kubernetes cluster is not reachable from your Docker Desktop.
            Please take a look at the{" "}<DockerDocsLink />{" "}
            on how to enable the Kubernetes server in Docker Desktop.
        </Alert>
    )
}

function DockerDocsLink() {
    const dd = useDockerDesktopClient()
    return (
        <Link component="button" onClick={() => {
            dd.host.openExternal("https://docs.docker.com/desktop/kubernetes/")
        }}>
            docker documentation
        </Link>
    )
}
