'use strict';

const internals = {};


exports.Team = internals.Team = class {

    #meetings = null;
    #count = null;
    #notes = null;

    constructor(options) {

        this._init(options);
    }

    _init(options = {}) {

        this.work = new Promise((resolve, reject) => {

            this._resolve = resolve;
            this._reject = reject;
        });

        const meetings = options.meetings || 1;
        this.#meetings = meetings;
        this.#count = meetings;
        this.#notes = [];
    }

    attend(note) {

        if (note instanceof Error) {
            return this._reject(note);
        }

        this.#notes.push(note);

        if (--this.#count) {
            return;
        }

        return this._resolve(this.#meetings === 1 ? this.#notes[0] : this.#notes);
    }

    async regroup(options) {

        await this.work;

        this._init(options);
    }
};
