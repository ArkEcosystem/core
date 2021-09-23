export declare const defaults: {
    transports: {
        console: {
            constructor: string;
            options: {
                level: string;
                format: import("logform").Format;
                stderrLevels: string[];
            };
        };
        dailyRotate: {
            package: string;
            constructor: string;
            options: {
                level: string;
                format: import("logform").Format;
                filename: string;
                datePattern: string;
                zippedArchive: boolean;
                maxSize: string;
                maxFiles: string;
            };
        };
    };
};
