export abstract class AbstractLogger {
    public logger: any;
    protected options: any;

    /**
     * Create a new logger instance.
     * @param  {Object} options
     */
    constructor(options: any) {
        this.options = options;
    }

    /**
     * Make the logger instance.
     * @return {Object}
     */
    public abstract make(): AbstractLogger;

    /**
     * Log an error message.
     * @param  {String} message
     * @return {void}
     */
    public abstract error(message: string): void;

    /**
     * Log a warning message.
     * @param  {String} message
     * @return {void}
     */
    public abstract warn(message: string): void;

    /**
     * Log an info message.
     * @param  {String} message
     * @return {void}
     */
    public abstract info(message: string): void;

    /**
     * Log a debug message.
     * @param  {String} message
     * @return {void}
     */
    public abstract debug(message: string): void;

    /**
     * Log a verbose message.
     * @param  {String} message
     * @return {void}
     */
    public abstract verbose(message: string): void;

    /**
     * Print the progress tracker.
     * @param  {String} title
     * @param  {Number} current
     * @param  {Number} max
     * @param  {String} postTitle
     * @param  {Number} figures
     * @return {void}
     */
    public abstract printTracker(
        title: string,
        current: number,
        max: number,
        postTitle: string,
        figures?: number,
    ): void;

    /**
     * Stop the progress tracker.
     * @param  {String} title
     * @param  {Number} current
     * @param  {Number} max
     * @return {void}
     */
    public abstract stopTracker(title: string, current: number, max: number): void;

    /**
     * Suppress console output.
     * @param  {Boolean}
     * @return {void}
     */
    public abstract suppressConsoleOutput(suppress: boolean): void;
}
