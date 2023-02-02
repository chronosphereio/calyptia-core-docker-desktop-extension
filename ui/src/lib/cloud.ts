import { handleResp } from "./util"

export type FetchProjectsOpts = {
    last?: number
    before?: string
}

export type Project = {
    id: string
    name: string
}

export type FetchTokensOpts = {
    projectID: string
    last?: number
    before?: string
}

export type Token = {
    id: string
    token: string
}

export type CoreInstance = {
    id: string
    name: string
    version: string
    status: CoreInstanceStatus
    tags: string[]
    metadata: Record<string, string>
    createdAt: string
    updatedAt: string
}

export enum CoreInstanceStatus {
    waiting = "waiting",
    running = "running",
    unreachable = "unreachable",
}

export class Client {
    constructor(private baseURL: string, private getToken: () => Promise<string>) { }

    async fetchProjects(signal: AbortSignal, opts?: FetchProjectsOpts) {
        const u = new URL("/v1/projects", this.baseURL)
        if (opts !== undefined) {
            if (opts.last !== undefined) {
                u.searchParams.set("last", String(opts.last))
            }
            if (opts.before !== undefined) {
                u.searchParams.set("before", opts.before)
            }
        }

        const tok = await this.getToken()
        const resp = await fetch(u.toString(), {
            signal,
            method: "GET",
            headers: {
                Authorization: "Bearer " + tok,
            }
        })
        const json = await handleResp<Project[]>(resp)
        return new HTTPRespose(json, resp)
    }

    async fetchTokens(signal: AbortSignal, opts: FetchTokensOpts) {
        const u = new URL("/v1/projects/" + encodeURIComponent(opts.projectID) + "/tokens", this.baseURL)
        if (opts.last !== undefined) {
            u.searchParams.set("last", String(opts.last))
        }
        if (opts.before !== undefined) {
            u.searchParams.set("before", opts.before)
        }

        const tok = await this.getToken()
        const resp = await fetch(u.toString(), {
            signal,
            method: "GET",
            headers: {
                Authorization: "Bearer " + tok,
            }
        })
        const json = await handleResp<Token[]>(resp)
        return new HTTPRespose(json, resp)
    }

    async fetchCoreInstance(signal: AbortSignal, instanceID: string) {
        const u = new URL("/v1/aggregators/" + encodeURIComponent(instanceID), this.baseURL)
        const tok = await this.getToken()
        const resp = await fetch(u.toString(), {
            signal,
            method: "GET",
            headers: {
                Authorization: "Bearer " + tok,
            }
        })
        const json = await handleResp<CoreInstance>(resp)
        return new HTTPRespose(json, resp)
    }
}

class HTTPRespose<T> {
    url: string
    statusCode: number
    headers: Headers
    data: T

    constructor(data: T, resp: Response) {
        this.url = resp.url
        this.statusCode = resp.status
        this.headers = resp.headers
        this.data = data
    }
}
