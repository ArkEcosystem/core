export interface MetaData {
    blocks: TableMetaData,
    transactions: TableMetaData,
    rounds: TableMetaData,

    folder: string,
    skipCompression: boolean,

    version?: string
    network?: string
}

export interface TableMetaData {
    count: number,
    startHeight: number,
    endHeight: number
}
