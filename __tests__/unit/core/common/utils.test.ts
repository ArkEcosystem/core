import "jest-extended";

import Table from "cli-table3";
import envfile from "envfile";
import fs from "fs-extra";

import { renderTable, updateEnvironmentVariables } from "@packages/core/src/common/utils";

describe("renderTable", () => {
    it("should render a table with the given data", async () => {
        let message: string;
        jest.spyOn(console, "log").mockImplementationOnce(m => (message = m));

        renderTable(["ID", "Name"], (table: Table.Table) => {
            // @ts-ignore
            table.push([1, "John Doe"]);
            // @ts-ignore
            table.push([2, "Jane Doe"]);
        });

        expect(message).toContain("ID");
        expect(message).toContain("Name");
        expect(message).toContain(1);
        expect(message).toContain("John Doe");
        expect(message).toContain(2);
        expect(message).toContain("Jane Doe");
    });
});

describe("updateEnvironmentVariables", () => {
    it("should throw if the given file does not exist", async () => {
        expect(() => updateEnvironmentVariables("some-file", {})).toThrowError(
            "No environment file found at some-file.",
        );
    });

    it("should write key-value pairs", async () => {
        // Arrange
        const existsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
        const parseFileSync = jest.spyOn(envfile, "parseFileSync").mockImplementation(() => ({}));
        const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();

        // Act
        updateEnvironmentVariables("stub", { key: "value" });

        // Assert
        expect(existsSync).toHaveBeenCalledWith("stub");
        expect(parseFileSync).toHaveBeenCalledWith("stub");
        expect(writeFileSync).toHaveBeenCalledWith("stub", "key=value");

        // Reset
        existsSync.mockReset();
        parseFileSync.mockReset();
        writeFileSync.mockReset();
    });
});
