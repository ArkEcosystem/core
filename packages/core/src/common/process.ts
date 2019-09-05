import cli from "cli-ux";
import { freemem, totalmem } from "os";
import prompts from "prompts";

import { CommandFlags, ProcessOptions } from "../types";
import { abort } from "./cli";
import { processManager } from "./process-manager";

export const restartProcess = (processName: string): void => {
    try {
        cli.action.start(`Restarting ${processName}`);

        processManager.restart(processName);
    } catch (error) {
        abort(error.stderr ? `${error.message}: ${error.stderr}` : error.message);
    } finally {
        cli.action.stop();
    }
};

export const restartRunningProcess = async (processName: string): Promise<void> => {
    if (processManager.isOnline(processName)) {
        restartProcess(processName);
    }
};

export const restartRunningProcessWithPrompt = async (processName: string): Promise<void> => {
    if (processManager.isOnline(processName)) {
        const { confirm } = await prompts([
            {
                type: "confirm",
                name: "confirm",
                message: `Would you like to restart the ${processName} process?`,
            },
        ]);

        if (confirm) {
            restartProcess(processName);
        }
    }
};

export const abortRunningProcess = (processName: string): void => {
    if (processManager.isOnline(processName)) {
        abort(`The "${processName}" process is already running.`);
    }
};

export const abortStoppedProcess = (processName: string): void => {
    if (processManager.isStopped(processName)) {
        abort(`The "${processName}" process is not running.`);
    }
};

export const abortErroredProcess = (processName: string): void => {
    if (processManager.isErrored(processName)) {
        abort(`The "${processName}" process has errored.`);
    }
};

export const abortUnknownProcess = (processName: string): void => {
    if (processManager.isUnknown(processName)) {
        abort(`The "${processName}" process has entered an unknown state.`);
    }
};

export const abortMissingProcess = (processName: string): void => {
    if (processManager.missing(processName)) {
        abort(`The "${processName}" process does not exist.`);
    }
};

export const daemonizeProcess = (options: ProcessOptions, flags: CommandFlags): void => {
    const processName: string = options.name;

    try {
        if (processManager.has(processName)) {
            abortUnknownProcess(processName);
            abortRunningProcess(processName);
        }

        cli.action.start(`Starting ${processName}`);

        const flagsProcess: Record<string, boolean | number | string> = {
            "max-restarts": 5,
            "kill-timeout": 30000,
        };

        if (!flags.daemon) {
            flagsProcess["no-daemon"] = true;
        }

        flagsProcess.name = processName;

        const totalMemGb: number = totalmem() / Math.pow(1024, 3);
        const freeMemGb: number = freemem() / Math.pow(1024, 3);
        const potato: boolean = totalMemGb < 2 || freeMemGb < 1.5;

        processManager.start(
            {
                ...options,
                ...{
                    env: {
                        NODE_ENV: "production",
                        CORE_ENV: flags.env,
                    },
                    node_args: potato ? { max_old_space_size: 500 } : undefined,
                },
            },
            flagsProcess,
        );
    } catch (error) {
        abort(error.stderr ? `${error.message}: ${error.stderr}` : error.message);
    } finally {
        cli.action.stop();
    }
};
