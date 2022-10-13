import { createContext, PropsWithChildren, useContext } from "react"
import { Client as AuthClient } from "../lib/auth"

const AuthClientContext = createContext(null as unknown as AuthClient)

export type AuthClientProviderProps = {
    auth0Domain: string
    auth0ClientID: string
    auth0Audience: string
}

export function AuthClientProvider(props: PropsWithChildren<AuthClientProviderProps>) {
    const authClient = new AuthClient({
        domain: props.auth0Domain,
        clientID: props.auth0ClientID,
        audience: props.auth0Audience,
    })

    return (
        <AuthClientContext.Provider value={authClient} children={props.children} />
    )
}

export function useAuthClient() {
    return useContext(AuthClientContext)
}
