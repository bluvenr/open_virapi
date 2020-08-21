'use strict';

const CommonController = require('./common');

class StatisticsController extends CommonController {
  /**
   * 获取应用相关统计数据
   */
  async index() {
    const inputs = this.ctx.query;
    if (!inputs.app_slug) {
      this.failed('请指定要查找的应用');
      return;
    }

    const app_info = await this.ctx.service.application.getInfoByConditions({ slug: inputs.app_slug, uid: this.user.id }, '_id');
    if (!app_info) {
      this.failed('未找到目标应用数据');
      return;
    }

    const res = await this.ctx.service.interfaceRequestLog.getStatistics(app_info._id, inputs.date_scope);

    this.success(res);
  }
}

module.exports = StatisticsController;
