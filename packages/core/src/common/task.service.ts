import Listr from "listr";

import { abort } from "./cli";

export class TaskService {
    private tasks: Array<{ title: string; task: any }> = [];

    public add(title: string, task: any): this {
        this.tasks.push({ title, task });

        return this;
    }

    public async run(): Promise<void> {
        try {
            await new Listr(this.tasks).run();
        } catch (error) {
            abort(error.message);
        }
    }
}
