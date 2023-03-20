import fse from "fs-extra";
import path from "path";
import formidable from "formidable";
import gm from "gm";
import logger from "../../utils/logger";
var XLSX = require("xlsx");

const config = rootRequire("config");
const AESCrypt = rootRequire("utils/aes");

gm.subClass({
  imageMagick: true,
});

const _self = {
  getFormFields: (req, callback) => {
    var form = new formidable.IncomingForm();

    form.multiples = true;

    form.uploadDir = path.join(rootPath, "/uploads/tmp");

    fse.mkdirs(form.uploadDir, function (err) {
      if (err) {
        return callback(err, null, null);
      }
      form.on("error", function (err) {
        logger.error("An error has occured: \n" + err);
      });
      form.on("end", function () {
      });
      form.parse(req, (err, fields, files) => {
        if (req.sourceOfRequest === "web") {
          return callback(err, fields, files);
        }

        if (!config.cryptoEnable) {
          return callback(err, fields, files);
        }

        if (!fields || (fields && !fields.encoded)) {
          return callback(true);
        }

        try {
          var dec = AESCrypt.decrypt(fields.encoded);
          fields = JSON.parse(dec);
        } catch (err) {
          return callback(true);
        }

        callback(err, fields, files);
      });
    });
  },

  upload: (options, callback) => {
    fse.mkdirs(path.dirname(options.dst), function (err) {
      if (err) {
        return callback(err);
      }
      if (options.type == "thumb") {
        gm(options.src)
          .resize(options.width || 240, options.height || 240)
          .noProfile()
          .write(options.dst, callback);
      } else {
        gm(options.src).write(options.dst, callback);
      }
    });
  },

  uploadFile: (options, callback) => {
    fse.mkdirs(path.dirname(options.dst), (err) => {
      if (err) {
        return callback(err);
      }

      fse.copy(options.src, options.dst, (err) => {
        if (err) return callback(err);
        callback();
      });
    });
  },

  remove: (options, callback) => {
    fse.remove(options.filepath, callback);
  },
};

module.exports = _self;
