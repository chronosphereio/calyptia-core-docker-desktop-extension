import { createContext, PropsWithChildren, useContext } from "react"
import { ReuseTokenSource } from "../lib/auth"
import { Client as CloudClient } from "../lib/cloud"

const CloudContext = createContext(null as unknown as CloudClient)

export type CloudProviderProps = {
    baseURL: string
    tokenSource: ReuseTokenSource
}

export function CloudProvider(props: PropsWithChildren<CloudProviderProps>) {
    const cloudClient = new CloudClient(props.baseURL, props.tokenSource)
    return (
        <CloudContext.Provider value={cloudClient} children={props.children} />
    )
}

export function useCloudClient() {
    return useContext(CloudContext)
}
