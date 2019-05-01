import prompts from "prompts";

export const confirm = async (message: string, yesCallback: any, noCallback?: any): Promise<void> => {
    const { confirm } = await prompts([
        {
            type: "confirm",
            name: "confirm",
            message,
        },
    ]);

    if (confirm) {
        await yesCallback();
    } else if (noCallback) {
        await noCallback();
    }
};
