import { Auth0Provider } from "@auth0/auth0-react"
import Container from "@mui/material/Container"
import CssBaseline from "@mui/material/CssBaseline"
import { PaletteOptions } from "@mui/material/styles/createPalette"
import createTheme from "@mui/material/styles/createTheme"
import { TypographyOptions } from "@mui/material/styles/createTypography"
import ThemeProvider from "@mui/material/styles/ThemeProvider"
import useMediaQuery from "@mui/material/useMediaQuery"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useMemo } from "react"
import AuthGuard from "./components/AuthGuard"
import CoreInstanceScreen from "./components/CoreInstanceScreen"
import Header from "./components/Header"
import { CloudClientProvider } from "./hooks/cloud"
import { DockerDesktopClientProvider } from "./hooks/docker-desktop"
import { ProjectTokenProvider } from "./hooks/project-token"

const queryClient = new QueryClient()

export function createPalette(mode: "light" | "dark"): PaletteOptions {
    return mode === "dark" ? {
        background: {
            default: "#141B1F",
            paper: "#2A3B46",
        },
        text: {
            primary: "#fff",
            secondary: "#F9FBFC",
        },
        primary: {
            main: "#0199FF",
        },
        divider: "#ECECEF54", // 0.3 opacity
    } : {
        background: {
            default: "#F2F3F5",
        },
        text: {
            primary: "#000",
            secondary: "#0D3D61",
        },
        primary: {
            main: "#1669AA"
        },
        divider: "#eee",
    }
}

const typography: TypographyOptions = {
    fontFamily: "Rubik, -apple-system, Arial, sans-serif"
}

export function App() {
    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)")

    const theme = useMemo(() => {
        const mode = prefersDarkMode ? "dark" : "light"
        const palette = createPalette(mode)
        return createTheme({
            palette: { ...palette, mode },
            typography,
        })
    }, [prefersDarkMode])

    return (
        <DockerDesktopClientProvider>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <QueryClientProvider client={queryClient}>
                    <Auth0Provider
                        domain={process.env.REACT_APP_AUTH0_DOMAIN}
                        clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
                        cacheLocation="localstorage"
                        authorizationParams={{
                            display: "popup",
                            audience: process.env.REACT_APP_AUTH0_AUDIENCE,
                            redirect_uri: process.env.REACT_APP_AUTH0_REDIRECT_URI || "docker-desktop://dashboard/extension-tab?extensionId=calyptia/core-docker-desktop"
                        }}
                    >
                        <AuthGuard>
                            <CloudClientProvider baseURL={process.env.REACT_APP_CLOUD_BASE_URL}>
                                <ProjectTokenProvider>
                                    <Header />
                                    <br />
                                    <Container>
                                        <CoreInstanceScreen />
                                    </Container>
                                </ProjectTokenProvider>
                            </CloudClientProvider>
                        </AuthGuard>
                    </Auth0Provider>
                </QueryClientProvider>
            </ThemeProvider>
        </DockerDesktopClientProvider>
    )
}
