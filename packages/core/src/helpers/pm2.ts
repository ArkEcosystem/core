import Table from "cli-table3";
import cli from "cli-ux";
import dayjs from "dayjs-ext";
import pm2 from "pm2";
import prettyBytes from "pretty-bytes";
import prettyMs from "pretty-ms";
import prompts from "prompts";
import { Tail } from "tail";

function createConnection(callback) {
    pm2.connect(error => {
        if (error) {
            console.error(error.message);
            process.exit(2);
        }

        callback();
    });
}

export function start(options: any) {
    const processName = options.name;

    createConnection(() => {
        pm2.describe(processName, async (error, apps) => {
            if (error) {
                console.error(error.message);
                process.exit();
            }

            if (apps[0]) {
                const response = await prompts({
                    type: "confirm",
                    name: "confirm",
                    message: "A process is already running, would you like to restart it?",
                    initial: true,
                });

                if (response.confirm) {
                    pm2.reload(processName, error => {
                        pm2.disconnect();

                        if (error) {
                            console.error(error.message);
                            process.exit();
                        }

                        process.exit();
                    });
                } else {
                    pm2.disconnect();
                }
            } else {
                pm2.start(
                    {
                        ...{
                            max_restarts: 5,
                            min_uptime: "5m",
                            kill_timeout: 30000,
                        },
                        ...options,
                    },
                    error => {
                        pm2.disconnect();

                        if (error) {
                            console.error(error.message);
                            process.exit();
                        }
                    },
                );
            }
        });
    });
}

export function stop(processName: string) {
    createConnection(() => {
        pm2.stop(processName, error => {
            pm2.disconnect();

            if (error) {
                if (error.message === "process name not found") {
                    console.warn(`The "${processName}" process does not exist. Failed to stop!`);
                } else {
                    throw error;
                }
            }
        });
    });
}

export function restart(processName: string) {
    createConnection(() => {
        pm2.reload(processName, error => {
            pm2.disconnect();

            if (error) {
                if (error.message === "process name not found") {
                    console.warn(`The "${processName}" process does not exist. Failed to restart!`);
                } else {
                    throw error;
                }
            }
        });
    });
}

export function shutdown(processName: string) {
    createConnection(() => {
        pm2.delete(processName, error => {
            pm2.disconnect();

            if (error) {
                if (error.message === "process name not found") {
                    console.warn(`The "${processName}" process does not exist. Failed to shutdown!`);
                } else {
                    throw error;
                }
            }
        });
    });
}

export function list(token: string) {
    createConnection(() => {
        pm2.list((error, processDescriptionList) => {
            pm2.disconnect();

            if (error) {
                console.error(error.message);
                process.exit();
            }

            const table = new Table({
                head: ["ID", "Name", "Version", "Status", "Uptime", "CPU", "RAM"],
                chars: { mid: "", "left-mid": "", "mid-mid": "", "right-mid": "" },
            });

            const processList = Object.values(processDescriptionList).filter(p => p.name.startsWith(token));

            for (const process of processList) {
                // @ts-ignore
                table.push([
                    process.pid,
                    process.name,
                    // @ts-ignore
                    process.pm2_env.version,
                    process.pm2_env.status,
                    // @ts-ignore
                    prettyMs(dayjs().diff(process.pm2_env.pm_uptime)),
                    `${process.monit.cpu}%`,
                    prettyBytes(process.monit.memory),
                ]);
            }

            console.log(table.toString());
        });
    });
}

export function log(processName: string, onlyErrors: boolean) {
    createConnection(() => {
        pm2.describe(processName, (error, apps) => {
            pm2.disconnect();

            if (error) {
                console.error(error.message);
                process.exit();
            }

            if (!apps[0]) {
                console.warn(`The "${processName}" process is not running. No logs to be viewed!`);
                process.exit();
            }

            const app = apps[0].pm2_env;
            const file = onlyErrors ? app.pm_err_log_path : app.pm_out_log_path;

            const log = new Tail(file);

            cli.action.start(`Waiting for ${file}`);

            log.on("line", data => {
                console.log(data);

                if (cli.action.running) {
                    cli.action.stop();
                }
            });

            log.on("error", error => console.error("ERROR: ", error));
        });
    });
}
