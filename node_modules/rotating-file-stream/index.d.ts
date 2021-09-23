import { WriteStream } from "fs";

export interface RfsOptions {
	compress?: string | Function | boolean;
	highWaterMark?: number;
	history?: string;
	immutable?: boolean;
	initialRotation?: boolean;
	interval?: string;
	maxFiles?: number;
	maxSize?: string;
	mode?: number;
	path?: string;
	rotate?: number;
	rotationTime?: boolean;
	size?: string;
}

declare function RotatingFileStream(fileName: string | Function, options: RfsOptions): WriteStream;

export default RotatingFileStream;
