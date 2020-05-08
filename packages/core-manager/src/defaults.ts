export const defaults = {
    server: {
        http: {
            enabled: !process.env.CORE_MONITOR_DISABLED,
            host: process.env.CORE_MONITOR_HOST || "0.0.0.0",
            port: process.env.CORE_MONITOR_PORT || 4005,
        },
        // @see https://hapijs.com/api#-serveroptionstls
        https: {
            enabled: process.env.CORE_MONITOR_SSL,
            host: process.env.CORE_MONITOR_SSL_HOST || "0.0.0.0",
            port: process.env.CORE_MONITOR_SSL_PORT || 8445,
            tls: {
                key: process.env.CORE_MONITOR_SSL_KEY,
                cert: process.env.CORE_MONITOR_SSL_CERT,
            },
        },
    },
    plugins: {
        whitelist: ["*"],
        authenticate: {
            enabled: true,
            secret: "",
            users: [
                {
                    username: "test",
                    hashedPassword: "$argon2id$v=19$m=4096,t=3,p=1$WywUiCtFdYY06AmER+qGgQ$OWvCrQ6r6maFV4bPC+h25LfOM5WCxC4JOQuGsFSpASM"
                }
            ]
        }
    }
};
