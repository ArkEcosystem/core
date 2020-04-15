import { workerData } from "worker_threads";
import { connect } from "./utils";

const init = async () => {
    console.log("Worker data: ", workerData);

    let connection = await connect({connection: workerData.connection});

    console.log("We have connection");

    await connection.close();
};

init();
