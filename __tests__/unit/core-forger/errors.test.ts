import "jest-extended";

import { ForgerError, HostNoResponseError, RelayCommunicationError } from "@packages/core-forger/src/errors";

describe("Errors", () => {
    it("should construct base ForgerError", () => {
        const message = "I am an error";
        const error = new ForgerError(message);
        expect(() => {
            throw error;
        }).toThrow(message);
        expect(error.stack).toBeDefined();
    });

    it("should construct RelayCommunicationError", () => {
        const message = "custom message";
        const endpoint = "test_endpoint";
        const error = new RelayCommunicationError(endpoint, message);
        expect(() => {
            throw error;
        }).toThrow(`Request to ${endpoint} failed, because of '${message}'.`);
        expect(error.stack).toBeDefined();
    });

    it("should construct HostNoResponseError", () => {
        const host = "custom host";
        const error = new HostNoResponseError(host);
        expect(() => {
            throw error;
        }).toThrow(`${host} didn't respond. Trying again later.`);
        expect(error.stack).toBeDefined();
    });
});
