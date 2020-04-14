export interface Codec {
    name: string,

    blocks(): any;
    transactions(): any;
    rounds(): any
}
