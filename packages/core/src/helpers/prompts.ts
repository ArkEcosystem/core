import prompts from "prompts";

export async function confirm(message: string, callback: any): Promise<void> {
    const { confirm } = await prompts([
        {
            type: "confirm",
            name: "confirm",
            message,
        },
    ]);

    if (confirm) {
        await callback();
    }
}
