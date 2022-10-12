export type HTTPErrorOpts = {
    cause?: Error
    url?: string
    statusCode?: number
    headers?: Headers
    body?: any
}

export class HTTPError extends Error {
    url?: string
    statusCode?: number
    headers?: Headers
    body?: any

    constructor(msg?: string, opts?: HTTPErrorOpts) {
        super(msg, { cause: opts?.cause })
        this.url = opts?.url
        this.statusCode = opts?.statusCode
        this.headers = opts?.headers
        this.body = opts?.body
    }
}
