import app from "./__support__/setup";
import { dynamicFeeMatcher } from "../src/utils/dynamicfee-matcher";
import mockData from "./__fixtures__/transactions";

let blockchain;
let container;

beforeAll(async () => {
  container = await app.setUp();
  await container.resolvePlugin("blockchain").start();
});

afterAll(async () => {
  await app.tearDown();
});

describe("static fees", () => {
  beforeAll(() => {
    blockchain = container.resolvePlugin("blockchain");
    blockchain.getLastBlock = jest.fn(plugin => ({
      data: {
        height: 20,
      },
    }));
    const h = blockchain.getLastBlock().data.height;
    container.resolvePlugin("config").getConstants(h).fees.dynamic = false;
  });

  it("should be a function", () => {
    expect(dynamicFeeMatcher).toBeFunction();
  });

  it("should accept transactions matching the static fee for broadcast", () => {
    expect(dynamicFeeMatcher(mockData.dummy1).broadcast).toBeTrue();
    expect(dynamicFeeMatcher(mockData.dummy2).broadcast).toBeTrue();
  });

  it("should accept transactions matching the static fee to enter pool", () => {
    expect(dynamicFeeMatcher(mockData.dummy1).enterPool).toBeTrue();
    expect(dynamicFeeMatcher(mockData.dummy2).enterPool).toBeTrue();
  });

  it("should not broadcast transactions with a fee other than the static fee", () => {
    expect(dynamicFeeMatcher(mockData.dynamicFeeNormalDummy1).broadcast).toBeFalse();
    expect(dynamicFeeMatcher(mockData.dynamicFeeZero).broadcast).toBeFalse();
  });

  it("should not allow transactions with a fee other than the static fee to enter the pool", () => {
    expect(dynamicFeeMatcher(mockData.dynamicFeeNormalDummy1).enterPool).toBeFalse();
    expect(dynamicFeeMatcher(mockData.dynamicFeeZero).enterPool).toBeFalse();
  });
});

describe("dynamic fees", () => {
  beforeAll(() => {
    blockchain = container.resolvePlugin("blockchain");
    blockchain.getLastBlock = jest.fn(plugin => ({
      data: {
        height: 20,
      },
    }));
    const h = blockchain.getLastBlock().data.height;
    container.resolvePlugin("config").getConstants(h).fees.dynamic = true;
  });

  it("should broadcast transactions with high enough fee", () => {
    expect(dynamicFeeMatcher(mockData.dummy1).broadcast).toBeTrue();
    expect(dynamicFeeMatcher(mockData.dummy2).broadcast).toBeTrue();
    expect(dynamicFeeMatcher(mockData.dynamicFeeNormalDummy1).broadcast).toBeTrue();
  });

  it("should accept transactions with high enough fee to enter the pool", () => {
    expect(dynamicFeeMatcher(mockData.dummy1).enterPool).toBeTrue();
    expect(dynamicFeeMatcher(mockData.dummy2).enterPool).toBeTrue();
    expect(dynamicFeeMatcher(mockData.dynamicFeeNormalDummy1).enterPool).toBeTrue();
  });

  it("should not broadcast transactions with too low fee", () => {
    expect(dynamicFeeMatcher(mockData.dynamicFeeLowDummy2).broadcast).toBeFalse();
    expect(dynamicFeeMatcher(mockData.dynamicFeeZero).broadcast).toBeFalse();
  });

  it("should not allow transactions with too low fee to enter the pool", () => {
    expect(dynamicFeeMatcher(mockData.dynamicFeeLowDummy2).enterPool).toBeFalse();
    expect(dynamicFeeMatcher(mockData.dynamicFeeZero).enterPool).toBeFalse();
  });
});
