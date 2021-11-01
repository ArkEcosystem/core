import { getIp } from "@packages/core-api/src/utils/get-ip";

const clientIp = "127.0.0.1";
const proxyIp = "127.0.0.2";

const request = {
    info: {
        remoteAddress: proxyIp,
    },
    headers: {
        ["x-forwarded-for"]: clientIp,
    },
};

describe("getIp", () => {
    it("should return IP from remoteAddress if trustProxy = false", () => {
        expect(getIp(request, false)).toEqual(proxyIp);
    });

    it("should return IP from headers if trustProxy = true", () => {
        expect(getIp(request, true)).toEqual(clientIp);
    });

    it("should return IP remoteAddress if trustProxy = true and x-forwarded-for headers are not set", () => {
        const requestWithoutHeaders = {
            info: {
                remoteAddress: clientIp,
            },
            headers: {},
        };

        expect(getIp(requestWithoutHeaders, true)).toEqual(clientIp);
    });
});
