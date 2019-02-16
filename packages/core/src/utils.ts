import Table from "cli-table3";

export async function renderTable(head: string[], callback: any): Promise<void> {
    const table = new Table({
        head,
        chars: { mid: "", "left-mid": "", "mid-mid": "", "right-mid": "" },
    });

    await callback(table);

    console.log(table.toString());
}
