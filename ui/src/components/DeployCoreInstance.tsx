import AbcIcon from '@mui/icons-material/Abc'
import LoadingButton from "@mui/lab/LoadingButton"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Link from "@mui/material/Link"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useState } from "react"
import { useDockerDesktopClient } from "../hooks/docker-desktop"
import { useProjectToken } from "../hooks/project-token"
import StyledCard from "./StyledCard"

export default function DeployCoreInstance() {
    const dd = useDockerDesktopClient()
    const projectToken = useProjectToken()
    const [loading, setLoading] = useState(false)

    const deployCoreInstance = async () => {
        if (dd.extension.host === undefined) {
            throw new Error("docker-desktop extension host not enabled")
        }

        const args = [
            "create",
            "core_instance",
            "kubernetes",
            "--token", projectToken.token,
            "--kube-context", "docker-desktop"
        ]

        if (process.env.REACT_APP_CLOUD_BASE_URL !== "https://cloud-api.calyptia.com") {
            args.push("--cloud-url", process.env.REACT_APP_CLOUD_BASE_URL)
        }

        const output = await dd.extension.host.cli.exec("calyptia", args)
        if (output.stderr !== "") {
            throw new Error(output.stderr)
        }
    }

    const onDeploy = () => {
        setLoading(true)
        deployCoreInstance().then(() => {
            window.location.reload()
        }).catch(err => {
            dd.desktopUI.toast.error(err.message)
            setLoading(false)
        })
    }

    return (
        <StyledCard title="Manage your Core Instances" subheader="To get started, click on the button below.">
            <Stack alignItems="center" justifyContent="center" gap={1} py={8}>
                <Typography variant="h5" sx={{ color: "#1669AA" }}>Welcome to <Typography variant="h5" sx={{ display: "inline", fontWeight: 700 }}>Calyptia Core</Typography> for Docker Desktop</Typography>
                <Typography sx={{ color: "#0D3D61" }}>To get started, click on the button below.</Typography>
                <Box my={4}>
                    {loading ? (
                        // AbcIcon is there only to take space so the text doesn't overlay with the loader indicator.
                        <LoadingButton loading loadingPosition="start" variant="outlined" startIcon={<AbcIcon />} >Deploying</LoadingButton>
                    ) : (
                        <Button variant="contained" sx={{ backgroundColor: "#1669aa" }} onClick={onDeploy}>Deploy Core</Button>
                    )}
                </Box>
                <Typography sx={{ color: "#0D3D61" }}>Need assistance?</Typography>
                <Typography variant="caption" sx={{ color: "#0D3D61" }}>Just give us a ping <PingLink />.</Typography>
            </Stack>
        </StyledCard>
    )
}

function PingLink() {
    const dd = useDockerDesktopClient()

    return (
        <Link component="button" onClick={() => {
            dd.host.openExternal("mailto:hello@calyptia.com")
        }}>here</Link>
    )
}
