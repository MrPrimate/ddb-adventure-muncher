const logger = require("electron-log");

logger.transports.maxSize = 5242880;

function clearLogFile(){
  logger.transports.file.getFile().clear();
}

// level: 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly'
function setLogLevel(level = "silly") {
  logger.transports.file.level = level;
}

exports.clear = clearLogFile;
exports.logger = logger;
exports.info = logger.info;
exports.warn = logger.warn;
exports.error = logger.error;
exports.debug = logger.debug;
exports.verbose = logger.verbose;
exports.silly = logger.silly;
exports.setLogLevel = setLogLevel;
