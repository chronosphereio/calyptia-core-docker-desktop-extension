import { HTTPError } from "./error"

export async function handleResp<T>(resp: Response) {
    const body = await resp.clone().json().catch(() => resp.text())
    if (!resp.ok) {
        let msg = ""
        if (isPlainObject(body) && typeof body.error === "string") {
            msg = body.error
            if (typeof body.error_description === "string") {
                msg += ": " + body.error_description
            } else if (typeof body.detail === "string") {
                msg += ": " + body.detail
            }
        } else if (typeof body === "string" && body !== "") {
            msg = body
        } else {
            msg = resp.statusText
        }

        throw new HTTPError(msg, {
            url: resp.url,
            statusCode: resp.status,
            headers: resp.headers,
            body,
        })
    }

    return body as T
}

export function sleep(signal: AbortSignal, ms: number) {
    return new Promise<void>((resolve, reject) => {
        const id = setTimeout(() => {
            if (!signal.aborted) {
                resolve()
            }
        }, ms)

        signal.addEventListener("abort", () => {
            reject(signal.reason)
            clearTimeout(id)
        }, { once: true })
    })
}

export function isPlainObject(x: any): x is Record<string, unknown> {
    return typeof x === "object" && x !== null && !Array.isArray(x)
}
