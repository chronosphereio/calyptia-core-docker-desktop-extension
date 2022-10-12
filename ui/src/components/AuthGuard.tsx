import { PropsWithChildren, useEffect, useState } from "react"
import { useAuthClient } from "../hooks/auth"
import { CloudProvider } from "../hooks/cloud"
import { useDockerDesktopClient } from "../hooks/docker-desktop"
import { ReuseTokenSource, Token, tokenFromJSON } from "../lib/auth"

export type AuthGuardProps = {
    cloudBaseURL: string
}

export default function AuthGuard(props: PropsWithChildren<AuthGuardProps>) {
    const dd = useDockerDesktopClient()
    const auth = useAuthClient()
    const [tokenSource, setTokenSource] = useState<ReuseTokenSource | null>(null)
    const [visitURL, setVisitURL] = useState<string | null>(null)
    const [err, setErr] = useState<Error | null>(null)

    useEffect(() => {
        const ctrl = new AbortController()

        const run = async () => {
            let tok = null as unknown as Token
            const tokenItem = localStorage.getItem("user_token")
            if (tokenItem !== null) {
                tok = tokenFromJSON(tokenItem)
            } else {
                const dc = await auth.fetchDeviceCode(ctrl.signal)
                setVisitURL(dc.verificationURIComplete)

                tok = await dc.fetchToken(ctrl.signal)
                localStorage.setItem("user_token", tok.toJSON())
            }

            const tokenSource = auth.tokenSource(ctrl.signal, tok, {
                save(tok: Token) {
                    localStorage.setItem("user_token", tok.toJSON())
                },
            })
            setTokenSource(tokenSource)
        }

        run().catch(err => {
            if (err.name !== "AbortError") {
                setErr(err)
            }
        })

        return () => {
            ctrl.abort()
        }
    }, [])

    const onVisit = () => {
        dd.host.openExternal(visitURL)
    }

    if (err !== null) {
        return (
            <div>Something went wrong: {err.message}</div>
        )
    }

    if (tokenSource !== null) {
        return (
            <CloudProvider baseURL={props.cloudBaseURL} tokenSource={tokenSource} children={props.children} />
        )
    }

    if (visitURL !== null) {
        return (
            <div>
                Please visit the following URL to authorize docker-desktop to access your Calyptia account.<br />
                <a href={visitURL} target="_blank" rel="noopener noreferrer" onClick={onVisit}>{visitURL}</a>
            </div>
        )
    }

    return (
        <div>
            Loading... please wait.
        </div>
    )
}
