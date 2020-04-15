import { parentPort, workerData } from "worker_threads";

let timeout = (): Promise<void> => {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, 2000)
    })
};

const init = async () => {
    console.log("Hello form the worker");
    console.log("Data: ", workerData);

    await timeout();

    parentPort?.postMessage("Message from worker");

    parentPort?.postMessage("Worker finish");

    return 1+1;
};

init();
