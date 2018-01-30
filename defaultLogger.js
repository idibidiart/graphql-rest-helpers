"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/* eslint-disable no-console */
exports.default = {
  info: function info(msg) {
    return console.info(msg);
  },
  warn: function warn(msg) {
    return console.warn(msg);
  },
  error: function error(msg) {
    return console.error(msg);
  }
};