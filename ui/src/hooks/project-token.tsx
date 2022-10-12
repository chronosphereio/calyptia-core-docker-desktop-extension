import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react"
import { Token } from "../lib/cloud"
import { useCloudClient } from "./cloud"

const ProjectTokenContext = createContext(null as unknown as Token)

export function ProjectTokenProvider(props: PropsWithChildren<unknown>) {
    const cloud = useCloudClient()
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
            if (err.name !== "AbortError") {
                setErr(err)
            }
        })

        return () => {
            ctrl.abort()
        }
    })

    if (err !== null) {
        return (
            <div>
                Something went wrong: {err.message}
            </div>
        )
    }

    if (tok === null) {
        return (
            <div>
                Loading... please wait.
            </div>
        )
    }


    return (
        <ProjectTokenContext.Provider value={tok} children={props.children} />
    )
}

export function useProjectToken() {
    return useContext(ProjectTokenContext)
}
