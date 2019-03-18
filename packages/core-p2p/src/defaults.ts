export const defaults = {
    host: process.env.CORE_P2P_HOST || "0.0.0.0",
    port: process.env.CORE_P2P_PORT || 4002,
    /**
     * The minimum peer version we expect
     */
    minimumVersions: [">=2.1.0", ">=2.2.0-alpha.0", ">=2.2.0-beta.0", ">=2.2.0-rc.0", ">=2.2.0-next.0"],
    /**
     * The number of peers we expect to be available to start a relay
     */
    minimumNetworkReach: 20,
    /**
     * The timeout for requests to other peers
     */
    globalTimeout: 5000,
    /**
     * The number of seconds until we allow forging
     */
    coldStart: 30,
    /**
     * The maximum number of peers we will broadcast data to
     */
    maxPeersBroadcast: 20,
    /**
     * The list of IPs we allow to be added to the peer list.
     */
    whitelist: ["*"],
    /**
     * The list of IPs we do not allow to be added to the peer list.
     */
    blacklist: [],
    /**
     * The list of IPs can access the remote/internal API.
     *
     * This should usually only include your localhost to grant access to
     * the internal API to your forger. If you run a split relay and forger
     * you will need to specify the IP of your forger here.
     */
    remoteAccess: ["127.0.0.1", "::ffff:127.0.0.1"],
    /**
     * The DNS servers we use to verify connectivity
     */
    dns: [
        // Google
        "8.8.8.8",
        "8.8.4.4",
        // CloudFlare
        "1.1.1.1",
        "1.0.0.1",
        // OpenDNS
        "208.67.222.222",
        "208.67.220.220",
    ],
    /**
     * The NTP servers we use to verify connectivity
     */
    ntp: ["pool.ntp.org", "time.google.com"],
    /**
     * @see https://github.com/wraithgar/hapi-rate-limit
     */
    rateLimit: {
        enabled: true,
        pathLimit: false,
        userLimit: 20,
        userCache: {
            expiresIn: 1000,
        },
        ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1"],
    },
    /**
     * Whether or not we enable the remote API (Caution!)
     */
    remoteInterface: false,
};
