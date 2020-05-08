import { Server as HapiServer } from "@hapi/hapi";

const getRpcResponseCode = (httpResponseCode: number) => {
    if (httpResponseCode === 401) {
        return -32001;  // Unauthorized
    } if (httpResponseCode === 403) {
        return -32003; // Forbidden
    }

    return -32603; // Internal server error
}

export const rpcResponseHandler = {
    name: "rcpResponseHandler",
    version: "0.1.0",
    register: (server: HapiServer) => {
        server.ext({
            type: "onPreResponse",
            method(request, h) {
                let response = request.response;
                if (!response.isBoom) {
                    return h.continue;
                }

                return h.response({
                    jsonrpc: "2.0",
                    error: {
                        code: getRpcResponseCode(response.output.statusCode),
                        message: response.output.payload.message,
                    },
                    id: null
                });
            }
        })
    }
}
