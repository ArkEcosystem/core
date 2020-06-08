import { Server as HapiServer } from "@hapi/hapi";

const getRpcError = (httpResponseCode: number) => {
    if (httpResponseCode === 401) {
        return {
            code: -32001,
            message: "These credentials do not match our records",
        };
    }
    if (httpResponseCode === 403) {
        return {
            code: -32003,
            message: "Forbidden", // TODO: Maybe another message
        };
    }

    return {
        code: -32603,
        message: "Internal server error",
    };
};

export const rpcResponseHandler = {
    name: "rcpResponseHandler",
    version: "0.1.0",
    register: (server: HapiServer) => {
        server.ext({
            type: "onPreResponse",
            method(request, h) {
                const response = request.response;
                if (!response.isBoom) {
                    return h.continue;
                }

                return h.response({
                    jsonrpc: "2.0",
                    error: getRpcError(response.output.statusCode),
                    id: null,
                });
            },
        });
    },
};
