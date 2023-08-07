import AbcIcon from '@mui/icons-material/Abc'
import LoadingButton from "@mui/lab/LoadingButton"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import useTheme from "@mui/material/styles/useTheme"
import { useState } from "react"
import { CLOUD_BASE_URL } from "../consts"
import { useDockerDesktopClient } from "../hooks/docker-desktop"
import { useProjectToken } from "../hooks/project-token"
import StyledCard from "./StyledCard"

export default function DeployCoreInstance() {
    const dd = useDockerDesktopClient()
    const projectToken = useProjectToken()
    const theme = useTheme()
    const [loading, setLoading] = useState(false)

    const deployVivo = async () => {
        if (dd.extension.host === undefined) {
            throw new Error("docker-desktop extension host not enabled")
        }

        const args = [
            "apply",
            "--context", "docker-desktop",
            "-f", "https://raw.githubusercontent.com/calyptia/vivo/master/vivo-deployment.yaml"
        ]

        const output = await dd.extension.host.cli.exec("kubectl", args)
        if (output.stderr !== "") {
            throw new Error(output.stderr)
        }

        return output
    }

    const installOperator = async () => {
        const args = [
            "install",
            "operator",
            "--token", projectToken.token,
            "--wait",
        ]

        if (CLOUD_BASE_URL !== "https://cloud-api.calyptia.com") {
            args.push("--cloud-url", CLOUD_BASE_URL)
        }

        const output = await dd.extension.host.cli.exec("calyptia", args)
        if (output.stderr !== "") {
            throw new Error(output.stderr)
        }

        return output
    }

    const deployCoreInstance = async () => {
        if (dd.extension.host === undefined) {
            throw new Error("docker-desktop extension host not enabled")
        }

        const args = [
            "create",
            "core_instance",
            "kubernetes",
            "--token", projectToken.token,
            "--tags", "docker,desktop",
            "--kube-context", "docker-desktop"
        ]

        if (CLOUD_BASE_URL !== "https://cloud-api.calyptia.com") {
            args.push("--cloud-url", CLOUD_BASE_URL)
        }

        const output = await dd.extension.host.cli.exec("calyptia", args)
        if (output.stderr !== "") {
            throw new Error(output.stderr)
        }

        return output
    }

    const deploy = async () => {
        await deployCoreInstance().catch(err => {
            const msg = String(err.message || err.stderr)
            if (msg.includes("install operator")) {
                return installOperator().then(deploy)
            }
            throw err
        })
        await deployVivo()
    }

    const onDeploy = () => {
        setLoading(true)
        deploy().then(() => {
            window.location.reload()
        }).catch(err => {
            dd.desktopUI.toast.error(err.message || err.stderr)
            setLoading(false)
        })
    }

    return (
        <StyledCard title="Manage your Core Instances" subheader="To get started, click on the button below.">
            <Stack alignItems="center" justifyContent="center" gap={1} py={8}>
                <Typography variant="h5" color={theme.palette.mode !== "dark" ? "#1669AA" : undefined}>Welcome to <Typography variant="h5" component="span" sx={{ display: "inline", fontWeight: 700 }}>Calyptia Core</Typography> for Docker Desktop</Typography>
                <Typography color="text.secondary" sx={{ opacity: 0.8 }}>To get started, click on the button below.</Typography>
                <Box my={4}>
                    {loading ? (
                        // AbcIcon is there only to take space so the text doesn't overlay with the loader indicator.
                        <LoadingButton loading loadingPosition="start" variant="outlined" startIcon={<AbcIcon />} >Deploying</LoadingButton>
                    ) : (
                        <Button variant="contained" onClick={onDeploy}>Deploy Core</Button>
                    )}
                </Box>
                <Typography color="text.secondary" sx={{ opacity: 0.8 }}>Need assistance?</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8 }}>Just give us a ping at hello@calyptia.com.</Typography>
            </Stack>
        </StyledCard>
    )
}
