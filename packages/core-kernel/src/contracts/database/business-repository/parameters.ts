export interface Parameters {
    // @ts-ignore
    offset?: number | undefined;
    // @ts-ignore
    limit?: number | undefined;
    // @ts-ignore
    orderBy?: string | undefined;
    [key: string]: object | number | string | boolean;
}
