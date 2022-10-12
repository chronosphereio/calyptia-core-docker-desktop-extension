import { DockerMuiThemeProvider } from "@docker/docker-mui-theme"
import { StyledEngineProvider } from "@mui/material"
import CssBaseline from "@mui/material/CssBaseline"
import { Core } from "./calyptia/Core"
import AuthGuard from "./components/AuthGuard"
import { AuthProvider } from "./hooks/auth"
import { DockerDesktopProvider } from "./hooks/docker-desktop"
import { ProjectTokenProvider } from "./hooks/project-token"

export const App = () => {
    return (
        <DockerDesktopProvider>
            <StyledEngineProvider injectFirst>
                <DockerMuiThemeProvider>
                    <CssBaseline />
                    <AuthProvider
                        auth0Domain={process.env.REACT_APP_AUTH0_DOMAIN}
                        auth0ClientID={process.env.REACT_APP_AUTH0_CLIENT_ID}
                        auth0Audience={process.env.REACT_APP_AUTH0_AUDIENCE}
                    >
                        <AuthGuard cloudBaseURL={process.env.REACT_APP_CLOUD_BASE_URL}>
                            <ProjectTokenProvider>
                                <Core />
                            </ProjectTokenProvider>
                        </AuthGuard>
                    </AuthProvider>
                </DockerMuiThemeProvider>
            </StyledEngineProvider>
        </DockerDesktopProvider>
    )
}
