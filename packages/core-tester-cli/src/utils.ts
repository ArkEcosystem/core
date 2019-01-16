import axios from "axios";
import pino from "pino";

const logger = pino({
    name: "core-tester-cli",
    safe: true,
    prettyPrint: true,
});

const request = config => {
    const headers: any = {};
    if (config && config.network) {
        headers.nethash = config.network.nethash;
        headers.version = "2.0.0";
        headers.port = config.p2pPort;
        headers["Content-Type"] = "application/json";
    }

    return {
        get: async (endpoint, isP2P = false) => {
            const baseUrl = `${config.baseUrl}:${isP2P ? config.p2pPort : config.apiPort}`;

            return (await axios.get(baseUrl + endpoint, { headers })).data;
        },
        post: async (endpoint, data, isP2P = false) => {
            const baseUrl = `${config.baseUrl}:${isP2P ? config.p2pPort : config.apiPort}`;

            return (await axios.post(baseUrl + endpoint, data, { headers })).data;
        },
    };
};

const paginate = async (config, endpoint) => {
    const data = [];
    let page = 1;
    let maxPages = null;
    while (maxPages === null || page <= maxPages) {
        const response = await request(config).get(`${endpoint}?page=${page}`);
        if (response) {
            page++;
            maxPages = response.meta.pageCount;
            data.push(...response.data);
        } else {
            break;
        }
    }

    return data;
};

export { logger, request, paginate };
