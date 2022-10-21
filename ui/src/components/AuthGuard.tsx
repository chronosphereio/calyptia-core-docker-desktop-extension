import { PropsWithChildren, useEffect, useState } from "react"
import { useAuthClient } from "../hooks/auth"
import { CloudClientProvider } from "../hooks/cloud"
import { useDockerDesktopClient } from "../hooks/docker-desktop"
import { UserInfoProvider } from "../hooks/user-info"
import { DeviceCode, ReuseTokenSource, Token, tokenFromJSON, UserInfo } from "../lib/auth"
import LoginScreen from "./LoginScreen"

export type AuthGuardProps = {
    cloudBaseURL: string
}

export default function AuthGuard(props: PropsWithChildren<AuthGuardProps>) {
    const dd = useDockerDesktopClient()
    const auth = useAuthClient()
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
    const [tokenSource, setTokenSource] = useState<ReuseTokenSource | null>(null)
    const [loading, setLoading] = useState(false)
    const [deviceCode, setDeviceCode] = useState<DeviceCode | null>(null)

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
        const userItem = localStorage.getItem("user_info")
        if (tokenItem !== null && userItem !== null) {
            setTokenSourceFromTok(tokenFromJSON(tokenItem))
            setUserInfo(JSON.parse(userItem))
        }
    }, [])

    const login = async () => {
        setLoading(true)
        const ctrl = new AbortController()
        try {
            const dc = await auth.fetchDeviceCode(ctrl.signal)
            setDeviceCode(dc)
            dd.host.openExternal(dc.verificationURIComplete)

            const tok = await dc.fetchToken(ctrl.signal)
            const usr = await auth.fetchUserInfo(ctrl.signal, tok)

            if (usr.email_verified !== true) {
                dd.host.openExternal(auth.buildLogoutURL())
                throw new Error("email not verified. You will get a verification email to verify your account")
            }

            localStorage.setItem("user_token", tok.toJSON())
            localStorage.setItem("user_info", JSON.stringify(usr))

            setTokenSourceFromTok(tok)
            setUserInfo(usr)
        } catch (err) {
            if (err.name !== "AbortError") {
                dd.desktopUI.toast.error("Error: " + err.message)
            }
        } finally {
            ctrl.abort()
            setLoading(false)
            setDeviceCode(null)
        }
    }

    if (tokenSource !== null && userInfo !== null) {
        return (
            <CloudClientProvider baseURL={props.cloudBaseURL} tokenSource={tokenSource}>
                <UserInfoProvider userInfo={userInfo} children={props.children} />
            </CloudClientProvider>
        )
    }

    return (
        <LoginScreen loading={loading} devideCode={deviceCode} onLoginClick={login} />
    )
}
