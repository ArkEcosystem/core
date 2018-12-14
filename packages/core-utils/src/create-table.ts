import Table from "cli-table3";

function createTable(opts, data) {
    const table = new Table(opts);

    for (const item of data) {
        // @ts-ignore
        table.push(item);
    }

    return table.toString();
}

export { createTable };
