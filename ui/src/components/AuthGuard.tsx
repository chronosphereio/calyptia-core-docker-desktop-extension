import { PropsWithChildren, useEffect, useState } from "react"
import { useAuthClient } from "../hooks/auth"
import { CloudClientProvider } from "../hooks/cloud"
import { useDockerDesktopClient } from "../hooks/docker-desktop"
import { ReuseTokenSource, Token, tokenFromJSON } from "../lib/auth"
import LoginScreen from "./LoginScreen"

export type AuthGuardProps = {
    cloudBaseURL: string
}

export default function AuthGuard(props: PropsWithChildren<AuthGuardProps>) {
    const dd = useDockerDesktopClient()
    const auth = useAuthClient()
    const [tokenSource, setTokenSource] = useState<ReuseTokenSource | null>(null)
    const [loading, setLoading] = useState(false)

    const setTokenSourceFromTok = (tok: Token) => {
        const ctrl = new AbortController()
        const tokenSource = auth.tokenSource(ctrl.signal, tok, {
            save(tok: Token) {
                localStorage.setItem("user_token", tok.toJSON())
            },
        })
        setTokenSource(tokenSource)
    }

    useEffect(() => {
        const tokenItem = localStorage.getItem("user_token")
        if (tokenItem !== null) {
            setTokenSourceFromTok(tokenFromJSON(tokenItem))
        }
    }, [])

    const login = async () => {
        setLoading(true)
        const ctrl = new AbortController()
        try {
            const dc = await auth.fetchDeviceCode(ctrl.signal)
            dd.host.openExternal(dc.verificationURIComplete)

            const tok = await dc.fetchToken(ctrl.signal)
            setTokenSourceFromTok(tok)
            localStorage.setItem("user_token", tok.toJSON())
        } catch (err) {
            if (err.name !== "AbortError") {
                dd.desktopUI.toast.error(err.message)
            }
        } finally {
            ctrl.abort()
            setLoading(false)
        }
    }

    if (tokenSource !== null) {
        return (
            <CloudClientProvider baseURL={props.cloudBaseURL} tokenSource={tokenSource} children={props.children} />
        )
    }

    return (
        <LoginScreen loading={loading} onLoginClick={login} />
    )
}
