import "jest-extended";
import { LogManager } from "../src/manager";

class FakeDriver {
  public make() {
    return this;
  }
}

const manager = new LogManager();

describe("Config Manager", () => {
  it("should be an object", () => {
    expect(manager).toBeObject();
  });

  describe("driver", () => {
    it("should be a function", () => {
      expect(manager.driver).toBeFunction();
    });

    it("should return the driver", async () => {
      await manager.makeDriver(new FakeDriver());

      expect(manager.driver()).toBeInstanceOf(FakeDriver);
    });
  });

  describe("makeDriver", () => {
    it("should be a function", () => {
      expect(manager.makeDriver).toBeFunction();
    });
  });
});
