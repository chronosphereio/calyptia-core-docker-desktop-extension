import Alert from "@mui/material/Alert"
import AlertTitle from "@mui/material/AlertTitle"
import Box from "@mui/material/Box"
import LinearProgress from "@mui/material/LinearProgress"
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react"
import { Token } from "../lib/cloud"
import { useAuthClient } from "./auth"
import { useCloudClient } from "./cloud"
import { useDockerDesktopClient } from "./docker-desktop"

const ProjectTokenContext = createContext(null as unknown as Token)

export function ProjectTokenProvider(props: PropsWithChildren<unknown>) {
    const cloud = useCloudClient()
    const dd = useDockerDesktopClient()
    const auth = useAuthClient()
    const [tok, setTok] = useState<Token | null>(null)
    const [err, setErr] = useState<Error | null>(null)

    useEffect(() => {
        const ctrl = new AbortController()

        const run = async () => {
            const { data: projects } = await cloud.fetchProjects(ctrl.signal, { last: 1 })
            if (projects.length !== 1) {
                setErr(new Error("no projects found"))
                return
            }

            const proj = projects[0]
            const { data: tokens } = await cloud.fetchTokens(ctrl.signal, { projectID: proj.id, last: 1 })
            if (tokens.length !== 1) {
                setErr(new Error("no tokens found"))
                return
            }

            setTok(tokens[0])
        }

        run().catch(err => {
            if (err.name === "AbortError") {
                return
            }

            console.error(err)
            // backward-compatible fix for users that did login without a verified email.
            if (err.message === "email not verified") {
                localStorage.clear()
                dd.host.openExternal(auth.buildLogoutURL())
                window.location.reload()
            }

            setErr(err)
        })

        return () => {
            ctrl.abort()
        }
    }, [])

    if (err !== null) {
        return (
            <Alert severity="error">
                <AlertTitle>Failed to retrieve Calyptia project token</AlertTitle>
                {err.message}
            </Alert>
        )
    }

    if (tok === null) {
        return (
            <Box sx={{ width: '100%' }}>
                <LinearProgress />
            </Box>
        )
    }


    return (
        <ProjectTokenContext.Provider value={tok} children={props.children} />
    )
}

export function useProjectToken() {
    return useContext(ProjectTokenContext)
}
