import { createContext, PropsWithChildren, useContext } from "react"
import { Client as AuthClient } from "../lib/auth"

const AuthContext = createContext(null as unknown as AuthClient)

export type AuthProviderProps = {
    auth0Domain: string
    auth0ClientID: string
    auth0Audience: string
}

export function AuthProvider(props: PropsWithChildren<AuthProviderProps>) {
    const authClient = new AuthClient({
        domain: props.auth0Domain,
        clientID: props.auth0ClientID,
        audience: props.auth0Audience,
    })

    return (
        <AuthContext.Provider value={authClient} children={props.children} />
    )
}

export function useAuthClient() {
    return useContext(AuthContext)
}
