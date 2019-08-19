/**
 * @export
 * @interface IConfigAdapter
 */
export interface IConfigAdapter {
    loadConfiguration(): Promise<void>;

    loadEnvironmentVariables(): Promise<void>;
}
