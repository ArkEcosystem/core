import clipboardy from "clipboardy";

function copyToClipboard(data) {
    clipboardy.writeSync(JSON.stringify(data));
}

function handleOutput(opts, data) {
    if (opts.copy) {
        return copyToClipboard(data);
    }

    if (opts.log) {
        // tslint:disable-next-line:no-console
        return console.log(data);
    }

    return data;
}

export { copyToClipboard, handleOutput };
