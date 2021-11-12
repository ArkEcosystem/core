import Hapi from "@hapi/hapi";
import { getIp } from "@packages/core-api/src/utils/get-ip";

const clientIp = "127.0.0.1";
const proxyIp = "127.0.0.2";

const request: Partial<Hapi.Request> = {
    info: {
        remoteAddress: proxyIp,
    } as Partial<Hapi.RequestInfo> as Hapi.RequestInfo,
    headers: {
        ["x-forwarded-for"]: clientIp,
    },
};

describe("getIp", () => {
    it("should return IP from remoteAddress if trustProxy = false", () => {
        expect(getIp(request as Hapi.Request, false)).toEqual(proxyIp);
    });

    it("should return IP from headers if trustProxy = true", () => {
        expect(getIp(request as Hapi.Request, true)).toEqual(clientIp);
    });

    it("should return IP remoteAddress if trustProxy = true and x-forwarded-for headers are not set", () => {
        const requestWithoutHeaders: Partial<Hapi.Request> = {
            info: {
                remoteAddress: clientIp,
            } as Partial<Hapi.RequestInfo> as Hapi.RequestInfo,
            headers: {},
        };

        expect(getIp(requestWithoutHeaders as Hapi.Request, true)).toEqual(clientIp);
    });
});
