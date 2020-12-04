import { Services } from "@arkecosystem/core-cli";

export const getOnlineProcesses = (processManager: Services.ProcessManager): { name: string }[] => {
    return processManager.list().filter((x) => processManager.isOnline(x.name)) as [{ name: string }];
};

export const getCoreOrForgerProcessName = (processes: { name: string }[], token: string = "ark") => {
    const process = processes.find((x) => x.name === `${token}-forger` || x.name === `${token}-core`);

    if (!process) {
        throw new Error("Process with name ark-forger or ark-core is not online");
    }

    return process.name;
};
