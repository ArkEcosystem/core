export const defaults = {
    connection: {
        type: "postgres",
        host: process.env.CORE_DB_HOST || "localhost",
        port: process.env.CORE_DB_PORT || 5432,
        database: process.env.CORE_DB_DATABASE || `${process.env.CORE_TOKEN}_${process.env.CORE_NETWORK_NAME}`,
        username: process.env.CORE_DB_USERNAME || process.env.CORE_TOKEN,
        password: process.env.CORE_DB_PASSWORD || "password",
        entityPrefix: "public.",
        synchronize: false,
        logging: false,
    },
};
