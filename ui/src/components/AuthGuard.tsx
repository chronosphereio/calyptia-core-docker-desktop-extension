import LoadingButton from '@mui/lab/LoadingButton'
import Alert from "@mui/material/Alert"
import AlertTitle from "@mui/material/AlertTitle"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import LinearProgress from "@mui/material/LinearProgress"
import Typography from "@mui/material/Typography"
import { PropsWithChildren, useEffect, useState } from "react"
import { useAuthClient } from "../hooks/auth"
import { CloudProvider } from "../hooks/cloud"
import { useDockerDesktopClient } from "../hooks/docker-desktop"
import { ReuseTokenSource, Token, tokenFromJSON } from "../lib/auth"

export type AuthGuardProps = {
    cloudBaseURL: string
}

export default function AuthGuard(props: PropsWithChildren<AuthGuardProps>) {
    const dd = useDockerDesktopClient()
    const auth = useAuthClient()
    const [tokenSource, setTokenSource] = useState<ReuseTokenSource | null>(null)
    const [visitURL, setVisitURL] = useState<string | null>(null)
    const [authorizing, setAuthorizing] = useState(false)
    const [err, setErr] = useState<Error | null>(null)

    useEffect(() => {
        const ctrl = new AbortController()

        const run = async () => {
            let tok = null as unknown as Token
            const tokenItem = localStorage.getItem("user_token")
            if (tokenItem !== null) {
                tok = tokenFromJSON(tokenItem)
            } else {
                const dc = await auth.fetchDeviceCode(ctrl.signal)
                setVisitURL(dc.verificationURIComplete)

                tok = await dc.fetchToken(ctrl.signal)
                setAuthorizing(false)
                localStorage.setItem("user_token", tok.toJSON())
            }

            const tokenSource = auth.tokenSource(ctrl.signal, tok, {
                save(tok: Token) {
                    localStorage.setItem("user_token", tok.toJSON())
                },
            })
            setTokenSource(tokenSource)
        }

        run().catch(err => {
            if (err.name !== "AbortError") {
                setErr(err)
            }
        })

        return () => {
            ctrl.abort()
        }
    }, [auth])

    const onVisit = () => {
        dd.host.openExternal(visitURL)
        setAuthorizing(true)
    }

    if (err !== null) {
        return (
            <Alert severity="error">
                <AlertTitle>Failed to authorize</AlertTitle>
                {err.message}
            </Alert>
        )
    }

    if (tokenSource !== null) {
        return (
            <CloudProvider baseURL={props.cloudBaseURL} tokenSource={tokenSource} children={props.children} />
        )
    }

    if (visitURL !== null) {
        return (
            <Box sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "90vh",
                gap: "1rem",
            }}>
                <Typography>
                    Click the following button to authorize docker-desktop to access your Calyptia account.
                </Typography>
                {authorizing ? (
                    <LoadingButton loading variant="outlined" onClick={onVisit}>Authorize</LoadingButton>
                ) : (
                    <Button color="primary" variant="outlined" onClick={onVisit}>Authorize</Button>
                )}
            </Box>
        )
    }

    return (
        <Box sx={{ width: '100%' }}>
            <LinearProgress />
        </Box>
    )
}
