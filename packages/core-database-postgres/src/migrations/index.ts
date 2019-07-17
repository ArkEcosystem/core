import { loadQueryFile } from "../utils";

export const migrations = [
    loadQueryFile(__dirname, "./20180304100000-create-migrations-table.sql"),
    loadQueryFile(__dirname, "./20180305100000-create-wallets-table.sql"),
    loadQueryFile(__dirname, "./20180305200000-create-rounds-table.sql"),
    loadQueryFile(__dirname, "./20180305300000-create-blocks-table.sql"),
    loadQueryFile(__dirname, "./20180305400000-create-transactions-table.sql"),
    loadQueryFile(__dirname, "./20181129400000-add-block_id-index-to-transactions-table.sql"),
    loadQueryFile(__dirname, "./20181204100000-add-generator_public_key-index-to-blocks-table.sql"),
    loadQueryFile(__dirname, "./20181204200000-add-timestamp-index-to-blocks-table.sql"),
    loadQueryFile(__dirname, "./20181204300000-add-sender_public_key-index-to-transactions-table.sql"),
    loadQueryFile(__dirname, "./20181204400000-add-recipient_id-index-to-transactions-table.sql"),
    loadQueryFile(__dirname, "./20190307000000-drop-wallets-table.sql"),
    loadQueryFile(__dirname, "./20190313000000-add-asset-column-to-transactions-table.sql"),
    loadQueryFile(__dirname, "./20190606000000-add-block-id-foreign-key-on-transactions.sql"),
    loadQueryFile(__dirname, "./20190619000000-drop-id-column-from-rounds-table.sql"),
    loadQueryFile(__dirname, "./20190626000000-enforce-chained-blocks.sql"),
];
