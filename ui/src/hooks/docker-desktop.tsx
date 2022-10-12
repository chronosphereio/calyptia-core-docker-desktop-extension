import { createDockerDesktopClient } from "@docker/extension-api-client"
import { v1 } from "@docker/extension-api-client-types"
import { createContext, PropsWithChildren, useContext } from "react"

const DockerDesktopContext = createContext(null as unknown as v1.DockerDesktopClient)

export function DockerDesktopProvider(props: PropsWithChildren<unknown>) {
    const client = createDockerDesktopClient()
    return (
        <DockerDesktopContext.Provider value={client} children={props.children} />
    )
}

export function useDockerDesktopClient() {
    return useContext(DockerDesktopContext)
}
