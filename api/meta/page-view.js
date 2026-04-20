const { handleMetaEvent } = require("./_shared.js");

module.exports = function handler(req, res) {
  handleMetaEvent(req, res, "PageView");
};
