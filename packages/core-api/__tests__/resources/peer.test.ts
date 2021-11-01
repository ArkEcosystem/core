import "jest-extended";

import { PeerResource } from "@packages/core-api/src/resources";

let resource: PeerResource;

beforeEach(() => {
    resource = new PeerResource();
});

describe("PeerResource", () => {
    let data: any;

    beforeEach(() => {
        data = {
            ip: "127.0.0.1",
            port: 4003,
            ports: [4003],
            version: "3.0.0",
            height: 2,
            latency: 200,
        };
    });

    describe("raw", () => {
        it("should return raw object", async () => {
            expect(resource.raw(data)).toEqual(data);
        });
    });

    describe("transform", () => {
        it("should return transformed object", async () => {
            expect(resource.transform(data)).toEqual(data);
        });

        it("should return transformed object when data have state", async () => {
            const dataWithState = Object.assign({}, data);

            // @ts-ignore
            dataWithState.state = {
                height: 2,
            };

            expect(resource.transform(dataWithState)).toEqual(data);
        });
    });
});
