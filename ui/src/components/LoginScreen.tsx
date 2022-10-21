import AbcIcon from '@mui/icons-material/Abc'
import LoadingButton from "@mui/lab/LoadingButton"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Link from "@mui/material/Link"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
import { useEffect, useState } from "react"
import { useDockerDesktopClient } from "../hooks/docker-desktop"
import logoLightSrc from "../images/logo-light.svg"
import { DeviceCode } from "../lib/auth"

export type LoginScreenProps = {
    loading: boolean
    devideCode: DeviceCode | null
    onLoginClick: () => void | Promise<void>
}

export default function LoginScreen(props: LoginScreenProps) {
    const dd = useDockerDesktopClient()

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
                    <img src={logoLightSrc} alt="Logo" />
                </Box>
                <Typography color="#1669aa" variant="h5">Observability, simplified.</Typography>
                <Typography color="#0d3d61" variant="body1">Eliminate the complexity of configuring and maintaining your observability pipelines.</Typography>
                {props.loading ? (
                    <>
                        {/* AbcIcon is there only to take space so the text doesn't overlay with the loader indicator. */}
                        <LoadingButton loading loadingPosition="start" variant="outlined" startIcon={<AbcIcon />} >
                            <span>Waiting authorization</span>
                            {props.devideCode !== null ? (
                                <Box ml={1}>
                                    <CountDown date={props.devideCode.expiry} />
                                </Box>
                            ) : null}
                        </LoadingButton>
                        {props.devideCode !== null ? (
                            <Box>
                                <Typography textAlign="center" variant="caption">Or Visit:</Typography>{" "}
                                <Link component="button" textAlign="center" onClick={() => {
                                    dd.host.openExternal(props.devideCode.verificationURIComplete)
                                }}>{props.devideCode.verificationURIComplete}</Link>
                            </Box>
                        ) : null}
                    </>
                ) : (
                    <Button variant="contained" color="primary" sx={{ mt: 2, backgroundColor: "#1669aa" }} onClick={props.onLoginClick}>LOG IN WITH BROWSER</Button>
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
                            <Typography color="#0d3d61" variant="h6">
                                New to Calyptia?
                            </Typography>
                            <Typography color="#0d3d61" variant="body2">
                                Learn how Calyptia works and how to use it with Docker in our docs.
                            </Typography>
                        </Box>
                        <Button variant="contained" color="primary" sx={{ backgroundColor: "#1669aa" }} onClick={() => {
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

type CountDownProps = {
    date: Date
}

function CountDown(props: CountDownProps) {
    const calcDates = () => {
        const now = new Date()
        const d = props.date.valueOf() - now.valueOf()
        return {
            minutes: Math.max(Math.floor((d % (1000 * 60 * 60)) / (1000 * 60)), 0),
            seconds: Math.max(Math.floor((d % (1000 * 60)) / 1000), 0),
        }
    }

    const [dates, setDates] = useState(calcDates)

    useEffect(() => {
        const id = setInterval(() => {
            setDates(calcDates())
        }, 1000)
        return () => {
            clearInterval(id)
        }
    }, [props.date])

    return (
        <time>{dates.minutes}:{dates.seconds}</time>
    )
}
