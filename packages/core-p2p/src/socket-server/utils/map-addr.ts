import { process } from "ipaddr.js";

export const mapAddr = (addr: string) => process(addr).toString();
