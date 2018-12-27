import pm2 from "pm2";

export function start(options: any) {
    pm2.connect(connectionError => {
        if (connectionError) {
            console.error(connectionError);
            process.exit(2);
        }

        pm2.start(
            {
                ...{
                    max_restarts: 5,
                    min_uptime: "5m",
                    kill_timeout: 30000,
                },
                ...options,
            },
            (startError, apps) => {
                pm2.disconnect();
                if (startError) {
                    throw startError;
                }
            },
        );
    });
}

export function stop(processName: string) {
    pm2.connect(connectionError => {
        if (connectionError) {
            console.error(connectionError);
            process.exit(2);
        }

        pm2.stop(processName, (stopError, apps) => {
            pm2.disconnect();

            if (stopError) {
                throw stopError;
            }
        });
    });
}

export function reload(processName: string) {
    pm2.connect(connectionError => {
        if (connectionError) {
            console.error(connectionError);
            process.exit(2);
        }

        pm2.reload(processName, (reloadError, apps) => {
            pm2.disconnect();

            if (reloadError) {
                throw reloadError;
            }
        });
    });
}

export function destroy(processName: string) {
    pm2.connect(connectionError => {
        if (connectionError) {
            console.error(connectionError);
            process.exit(2);
        }

        pm2.delete(processName, (deleteError, apps) => {
            pm2.disconnect();

            if (deleteError) {
                throw deleteError;
            }
        });
    });
}

export function log(processName: string) {
    return;
}
