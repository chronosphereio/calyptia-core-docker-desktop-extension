import AbcIcon from '@mui/icons-material/Abc'
import LoadingButton from "@mui/lab/LoadingButton"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Paper from "@mui/material/Paper"
import useTheme from "@mui/material/styles/useTheme"
import Typography from "@mui/material/Typography"
import { useMemo } from "react"
import { useDockerDesktopClient } from "../hooks/docker-desktop"
import logoDarkSrc from "../images/logo-dark.svg"
import logoLightSrc from "../images/logo-light.svg"

export type LoginScreenProps = {
    loading: boolean
    onLoginClick: () => void | Promise<void>
}

export default function LoginScreen(props: LoginScreenProps) {
    const dd = useDockerDesktopClient()
    const theme = useTheme()
    const logoSrc = useMemo(() => theme.palette.mode === "dark" ? logoDarkSrc : logoLightSrc, [theme.palette.mode])

    return (
        <Box sx={{
            display: "grid",
            gridTemplateRows: "1fr auto",
            minHeight: "100vh",
            padding: "2rem",
        }}>
            <Box sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: ".5rem",
            }}>
                <Box sx={{ mb: 2 }}>
                    <img src={logoSrc} alt="Logo" />
                </Box>
                <Typography variant="h5" color={theme.palette.mode === "dark" ? "#0199FF" : "#1669AA"}>Observability, simplified.</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.8 }}>Eliminate the complexity of configuring and maintaining your observability pipelines.</Typography>
                {props.loading ? (
                    <>
                        {/* AbcIcon is there only to take space so the text doesn't overlay with the loader indicator. */}
                        <LoadingButton loading loadingPosition="start" variant="outlined" startIcon={<AbcIcon />} >
                            <span>Waiting authorization</span>
                        </LoadingButton>
                    </>
                ) : (
                    <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={props.onLoginClick}>LOG IN WITH BROWSER</Button>
                )}
            </Box>
            <Box>
                <Paper elevation={5}>
                    <Box sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        alignItems: "flex-start",
                        padding: "1rem",
                    }}>
                        <Box>
                            <Typography variant="h6" color="text.secondary" sx={{ opacity: 0.8 }}>
                                New to Calyptia?
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
                                Learn how Calyptia works and how to use it with Docker in our docs.
                            </Typography>
                        </Box>
                        <Button variant="contained" color="primary" onClick={() => {
                            dd.host.openExternal("https://docs.fluentbit.io/manual/administration/monitoring#calyptia-cloud")
                        }}>
                            READ DOCS
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Box >
    )
}
