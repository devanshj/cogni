require("./polyfills/index.js");

import cogniProgram from "./cli";
cogniProgram.takeArgv(process.argv.slice(1));