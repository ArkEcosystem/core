/**
 * @export
 * @interface Source
 */
export interface Source {
    exists(value: string, version?: string): Promise<boolean>;

    install(value: string, version?: string): Promise<void>;

    update(value: string): Promise<void>;
}
