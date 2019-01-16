export const defaults = {
    enabled: false,
    host: process.env.CORE_GRAPHQL_HOST || "0.0.0.0",
    port: process.env.CORE_GRAPHQL_PORT || 4005,
    path: "/graphql",
};
