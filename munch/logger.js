const logger = require("electron-log");

logger.transports.maxSize = 5242880;

function clearLogFile(){
  logger.transports.file.getFile().clear();
}

exports.clear = clearLogFile;
exports.logger = logger;
exports.info = logger.info;
exports.warn = logger.warn;
exports.error = logger.error;
exports.debug = logger.debug;
exports.verbose = logger.verbose;
