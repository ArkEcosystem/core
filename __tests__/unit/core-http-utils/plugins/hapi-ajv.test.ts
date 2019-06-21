// import { mocked } from 'ts-jest/utils';
import "../mocks/boom";
import "../mocks/core-container";
import "../mocks/server";
import "../mocks/validation";

import { Validation } from "@arkecosystem/crypto";
import Boom from "@hapi/boom";
import { Server } from "@hapi/hapi";
import { hapiAjv } from "../../../../packages/core-http-utils/src/plugins/hapi-ajv";

describe("Plugins - HAPI AJV", () => {
    let server;
    describe("register", () => {
        beforeAll(async () => {
            server = new Server();
            await hapiAjv.register(server, {});
        });
        it("validation", async () => {
            // mock server implements ext
            expect(server.ext).toBeCalled();
        });
    });
});
