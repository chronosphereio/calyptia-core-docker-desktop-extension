import { useAuth0 } from "@auth0/auth0-react"
import ErrorIcon from "@mui/icons-material/Error"
import Alert from "@mui/material/Alert"
import AlertTitle from "@mui/material/AlertTitle"
import { PropsWithChildren } from "react"
import { useDockerDesktopClient } from "../hooks/docker-desktop"
import LoginScreen from "./LoginScreen"

export default function AuthGuard(props: PropsWithChildren) {
    const dd = useDockerDesktopClient()
    const { isLoading, isAuthenticated, error, user, loginWithRedirect } = useAuth0()

    if (error) {
        return (
            <Alert iconMapping={{
                error: <ErrorIcon fontSize="inherit" />,
            }} severity="error" color="error">
                <AlertTitle>Failed to login.</AlertTitle>
                {error.message}
            </Alert>
        )
    }

    if (isLoading || !isAuthenticated) {
        return (
            <LoginScreen loading={isLoading} onLoginClick={() => loginWithRedirect({
                openUrl: async url => {
                    dd.host.openExternal(url)
                },
            })} />
        )
    }

    return (
        <>{props.children}</>
    )
}
