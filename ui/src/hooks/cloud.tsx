import { useAuth0 } from "@auth0/auth0-react"
import { createContext, PropsWithChildren, useContext } from "react"
import { Client as CloudClient } from "../lib/cloud"

const CloudClientContext = createContext(null as unknown as CloudClient)

export type CloudClientProviderProps = {
    baseURL: string
}

export function CloudClientProvider(props: PropsWithChildren<CloudClientProviderProps>) {
    const { getAccessTokenSilently } = useAuth0()
    const cloudClient = new CloudClient(props.baseURL, () => getAccessTokenSilently())
    return (
        <CloudClientContext.Provider value={cloudClient} children={props.children} />
    )
}

export function useCloudClient() {
    return useContext(CloudClientContext)
}
