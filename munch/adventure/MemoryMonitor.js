const logger = require("../logger.js");

const MB = 1024 * 1024;

class MemoryMonitor {

  constructor() {
    this.lastMem = null;
    this.lastTime = Date.now();
    this.rowCount = 0;
    this.rowInterval = 50;
  }

  checkpoint(label) {
    if (global.gc) global.gc();
    const mem = process.memoryUsage();
    const now = Date.now();
    const elapsed = ((now - this.lastTime) / 1000).toFixed(1);
    const heap = (mem.heapUsed / MB).toFixed(1);
    const rss = (mem.rss / MB).toFixed(1);
    const ext = (mem.external / MB).toFixed(1);
    const ab = ((mem.arrayBuffers || 0) / MB).toFixed(1);

    let delta = "";
    if (this.lastMem) {
      const dHeap = ((mem.heapUsed - this.lastMem.heapUsed) / MB).toFixed(1);
      const dRss = ((mem.rss - this.lastMem.rss) / MB).toFixed(1);
      delta = ` | delta heap:${dHeap > 0 ? "+" : ""}${dHeap}MB rss:${dRss > 0 ? "+" : ""}${dRss}MB`;
    }

    logger.info(`[MEM] ${label} | heap:${heap}MB rss:${rss}MB ext:${ext}MB ab:${ab}MB | ${elapsed}s${delta}`);
    this.lastMem = mem;
    this.lastTime = now;
  }

  row(label) {
    this.rowCount++;
    if (this.rowCount % this.rowInterval === 0) {
      this.checkpoint(`row ${this.rowCount}: ${label}`);
    }
  }

}

exports.MemoryMonitor = MemoryMonitor;
