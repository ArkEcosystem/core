import * as ipAddr from "ipaddr.js";

export const mapAddr = (addr: string) => ipAddr.process(addr).toString();
