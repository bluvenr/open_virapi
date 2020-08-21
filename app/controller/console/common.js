'use strict';

const fs = require('fs');
const BaseController = require('../base');

class CommonController extends BaseController {
  get user() {
    return {
      id: this.ctx._g.userInfo._id,
      vir_uid: this.ctx._g.userInfo.vir_uid,
    };
  }

  set user(data) {
    this.user = data;
  }

  async index() {
    this.ctx.response.type = 'html';
    this.ctx.body = fs.readFileSync(this.app.baseDir + '/app/public/console/index.html');
  }
}

module.exports = CommonController;
