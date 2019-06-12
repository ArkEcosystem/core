import clipboardy from "clipboardy";

export const copyToClipboard = data => {
    clipboardy.writeSync(JSON.stringify(data));
};

export const handleOutput = (opts, data) => {
    if (opts.copy) {
        return copyToClipboard(data);
    }

    if (opts.log) {
        return console.log(data);
    }

    return data;
};
