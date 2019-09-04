import "jest-extended";

import nock from "nock";

import { httpie, HttpieError } from "@packages/core-kernel/src/utils/httpie";

beforeAll(() => nock.disableNetConnect());

afterAll(() => {
    nock.cleanAll();
    nock.enableNetConnect();
});

describe("Httpie", () => {
    it("should send a GET request and receive a response", async () => {
        nock("http://0.0.0.0:1234")
            .get("/")
            .reply(200, {});

        await expect(httpie.get("http://0.0.0.0:1234/")).resolves.toEqual({
            body: {},
            headers: { "content-type": "application/json" },
            status: 200,
        });
    });

    it("should send a POST request and receive a response", async () => {
        nock("http://0.0.0.0:1234")
            .post("/")
            .reply(200, {});

        await expect(httpie.post("http://0.0.0.0:1234/")).resolves.toEqual({
            body: {},
            headers: { "content-type": "application/json" },
            status: 200,
        });
    });

    it("should send a PUT request and receive a response", async () => {
        nock("http://0.0.0.0:1234")
            .put("/")
            .reply(200, {});

        await expect(httpie.put("http://0.0.0.0:1234/")).resolves.toEqual({
            body: {},
            headers: { "content-type": "application/json" },
            status: 200,
        });
    });

    it("should send a PATCH request and receive a response", async () => {
        nock("http://0.0.0.0:1234")
            .patch("/")
            .reply(200, {});

        await expect(httpie.patch("http://0.0.0.0:1234/")).resolves.toEqual({
            body: {},
            headers: { "content-type": "application/json" },
            status: 200,
        });
    });

    it("should send a HEAD request and receive a response", async () => {
        nock("http://0.0.0.0:1234")
            .head("/")
            .reply(200, {});

        await expect(httpie.head("http://0.0.0.0:1234/")).resolves.toEqual({
            body: {},
            headers: { "content-type": "application/json" },
            status: 200,
        });
    });

    it("should send a DELETE request and receive a response", async () => {
        nock("http://0.0.0.0:1234")
            .delete("/")
            .reply(200, {});

        await expect(httpie.delete("http://0.0.0.0:1234/")).resolves.toEqual({
            body: {},
            headers: { "content-type": "application/json" },
            status: 200,
        });
    });

    it("should send a request with a body", async () => {
        nock("http://0.0.0.0:1234")
            .post("/")
            .reply(200, (_, requestBody) => requestBody);

        await expect(httpie.post("http://0.0.0.0:1234/", { body: { key: "value" } })).resolves.toEqual({
            body: { key: "value" },
            headers: { "content-type": "application/json" },
            status: 200,
        });
    });

    it("should send a request and timeout", async () => {
        nock("http://0.0.0.0:1234")
            .get("/")
            .delayConnection(2000)
            .reply(200, {});

        await expect(httpie.get("http://0.0.0.0:1234/")).rejects.toThrowError(
            new HttpieError("Timeout awaiting 'request' for 1500ms"),
        );
    });
});
