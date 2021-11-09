// public mute() {
// public unmute() {

import { Console } from "@packages/core-test-framework";
import { Output } from "@packages/core-cli/src/output";

let cli;
let output;

beforeEach(() => {
    cli = new Console();

    output = cli.app.resolve(Output);
});

describe("Output", () => {
    it("should mute and unmute the output", () => {
        const spyWrite = jest.spyOn(process.stdout, "write");

        console.log("this should be written to stdout");

        output.mute();

        console.log("this should not be written to stdout");

        output.unmute();

        expect(spyWrite).toHaveBeenCalled();
    });

    it("should get and set the verbosity level", () => {
        expect(output.getVerbosity()).toBe(1);

        output.setVerbosity(2);

        expect(output.getVerbosity()).toBe(2);
    });

    it("should determine if the verbosity level is quiet", () => {
        output.setVerbosity(0);

        expect(output.isQuiet()).toBeTrue();

        output.setVerbosity(1);

        expect(output.isQuiet()).toBeFalse();
    });

    it("should determine if the verbosity level is normal", () => {
        output.setVerbosity(1);

        expect(output.isNormal()).toBeTrue();

        output.setVerbosity(0);

        expect(output.isNormal()).toBeFalse();
    });

    it("should determine if the verbosity level is verbose", () => {
        output.setVerbosity(2);

        expect(output.isVerbose()).toBeTrue();

        output.setVerbosity(0);

        expect(output.isVerbose()).toBeFalse();
    });

    it("should determine if the verbosity level is debug", () => {
        output.setVerbosity(3);

        expect(output.isDebug()).toBeTrue();

        output.setVerbosity(0);

        expect(output.isDebug()).toBeFalse();
    });
});
