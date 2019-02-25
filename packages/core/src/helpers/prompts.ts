import prompts from "prompts";

export async function requestConfirmation(message: string, callback: any): Promise<void> {
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
