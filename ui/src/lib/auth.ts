import { HTTPError } from "./error"
import { handleResp, isPlainObject, sleep } from "./util"

export type DeviceCodeResponse = {
    device_code: string
    user_code: string
    verification_uri: string
    verification_uri_complete: string
    expires_in: number // seconds
    interval: number  // seconds
}

class DeviceCode {
    deviceCode = ""
    userCode = ""
    verificationURI = ""
    verificationURIComplete = ""
    expiry = new Date(0)
    interval = 0 // milliseconds

    #fetchTokenFunc: (signal: AbortSignal, dc: DeviceCode) => Promise<Token>

    constructor(fn: (signal: AbortSignal, dc: DeviceCode) => Promise<Token>) {
        this.#fetchTokenFunc = fn
    }

    expired() {
        return this.expiry <= new Date()
    }

    async fetchToken(signal: AbortSignal) {
        while (true) {
            try {
                return await this.#fetchTokenFunc(signal, this)
            } catch (err) {
                if (this.expired()) {
                    throw new Error("device code expired")
                }

                if (isAuthorizationPending(err)) {
                    await sleep(signal, this.interval)
                    continue
                }

                throw err
            }
        }
    }
}

export type TokenResponse = {
    access_token: string
    refresh_token: string
    expires_in: number  // seconds
    token_type: string
}

export class Token {
    accessToken = ""
    tokenType = ""
    refreshToken = ""
    expiry = new Date(0)

    valid() {
        if (this.accessToken === "") {
            return false
        }

        const in10Secs = new Date()
        // extra 10s used to avoid late expirations
        // due to client-server time mismatches.
        in10Secs.setSeconds(in10Secs.getSeconds() + 10)
        return in10Secs < this.expiry
    }

    toJSON() {
        return JSON.stringify({
            accessToken: this.accessToken,
            tokenType: this.tokenType,
            refreshToken: this.refreshToken,
            expiry: this.expiry,
        })
    }
}

export function tokenFromJSON(text: string) {
    const json = JSON.parse(text)
    const tok = new Token()
    tok.accessToken = json.accessToken
    tok.tokenType = json.tokenType
    tok.refreshToken = json.refreshToken
    tok.expiry = new Date(json.expiry)
    return tok
}

export type ClientOpts = {
    domain: string
    clientID: string
    audience: string
}

export class Client {
    domain: string
    clientID: string
    audience: string

    constructor(opts: ClientOpts) {
        this.domain = opts.domain
        this.clientID = opts.clientID
        this.audience = opts.audience
    }

    get deviceAuthorizationEndpoint() {
        return "https://" + this.domain + "/oauth/device/code"
    }

    get tokenEndpoint() {
        return "https://" + this.domain + "/oauth/token"
    }

    async fetchDeviceCode(signal: AbortSignal): Promise<DeviceCode> {
        const body = new URLSearchParams()
        body.set("client_id", this.clientID)
        body.set("scope", "profile email openid offline_access")
        body.set("audience", this.audience)
        const resp = await fetch(this.deviceAuthorizationEndpoint, { method: "POST", signal, body })
        const dcJson = await handleResp<DeviceCodeResponse>(resp)

        const exp = new Date()
        exp.setSeconds(exp.getSeconds() + dcJson.expires_in)

        const dc = new DeviceCode(this.#fetchToken.bind(this))
        dc.deviceCode = dcJson.device_code
        dc.userCode = dcJson.user_code
        dc.verificationURI = dcJson.verification_uri
        dc.verificationURIComplete = dcJson.verification_uri_complete
        dc.expiry = exp
        dc.interval = dcJson.interval * 1000
        return dc
    }

    async #fetchToken(signal: AbortSignal, dc: DeviceCode) {
        const body = new URLSearchParams()
        body.set("grant_type", "urn:ietf:params:oauth:grant-type:device_code")
        body.set("client_id", this.clientID)
        body.set("device_code", dc.deviceCode)

        const resp = await fetch(this.tokenEndpoint, { method: "POST", signal, body })
        const tokJson = await handleResp<TokenResponse>(resp)

        const exp = new Date()
        exp.setSeconds(exp.getSeconds() + tokJson.expires_in)

        const tok = new Token()
        tok.accessToken = tokJson.access_token
        tok.refreshToken = tokJson.refresh_token
        tok.tokenType = tokJson.token_type
        tok.expiry = exp
        return tok
    }

    tokenSource(signal: AbortSignal, tok: Token, store: Storage) {
        return new ReuseTokenSource(tok, new TokenRefresher(signal, tok.refreshToken, {
            domain: this.domain,
            clientID: this.clientID,
            audience: this.audience,
        }), store)
    }
}

export interface Storage {
    save: (tok: Token) => void | Promise<void>
}

export class ReuseTokenSource {
    constructor(private t: Token, private refresher: TokenRefresher, private store: Storage) { }

    async token() {
        if (this.t.valid()) {
            return this.t
        }
        this.t = await this.refresher.token()
        this.store.save(this.t)
        return this.t
    }
}

export class TokenRefresher extends Client {
    constructor(private signal: AbortSignal, private refreshToken: string, opts: ClientOpts) {
        super(opts)
    }

    async token() {
        const body = new URLSearchParams()
        body.set("grant_type", "refresh_token")
        body.set("client_id", this.clientID)
        body.set("refresh_token", this.refreshToken)
        const resp = await fetch(this.tokenEndpoint, { method: "POST", signal: this.signal, body })
        const json = await handleResp<TokenResponse>(resp)

        const exp = new Date()
        exp.setSeconds(exp.getSeconds() + json.expires_in)

        const out = new Token()
        out.accessToken = json.access_token
        out.refreshToken = this.refreshToken
        out.tokenType = json.token_type
        out.expiry = exp
        return out
    }
}



function isAuthorizationPending(err: any): err is HTTPError {
    return err instanceof HTTPError && isPlainObject(err.body) && err.body.error === "authorization_pending"
}
