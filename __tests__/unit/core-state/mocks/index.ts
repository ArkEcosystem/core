import { container } from "./container";

jest.mock("@arkecosystem/core-container", () => {
    return container;
});
