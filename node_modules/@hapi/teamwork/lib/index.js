'use strict';

const internals = {};


exports = module.exports = internals.Team = class {

    constructor(options) {

        this._init(options);
    }

    _init(options = {}) {

        this.work = new Promise((resolve, reject) => {

            this._resolve = resolve;
            this._reject = reject;
        });

        const meetings = options.meetings || 1;
        this._meetings = meetings;
        this._count = meetings;
        this._notes = [];
    }

    attend(note) {

        if (note instanceof Error) {
            return this._reject(note);
        }

        this._notes.push(note);

        if (--this._count) {
            return;
        }

        return this._resolve(this._meetings === 1 ? this._notes[0] : this._notes);
    }

    async regroup(options) {

        await this.work;

        this._init(options);
    }
};


Object.defineProperties(internals.Team, {
    __esModule: {
        value: true
    },
    default: {
        value: internals.Team
    },
    Teamwork: {
        value: internals.Team
    }
});
