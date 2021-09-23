export declare const defaults: {
    server: {
        hostname: string;
        port: string | number;
        logLevel: number;
    };
    /**
     * The minimum peer version we expect
     */
    minimumVersions: string[];
    /**
     * The number of peers we expect to be available to start a relay
     */
    minimumNetworkReach: number;
    /**
     * The timeout to verify a peer. [milliseconds]
     */
    verifyTimeout: number;
    /**
     * The timeout to download a batch of blocks (400). Notice that we start
     * 25 concurrent such downloads, so the network may be saturated. [milliseconds]
     */
    getBlocksTimeout: number;
    /**
     * The maximum number of peers we will broadcast data to
     */
    maxPeersBroadcast: number;
    /**
     * The maximum authorized number of peers sharing same ip /24 subnet
     */
    maxSameSubnetPeers: string | number;
    /**
     * The list of IPs we allow to be added to the peer list.
     */
    whitelist: string[];
    /**
     * The list of IPs we do not allow to be added to the peer list.
     */
    blacklist: any[];
    /**
     * The list of IPs can access the remote/internal API.
     *
     * This should usually only include your localhost to grant access to
     * the internal API to your forger. If you run a split relay and forger
     * you will need to specify the IP of your forger here.
     */
    remoteAccess: string[];
    /**
     * The DNS servers we use to verify connectivity
     */
    dns: string[];
    /**
     * The NTP servers we use to verify connectivity
     */
    ntp: string[];
    /**
     * Rate limit config, used in socket-server worker / master
     */
    rateLimit: string | number;
};
