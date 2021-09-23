export declare const businessSchema: {
    name: {
        $ref: string;
    };
    website: {
        $ref: string;
    };
    vat: {
        type: string;
        minLength: number;
        maxLength: number;
        $ref: string;
    };
    repository: {
        $ref: string;
    };
};
