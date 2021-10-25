import { parse } from "ipaddr.js";

// TODO: Check why process from ipaddr.js doesn't work
export const mapAddr = (addr: string) => parse(addr).toString();
