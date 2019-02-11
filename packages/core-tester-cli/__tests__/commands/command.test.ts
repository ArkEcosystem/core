import "jest-extended";

import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { BaseCommand } from "../../src/commands/command";

const mockAxios = new MockAdapter(axios);

beforeEach(() => {
    mockAxios.reset();
});

describe("Command Base", () => {
    it.skip("", () => false);
});
