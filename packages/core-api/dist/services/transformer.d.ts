declare class Transformer {
    private readonly transformers;
    toResource(data: any, transformer: any, transform?: boolean): object;
    toCollection(data: any, transformer: any, transform?: boolean): object[];
}
export declare const transformerService: Transformer;
export {};
