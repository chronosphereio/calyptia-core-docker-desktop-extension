import { createTheme, ThemeProvider } from "@mui/material"
import Container from "@mui/material/Container"
import CssBaseline from "@mui/material/CssBaseline"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import AuthGuard from "./components/AuthGuard"
import CoreInstanceScreen from "./components/CoreInstanceScreen"
import Header from "./components/Header"
import { AuthClientProvider } from "./hooks/auth"
import { DockerDesktopClientProvider } from "./hooks/docker-desktop"
import { ProjectTokenProvider } from "./hooks/project-token"

const queryClient = new QueryClient()

const theme = createTheme({
    palette: {
        mode: "light",
        background: {
            default: "#f7f8fb"
        }
    },
    typography: {
        fontFamily: "Rubik, sans-serif",
    }
})

export function App() {
    return (
        <DockerDesktopClientProvider>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <QueryClientProvider client={queryClient}>
                    <AuthClientProvider
                        auth0Domain={process.env.REACT_APP_AUTH0_DOMAIN}
                        auth0ClientID={process.env.REACT_APP_AUTH0_CLIENT_ID}
                        auth0Audience={process.env.REACT_APP_AUTH0_AUDIENCE}
                    >
                        <AuthGuard cloudBaseURL={process.env.REACT_APP_CLOUD_BASE_URL}>
                            <ProjectTokenProvider>
                                <Header />
                                <br />
                                <Container>
                                    <CoreInstanceScreen />
                                </Container>
                            </ProjectTokenProvider>
                        </AuthGuard>
                    </AuthClientProvider>
                </QueryClientProvider>
            </ThemeProvider>
        </DockerDesktopClientProvider>
    )
}
