import { Options, Ora } from "ora";
import { JsonObject } from "type-fest";

import {
    AppHeader,
    Ask,
    AskDate,
    AskHidden,
    AskNumber,
    AskPassword,
    AutoComplete,
    Box,
    Clear,
    Confirm,
    Error,
    Fatal,
    Info,
    Listing,
    Log,
    MultiSelect,
    NewLine,
    Prompt,
    Select,
    Spinner,
    Success,
    Table,
    TaskList,
    Title,
    Toggle,
    Warning,
} from "./components";
import { Application } from "./contracts";
import { Identifiers, inject, injectable } from "./ioc";

/**
 * @export
 * @class ComponentFactory
 */
@injectable()
export class ComponentFactory {
    /**
     * @private
     * @type {Application}
     * @memberof ComponentFactory
     */
    @inject(Identifiers.Application)
    protected readonly app!: Application;

    /**
     * @returns {string}
     * @memberof ComponentFactory
     */
    public appHeader(): string {
        return this.app.get<AppHeader>(Identifiers.AppHeader).render();
    }

    /**
     * @param {string} message
     * @param {object} [opts={}]
     * @returns {Promise<string>}
     * @memberof ComponentFactory
     */
    public async askDate(message: string, opts: object = {}): Promise<string> {
        return this.app.get<AskDate>(Identifiers.AskDate).render(message, opts);
    }

    /**
     * @param {string} message
     * @param {object} [opts={}]
     * @returns {Promise<string>}
     * @memberof ComponentFactory
     */
    public async askHidden(message: string, opts: object = {}): Promise<string> {
        return this.app.get<AskHidden>(Identifiers.AskHidden).render(message, opts);
    }

    /**
     * @param {string} message
     * @param {object} [opts={}]
     * @returns {Promise<number>}
     * @memberof ComponentFactory
     */
    public async askNumber(message: string, opts: object = {}): Promise<number> {
        return this.app.get<AskNumber>(Identifiers.AskNumber).render(message, opts);
    }

    /**
     * @param {string} message
     * @param {object} [opts={}]
     * @returns {Promise<string>}
     * @memberof ComponentFactory
     */
    public async askPassword(message: string, opts: object = {}): Promise<string> {
        return this.app.get<AskPassword>(Identifiers.AskPassword).render(message, opts);
    }

    /**
     * @param {string} message
     * @param {object} [opts={}]
     * @returns {Promise<string>}
     * @memberof ComponentFactory
     */
    public async ask(message: string, opts: object = {}): Promise<string> {
        return this.app.get<Ask>(Identifiers.Ask).render(message, opts);
    }

    /**
     * @param {string} message
     * @param {any[]} choices
     * @param {object} [opts={}]
     * @returns {Promise<string>}
     * @memberof ComponentFactory
     */
    public async autoComplete(message: string, choices: any[], opts: object = {}): Promise<string> {
        return this.app.get<AutoComplete>(Identifiers.AutoComplete).render(message, choices, opts);
    }

    /**
     * @param {string} message
     * @returns {void}
     * @memberof ComponentFactory
     */
    public box(message: string): void {
        return this.app.get<Box>(Identifiers.Box).render(message);
    }

    /**
     * @returns {void}
     * @memberof ComponentFactory
     */
    public clear(): void {
        return this.app.get<Clear>(Identifiers.Clear).render();
    }

    /**
     * @param {string} message
     * @param {object} [opts={}]
     * @returns {Promise<boolean>}
     * @memberof ComponentFactory
     */
    public async confirm(message: string, opts: object = {}): Promise<boolean> {
        return this.app.get<Confirm>(Identifiers.Confirm).render(message, opts);
    }

    /**
     * @param {string} message
     * @returns {void}
     * @memberof ComponentFactory
     */
    public error(message: string): void {
        return this.app.get<Error>(Identifiers.Error).render(message);
    }

    /**
     * @param {string} message
     * @returns {void}
     * @memberof ComponentFactory
     */
    public fatal(message: string): void {
        return this.app.get<Fatal>(Identifiers.Fatal).render(message);
    }

    /**
     * @param {string} message
     * @returns {void}
     * @memberof ComponentFactory
     */
    public info(message: string): void {
        return this.app.get<Info>(Identifiers.Info).render(message);
    }

    /**
     * @param {string[]} elements
     * @returns {Promise<void>}
     * @memberof ComponentFactory
     */
    public async listing(elements: string[]): Promise<void> {
        return this.app.get<Listing>(Identifiers.Listing).render(elements);
    }

    /**
     * @param {string} message
     * @returns {void}
     * @memberof ComponentFactory
     */
    public log(message: string): void {
        return this.app.get<Log>(Identifiers.Log).render(message);
    }

    /**
     * @param {string} message
     * @param {any[]} choices
     * @param {object} [opts={}]
     * @returns {Promise<string[]>}
     * @memberof ComponentFactory
     */
    public async multiSelect(message: string, choices: any[], opts: object = {}): Promise<string[]> {
        return this.app.get<MultiSelect>(Identifiers.MultiSelect).render(message, choices, opts);
    }

    /**
     * @param {number} [count=1]
     * @returns {void}
     * @memberof ComponentFactory
     */
    public newLine(count: number = 1): void {
        return this.app.get<NewLine>(Identifiers.NewLine).render(count);
    }

    /**
     * @param {object} options
     * @returns {Promise<JsonObject>}
     * @memberof ComponentFactory
     */
    public async prompt(options: object): Promise<JsonObject> {
        return this.app.get<Prompt>(Identifiers.Prompt).render(options);
    }

    /**
     * @param {string} message
     * @param {any[]} choices
     * @param {object} [opts={}]
     * @returns {Promise<string>}
     * @memberof ComponentFactory
     */
    public async select(message: string, choices: any[], opts: object = {}): Promise<string> {
        return this.app.get<Select>(Identifiers.Select).render(message, choices, opts);
    }

    /**
     * @param {(string | Options | undefined)} [options]
     * @returns {Ora}
     * @memberof ComponentFactory
     */
    public spinner(options?: string | Options | undefined): Ora {
        return this.app.get<Spinner>(Identifiers.Spinner).render(options);
    }

    /**
     * @param {string} message
     * @returns {void}
     * @memberof ComponentFactory
     */
    public success(message: string): void {
        return this.app.get<Success>(Identifiers.Success).render(message);
    }

    /**
     * @param {string[]} head
     * @param {*} callback
     * @param {object} [opts={}]
     * @returns {void}
     * @memberof ComponentFactory
     */
    public table(head: string[], callback: any, opts: object = {}): void {
        return this.app.get<Table>(Identifiers.Table).render(head, callback, opts);
    }

    /**
     * @param {{ title: string; task: any }[]} tasks
     * @returns {Promise<void>}
     * @memberof ComponentFactory
     */
    public async taskList(tasks: { title: string; task: any }[]): Promise<void> {
        return this.app.get<TaskList>(Identifiers.TaskList).render(tasks);
    }

    /**
     * @param {string} title
     * @returns {Promise<void>}
     * @memberof ComponentFactory
     */
    public async title(title: string): Promise<void> {
        return this.app.get<Title>(Identifiers.Title).render(title);
    }

    /**
     * @param {string} message
     * @param {object} [opts={}]
     * @returns {Promise<boolean>}
     * @memberof ComponentFactory
     */
    public async toggle(message: string, opts: object = {}): Promise<boolean> {
        return this.app.get<Toggle>(Identifiers.Toggle).render(message, opts);
    }

    /**
     * @param {string} message
     * @returns {void}
     * @memberof ComponentFactory
     */
    public warning(message: string): void {
        return this.app.get<Warning>(Identifiers.Warning).render(message);
    }
}
