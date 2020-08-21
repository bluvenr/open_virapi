'use strict';

const _G = Symbol('Context#_g');

module.exports = {
  get _g() {
    return this[_G];
  },
  set _g(data) {
    this[_G] = data;
  },
};
