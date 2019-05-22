import { parse } from "ip6addr";

export const mapAddr = (addr: string) => parse(addr).toString({ format: "v4" });
