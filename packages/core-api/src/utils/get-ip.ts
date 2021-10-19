import { Request } from "@hapi/hapi";

export const getIp = (request: Request, trustProxy: boolean): string => {
    if (trustProxy) {
        return request.headers["x-forwarded-for"]?.split(",")[0]?.trim() ?? request.info.remoteAddress;
    }

    return request.info.remoteAddress;
};
