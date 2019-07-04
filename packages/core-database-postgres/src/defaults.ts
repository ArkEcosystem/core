export const defaults = {
    initialization: {
        capSQL: true,
        promiseLib: require("bluebird"),
        noLocking: process.env.NODE_ENV === "test",
    },
    connection: {
        host: process.env.CORE_DB_HOST || "localhost",
        port: process.env.CORE_DB_PORT || 5432,
        database: process.env.CORE_DB_DATABASE || `${process.env.CORE_TOKEN}_${process.env.CORE_NETWORK_NAME}`,
        user: process.env.CORE_DB_USERNAME || process.env.CORE_TOKEN,
        password: process.env.CORE_DB_PASSWORD || "password",
    },
    totalCountIsEstimate: true,
};
