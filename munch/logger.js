const logger = require("electron-log");


logger.transports.maxSize = 5242880;
var cleared = false;
if (!cleared) {
  logger.transports.file.getFile().clear();
  cleared = true;
}

exports.logger = logger;
exports.info = logger.info;
exports.warn = logger.warn;
exports.error = logger.error;
exports.debug = logger.debug;
exports.verbose = logger.verbose;
