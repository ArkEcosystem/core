import { Server as HapiServer } from "@hapi/hapi";

const getRpcResponseCode = (httpResponseCode: number) => {
    return -32001

    // TODO: Implement after auth plugin
    // if (httpResponseCode === 401) {
    //     return -32001
    // } if (httpResponseCode === 403) {
    //     return -32001
    // }
    //
    // throw new Error("Unsupported status code")
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
