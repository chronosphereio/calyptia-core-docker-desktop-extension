import ErrorIcon from "@mui/icons-material/Error"
import { LinearProgress } from "@mui/material"
import Alert from "@mui/material/Alert"
import AlertTitle from "@mui/material/AlertTitle"
import { useEffect, useState } from "react"
import { useCloudClient } from "../hooks/cloud"
import { useDockerDesktopClient } from "../hooks/docker-desktop"
import CoreInstance from "./CoreInstance"
import DeployCoreInstance from "./DeployCoreInstance"
import KubeGuard from "./KubeGuard"

export default function CoreInstanceScreen() {
    return (
        <KubeGuard>
            <CoreInstanceDeploymentLoader />
        </KubeGuard>
    )
}

function CoreInstanceDeploymentLoader() {
    const dd = useDockerDesktopClient()
    const cloud = useCloudClient()
    const [loading, setLoading] = useState(true)
    const [coreInstance, setCoreInstance] = useState<{ id: string, deploymentName: string } | null>(null)
    const [err, setErr] = useState<Error | null>(null)

    const loadCoreInstanceID = async (signal: AbortSignal) => {
        try {
            // loads the first core instance id
            const output = await dd.extension.host.cli.exec("kubectl", [
                "get",
                "deployments",
                "-l", `"calyptia_aggregator_id, !calyptia_pipeline_id"`,
                "-o", `"jsonpath-as-json={.items[0].metadata['labels.calyptia_aggregator_id', 'name']}"`,
                "--context", "docker-desktop",
            ])
            if (output.stderr !== "") {
                throw new Error(output.stderr)
            }

            const [id, deploymentName] = JSON.parse(output.stdout)
            // Double check with Cloud API to warranty that the instance exists
            // in Cloud and not only locally.
            await cloud.fetchCoreInstance(signal, id)
            return { id, deploymentName }
        } catch (err) {
            // Case were nothing found in label selector.
            if (typeof err.stderr === "string" && err.stderr.includes("array index out of bounds")) {
                return null
            }

            // Case were the core instance was deleted using Core UI and the
            // kubernetes deployment was not actually deleted.
            if (err.message === "aggregator not found") {
                return null
            }
            throw err
        }
    }

    useEffect(() => {
        const ctrl = new AbortController()
        loadCoreInstanceID(ctrl.signal).then(setCoreInstance, err => {
            console.error(err)
            setErr(err)
        }).finally(() => {
            setLoading(false)
        })
        return () => {
            ctrl.abort()
        }
    }, [])

    if (err != null) {
        return (
            <Alert iconMapping={{
                error: <ErrorIcon fontSize="inherit" />,
            }} severity="error" color="error">
                <AlertTitle>Could not fetch core instance from Cloud</AlertTitle>
                {(err as Error).message}
            </Alert>
        )
    }

    if (loading) {
        return (
            <LinearProgress />
        )
    }

    return coreInstance !== null ? (
        <CoreInstance instanceID={coreInstance.id} deploymentName={coreInstance.deploymentName} />
    ) : (
        <DeployCoreInstance />
    )
}
