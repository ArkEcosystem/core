export interface Source {
    exists(value: string): Promise<boolean>;

    install(value: string): Promise<void>;

    update(value: string): Promise<void>;
}
