import { injectable } from "../ioc";

/**
 * @enum {number}
 */
enum OutputVerbosity {
    Quiet = 0,
    Normal = 1,
    Verbose = 2,
    Debug = 3,
}

/**
 * @class Output
 */
@injectable()
export class Output {
    /**
     * @private
     * @type {number}
     * @memberof Output
     */
    private verbosity: number = OutputVerbosity.Normal;

    /**
     * @private
     * @type {Function}
     * @memberof Output
     */
    private realStdout: Function = process.stdout.write;

    /**
     * Mutes writing to stdout.
     *
     * @memberof Output
     */
    public mute() {
        // @ts-ignore - We don't care about the type error, we just want to noop it.
        process.stdout.write = () => {};
    }

    /**
     * Unmutes writing to stdout.
     *
     * @memberof Output
     */
    public unmute() {
        // @ts-ignore - We don't care about the type error, we just want to restore it.
        process.stdout.write = this.realStdout;
    }

    /**
     * Sets the verbosity of the output.
     *
     * @param {number} level
     * @memberof Output
     */
    public setVerbosity(level: number): void {
        this.verbosity = level;
    }

    /**
     * Gets the current verbosity of the output.
     *
     * @returns {number}
     * @memberof Output
     */
    public getVerbosity(): number {
        return this.verbosity;
    }

    /**
     * Returns whether the verbosity is quiet.
     *
     * @returns {boolean}
     * @memberof Output
     */
    public isQuiet(): boolean {
        return OutputVerbosity.Quiet === this.verbosity;
    }

    /**
     * Returns whether the verbosity is normal.
     *
     * @returns {boolean}
     * @memberof Output
     */
    public isNormal(): boolean {
        return OutputVerbosity.Normal === this.verbosity;
    }

    /**
     * Returns whether the verbosity is verbose.
     *
     * @returns {boolean}
     * @memberof Output
     */
    public isVerbose(): boolean {
        return OutputVerbosity.Verbose <= this.verbosity;
    }

    /**
     * Returns whether the verbosity is debug.
     *
     * @returns {boolean}
     * @memberof Output
     */
    public isDebug(): boolean {
        return OutputVerbosity.Debug <= this.verbosity;
    }
}
