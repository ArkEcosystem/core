import Table from "cli-table3";

export function renderTable(head: string[], callback: any): void {
    const table = new Table({
        head,
        chars: { mid: "", "left-mid": "", "mid-mid": "", "right-mid": "" },
    });

    callback(table);

    console.log(table.toString());
}
