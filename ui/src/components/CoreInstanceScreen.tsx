import { LinearProgress } from "@mui/material"
import { useEffect, useState } from "react"
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
    const [loading, setLoading] = useState(true)
    const [coreInstanceID, setCoreInstanceID] = useState<string | null>(null)

    const loadCoreInstanceID = async () => {
        try {
            // loads the first core instance id
            const output = await dd.extension.host.cli.exec("kubectl", [
                "get",
                "deployments",
                "-l", "calyptia_aggregator_id",
                "--output=jsonpath={.items[0].metadata.labels.calyptia_aggregator_id}",
                "--context", "docker-desktop",
            ])
            if (output.stderr !== "") {
                throw new Error(output.stderr)
            }

            return output.stdout
        } catch (err) {
            return null
        }
    }

    useEffect(() => {
        loadCoreInstanceID().then(setCoreInstanceID).finally(() => {
            setLoading(false)
        })
    }, [])

    return loading ? (
        <LinearProgress />
    ) : coreInstanceID !== null ? (
        <CoreInstance instanceID={coreInstanceID} />
    ) : (
        <DeployCoreInstance />
    )
}
