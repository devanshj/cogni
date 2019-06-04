import { appendFileSync, writeFileSync } from "fs";
import { join } from "path";

export function log(foo: any): true {
    
    appendFileSync(
        join(process.cwd(), "./logs.txt"),
        JSON.stringify(foo, null, "\t") + "\n"
    );
    return true;
}

export function clear() {
    writeFileSync(join(process.cwd(), "./logs.txt"), "");
}