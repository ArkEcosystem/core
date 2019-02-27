import dayjs from "dayjs-ext";
import "jest-extended";
import { Dato, dato } from "../src/dato";

const epoch = "2017-03-21T13:00:00.000Z";

// @ts-ignore
const add = (value: number, unit: string) => day.add(value, unit).toString();

// @ts-ignore
const subtract = (value: number, unit: string) => day.subtract(value, unit).toString();

let day: dayjs.Dayjs;
let mom: Dato;
beforeEach(() => {
    day = dayjs(epoch).utc();
    mom = dato(epoch);
});

describe("Dato", () => {
    it("diff", () => {
        // @ts-ignore
        expect(mom.diff(day.add(10, "milliseconds").toDate())).toBe(10);
    });

    it("isAfter", () => {
        // @ts-ignore
        expect(mom.isAfter(day.subtract(10, "minutes").toDate())).toBeTrue();
    });

    it("isBefore", () => {
        // @ts-ignore
        expect(mom.isBefore(day.add(10, "minutes").toDate())).toBeTrue();
    });

    it("addSeconds", () => {
        expect(mom.addSeconds(10).toUTC()).toBe(add(10, "seconds"));
    });

    it("addMinutes", () => {
        expect(mom.addMinutes(10).toUTC()).toBe(add(10, "minutes"));
    });

    it("subtractSeconds", () => {
        expect(mom.subtractSeconds(10).toUTC()).toBe(subtract(10, "seconds"));
    });

    it("subtractMinutes", () => {
        expect(mom.subtractMinutes(10).toUTC()).toBe(subtract(10, "minutes"));
    });

    it("toDate", () => {
        expect(mom.toDate()).toEqual(day.toDate());
    });

    it("toMilliseconds", () => {
        expect(mom.toMilliseconds()).toBe(day.valueOf());
    });

    it("toUTC", () => {
        expect(mom.toUTC()).toBe(day.toString());
    });

    it("toISO", () => {
        expect(mom.toISO()).toBe(day.toISOString());
    });

    it("toUnix", () => {
        expect(mom.toUnix()).toBe(day.unix());
    });
});
