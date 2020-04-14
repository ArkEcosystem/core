export interface MetaData {
    blocks: TableMetaData,
    transactions: TableMetaData,
    rounds: TableMetaData,

    folder: string,
    skipCompression: boolean,
    network: string,
    packageVersion: string,

    codec?: string
}

export interface TableMetaData {
    count: number,
    startHeight: number,
    endHeight: number
}
