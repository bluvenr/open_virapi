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

  /**
   * 导出应用接口文档
   */
  async export() {
    if (!this.ctx.query.slug) {
      await this.failed('必要参数缺失');
      return;
    }

    await this.ctx.service.application.exportMockdownDoc(this.ctx.query.slug, this.user);
  }
}

module.exports = CommonController;
