'use strict';

const CommonController = require('./common');
const moment = require('moment');

class LogController extends CommonController {
  /**
   * 获取应用请求日志
   */
  async request_log() {
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

    const conditions = { app_id: app_info._id };
    switch (inputs.date_type) {
      case 'today':
        conditions.created = { $gte: new Date(moment().format('YYYY-MM-DD 00:00:00')), $lt: new Date(moment().format('YYYY-MM-DD 23:59:59')) };
        break;
      case 'yesterday':
        conditions.created = { $gte: new Date(moment().subtract(1, 'days').format('YYYY-MM-DD 00:00:00')), $lt: new Date(moment().subtract(1, 'days').format('YYYY-MM-DD 23:59:59')) };
        break;
      case '7days':
        conditions.created = { $gte: new Date(moment().subtract(7, 'days').format('YYYY-MM-DD 00:00:00')), $lt: new Date(moment().format('YYYY-MM-DD 23:59:59')) };
        break;
      case '30days':
        conditions.created = { $gte: new Date(moment().subtract(30, 'days').format('YYYY-MM-DD 00:00:00')), $lt: new Date(moment().format('YYYY-MM-DD 23:59:59')) };
        break;
      default:
        conditions.created = { $gte: new Date(moment().format('YYYY-MM-DD 00:00:00')), $lt: new Date(moment().format('YYYY-MM-DD 23:59:59')) };
        break;
    }
    if (inputs.api_id) {
      conditions.api_id = inputs.api_id !== 'undefined' ? inputs.api_id : { $type: 10 };
    }
    /* if (inputs.kw && inputs.kw.trim()) {
      conditions.$or = [{ params: { $regex: inputs.kw.trim(), $options: 'i' } }, { response: { $regex: inputs.kw.trim(), $options: 'i' } }];
    } */
    if (inputs.method) {
      conditions.method = inputs.method;
    }
    if (inputs.result !== undefined) {
      conditions.result = inputs.result;
    }

    let page = inputs.page || 1;
    let per_page = inputs.per_page || 10;
    if (page <= 0) page = 1;
    if (per_page <= 0 || per_page > 100) per_page = 100;

    const res = await this.ctx.service.interfaceRequestLog.getList(conditions, 'app_slug api_id uri ip method params response result created -_id', page, per_page);

    this.success(res);
  }
}

module.exports = LogController;
