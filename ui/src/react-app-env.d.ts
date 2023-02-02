/// <reference types="react-scripts" />

declare namespace NodeJS {
    interface ProcessEnv {
        REACT_APP_AUTH0_DOMAIN: string
        REACT_APP_AUTH0_CLIENT_ID: string
        REACT_APP_AUTH0_AUDIENCE: string
        REACT_APP_AUTH0_REDIRECT_URI: string
        REACT_APP_CLOUD_BASE_URL: string
    }
}
