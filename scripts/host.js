const fs = require("fs");
const http = require("http-server");

const optionDefinitions = [
  { name: "directory", alias: "d", type: String },
  { name: "port", alias: "p", type: Number, defaultValue: 8080 },
  { name: "local", alias: "l", type: Boolean },
  { name: "help", alias: "h" },
];

function usageAndExit() {
  console.log("Usage: node host.js -d directory [-p port] [-l]");
  process.exit(0);
}

function logRequest(req, res, error) {
  const date = "[" + new Date().toUTCString() + "]";
  const requestLog = "\"" + req.method + " " + req.url + "\"";
  if (error) {
    console.log(date + "ERROR: " + requestLog);
    console.log(error);
  } else {
    console.log(date + " - " + requestLog);
  }
}

if (require.main === module) {
  const cli = require("command-line-args");
  const args = cli(optionDefinitions);
  if (args["directory"] === undefined || "help" in args) {
    usageAndExit();
  }

  const root = args["directory"];
  const port = args["port"];
  const options = {
    host: "localhost",
    root,
    cache: -1,
    logFn: logRequest,
  };

  const server = http.createServer(options)
  server.listen(port, function() {
    console.log("Serving assets from http://" + options.host + ":" + port);
  });
}
