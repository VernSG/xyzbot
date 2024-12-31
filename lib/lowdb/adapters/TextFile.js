const fs = require("fs");
const { Writer } = require("steno");
class TextFile {
  constructor(filename) {
    this.filename = filename;
    this.writer = new Writer(filename);
  }
  async read() {
    let data;
    try {
      data = await fs.promises.readFile(this.filename, "utf-8");
    } catch (e) {
      if (e.code === "ENOENT") {
        return null;
      }
      throw e;
    }
    return data;
  }
  write(str) {
    return this.writer.write(str);
  }
}
module.exports = { TextFile };

// kode dalam docker

// const fs = require('fs');

// class TextFile {
//     constructor(filename) {
//         this.filename = filename;
//         this.writer = null;
//     }

//     async init() {
//         const { Writer } = await import('steno');
//         this.writer = new Writer(this.filename);
//     }

//     async read() {
//         let data;
//         try {
//             data = await fs.promises.readFile(this.filename, 'utf-8');
//         } catch (e) {
//             if (e.code === 'ENOENT') {
//                 return null;
//             }
//             throw e;
//         }
//         return data;
//     }

//     async write(str) {
//         if (!this.writer) {
//             await this.init();
//         }
//         return this.writer.write(str);
//     }
// }

// module.exports = { TextFile };
