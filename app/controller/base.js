'use strict';

const { Controller } = require('egg');

class BaseController extends Controller {

  success(data = undefined, message = 'Success') {
    const response = {
      code: 200,
      message,
      data,
    };

    this.ctx.body = response;
  }

  failed(message = 'Failed', code = 1000) {
    const response = {
      code,
      message,
    };

    this.ctx.body = response;
  }

  notFound(msg) {
    msg = msg || 'not found';
    this.ctx.throw(404, msg);
  }
}

module.exports = BaseController;
