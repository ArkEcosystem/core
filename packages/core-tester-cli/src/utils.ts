import clipboardy from "clipboardy";

export function copyToClipboard(data) {
    clipboardy.writeSync(JSON.stringify(data));
}

export function handleOutput(opts, data) {
    if (opts.copy) {
        return copyToClipboard(data);
    }

    if (opts.log) {
        return console.log(data);
    }

    return data;
}
