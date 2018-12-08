import "jest-extended";

import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { Client } from "../src/client";
import block from "./__fixtures__/block";
import { setUp, tearDown } from "./__support__/setup";

const mockAxios = new MockAdapter(axios);

jest.setTimeout(30000);

const host = `http://127.0.0.1:4000`;

let client;

beforeAll(async () => {
  await setUp();
});

afterAll(async () => {
  await tearDown();
  mockAxios.restore();
});

beforeEach(() => {
  client = new Client(host);

  mockAxios.onGet(`${host}/peer/status`).reply(200);
});

afterEach(() => {
  mockAxios.reset();
});

describe("Client", () => {
  describe("constructor", () => {
    it("accepts 1 or more hosts as parameter", () => {
      expect(new Client(host).hosts).toEqual([host]);

      const hosts = [host, "http://localhost:4000"];

      expect(new Client(hosts).hosts).toEqual(hosts);
    });
  });

  describe("broadcast", () => {
    it("should be a function", () => {
      expect(client.broadcast).toBeFunction();
    });

    describe("when the host is available", () => {
      it("should be truthy if broadcasts", async () => {
        mockAxios.onPost(`${host}/internal/blocks`).reply(c => {
          expect(JSON.parse(c.data).block).toMatchObject(
            expect.objectContaining({
              id: block.data.id,
            }),
          );
          return [200, true];
        });

        await client.__chooseHost();

        const wasBroadcasted = await client.broadcast(block.toJson());
        expect(wasBroadcasted).toBeTruthy();
      });
    });
  });

  describe("getRound", () => {
    it("should be a function", () => {
      expect(client.getRound).toBeFunction();
    });

    describe("when the host is available", () => {
      it("should be ok", async () => {
        const expectedResponse = { foo: "bar" };
        mockAxios.onGet(`${host}/internal/rounds/current`).reply(200, { data: expectedResponse });

        const response = await client.getRound();

        expect(response).toEqual(expectedResponse);
      });
    });
  });

  describe("getTransactions", () => {
    it("should be a function", () => {
      expect(client.getTransactions).toBeFunction();
    });

    describe("when the host is available", () => {
      it("should be ok", async () => {
        const expectedResponse = { foo: "bar" };
        mockAxios.onGet(`${host}/internal/transactions/forging`).reply(200, { data: expectedResponse });

        await client.__chooseHost();
        const response = await client.getTransactions();

        expect(response).toEqual(expectedResponse);
      });
    });
  });

  describe("getNetworkState", () => {
    it("should be a function", () => {
      expect(client.getNetworkState).toBeFunction();
    });

    describe("when the host is available", () => {
      it("should be ok", async () => {
        const expectedResponse = { foo: "bar" };
        mockAxios.onGet(`${host}/internal/network/state`).reply(200, { data: expectedResponse });

        await client.__chooseHost();
        const response = await client.getNetworkState();

        expect(response).toEqual(expectedResponse);
      });
    });
  });

  describe("syncCheck", () => {
    it("should be a function", () => {
      expect(client.syncCheck).toBeFunction();
    });

    it("should induce network sync", async () => {
      jest.spyOn(axios, "get");
      mockAxios.onGet(`${host}/internal/blockchain/sync`).reply(200);

      await client.syncCheck();

      expect(axios.get).toHaveBeenCalledWith(`${host}/internal/blockchain/sync`, expect.any(Object));
    });
  });

  describe("getUsernames", () => {
    it("should be a function", () => {
      expect(client.getUsernames).toBeFunction();
    });

    it("should fetch usernames", async () => {
      jest.spyOn(axios, "get");
      const expectedResponse = { foo: "bar" };
      mockAxios.onGet(`${host}/internal/utils/usernames`).reply(200, { data: expectedResponse });

      const response = await client.getUsernames();

      expect(response).toEqual(expectedResponse);
    });
  });

  describe("emitEvent", () => {
    it("should be a function", () => {
      expect(client.emitEvent).toBeFunction();
    });
    it("should emit events", async () => {
      jest.spyOn(axios, "post");
      mockAxios.onPost(`${host}/internal/utils/events`).reply(c => {
        expect(JSON.parse(c.data)).toMatchObject({ event: "foo", body: "bar" });
        return [200];
      });

      await client.__chooseHost();
      await client.emitEvent("foo", "bar");

      expect(axios.post).toHaveBeenCalledWith(
        `${host}/internal/utils/events`,
        { event: "foo", body: "bar" },
        expect.any(Object),
      );
    });
  });
});
