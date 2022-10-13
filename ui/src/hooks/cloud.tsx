import { createContext, PropsWithChildren, useContext } from "react"
import { ReuseTokenSource } from "../lib/auth"
import { Client as CloudClient } from "../lib/cloud"

const CloudClientContext = createContext(null as unknown as CloudClient)

export type CloudClientProviderProps = {
    baseURL: string
    tokenSource: ReuseTokenSource
}

export function CloudClientProvider(props: PropsWithChildren<CloudClientProviderProps>) {
    const cloudClient = new CloudClient(props.baseURL, props.tokenSource)
    return (
        <CloudClientContext.Provider value={cloudClient} children={props.children} />
    )
}

export function useCloudClient() {
    return useContext(CloudClientContext)
}
