import ErrorIcon from "@mui/icons-material/Error"
import Alert from "@mui/material/Alert"
import AlertTitle from "@mui/material/AlertTitle"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import LinearProgress from "@mui/material/LinearProgress"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useEffect, useState } from "react"
import { useCloudClient } from "../hooks/cloud"
import { useDockerDesktopClient } from "../hooks/docker-desktop"
import birdDarkSrc from "../images/bird-dark.svg"
import { CoreInstance as CoreInstanceType } from "../lib/cloud"
import StyledCard from "./StyledCard"

type Props = {
    instanceID: string
}

export default function CoreInstance(props: Props) {
    const cloud = useCloudClient()
    const [coreInstance, setCoreInstance] = useState<CoreInstanceType | null>(null)
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState<Error | null>(null)

    useEffect(() => {
        const ctrl = new AbortController()

        setErr(null)
        setLoading(true)

        cloud.fetchCoreInstance(ctrl.signal, props.instanceID).then(resp => {
            setCoreInstance(resp.data)
        }, setErr).finally(() => {
            setLoading(false)
        })

        return () => {
            ctrl.abort()
        }
    }, [props.instanceID])

    return (
        <Box mb={10}>
            <StyledCard title={coreInstance?.name ?? props.instanceID} subheader={coreInstance?.id}>
                {err !== null ? (
                    <Alert iconMapping={{
                        error: <ErrorIcon fontSize="inherit" />,
                    }} severity="error" color="error">
                        <AlertTitle>Could not fetch core instance from Cloud</AlertTitle>
                        {err.message}
                    </Alert>
                ) : loading ? (
                    <LinearProgress />
                ) : (
                    <CoreInstanceView coreInstance={coreInstance} />
                )}
            </StyledCard>
        </Box>
    )
}

type CoreInstanceViewProps = {
    coreInstance: CoreInstanceType
}

function CoreInstanceView(props: CoreInstanceViewProps) {
    delete props.coreInstance["token"]
    return (
        <Stack>
            <pre>{JSON.stringify(props.coreInstance, null, 2)}</pre>
            <Stack my={4} alignItems="center" gap={2}>
                <Typography sx={{ color: "#0D3D61" }}>Manage your core instance from your browser:</Typography>
                <ManageCoreBtn instanceID={props.coreInstance.id} />
            </Stack>
        </Stack>
    )
}

type ManageCoreBtnProps = {
    instanceID: string
}

function ManageCoreBtn(props: ManageCoreBtnProps) {
    const dd = useDockerDesktopClient()

    return (
        <Button startIcon={<img src={birdDarkSrc} alt="Calyptia bird" />} variant="contained" sx={{ backgroundColor: "#1669AA" }} onClick={() => {
            dd.host.openExternal("https://core.calyptia.com/" + encodeURIComponent(props.instanceID))
        }}>Manage Core</Button>
    )
}
