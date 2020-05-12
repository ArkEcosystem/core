export const getConnectionData = (): { host: string, port: number | string, protocol: string } => {
    if (!process.env.CORE_API_DISABLED) {
        return {
            host: process.env.CORE_API_HOST || "0.0.0.0",
            port: process.env.CORE_API_PORT || 4003,
            protocol: "http"
        }
    }

    return {
        host: process.env.CORE_API_SSL_HOST || "0.0.0.0",
        port: process.env.CORE_API_SSL_PORT || 8443,
        protocol: "https"
    }
}
