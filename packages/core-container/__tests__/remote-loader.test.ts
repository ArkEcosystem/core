import "jest-extended";

import { pathExistsSync, removeSync } from "fs-extra";

import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { RemoteLoader } from "../src/remote-loader";

const axiosMock = new MockAdapter(axios);
const configDir = "./__test-remote-config__";

let testSubject;

afterAll(() => {
    removeSync(configDir);
});

beforeEach(() => {
    testSubject = new RemoteLoader({
        remote: "127.0.0.1:4002",
        config: configDir,
        data: "./data",
    });
});

afterEach(() => {
    axiosMock.reset();
});

describe("Remote Loader", () => {
    it("should ensure the config directory exists", () => {
        expect(pathExistsSync(testSubject.config)).toBeTrue();
    });
});
