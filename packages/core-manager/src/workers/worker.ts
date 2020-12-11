import { parentPort, workerData } from "worker_threads";

if (!parentPort) {
    process.exit(-1);
}

console.log(`We get the message with data: ${JSON.stringify(workerData)}`);

//
// cosnt postMessageAfter = async () => {
//     await new Promise((re))
// }

setTimeout(() => {
    throw new Error("Some error");

    parentPort?.postMessage({
        test: "some_data",
    });
}, 10000);
