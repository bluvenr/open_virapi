'use strict';

/**
 * 接口请求日志相关服务
 */

const Service = require('egg').Service;
const moment = require('moment');

class InterfaceRequestLogService extends Service {
  /**
   * 根据条件获取其对应列表
   * @param {json} conditions 筛选条件
   * @param {[String]} projection 要获取的字段
   * @param {Number} page 第几页
   * @param {Number} per_page 每页数量
   */
  async getList(conditions, projection = null, page = 1, per_page = 10) {
    const total = await this.ctx.model.InterfaceRequestLog.find(conditions).countDocuments();

    let list = [];
    if (total) {
      list = await this.ctx.model.InterfaceRequestLog.find(conditions, projection, { skip: (page - 1) * per_page, limit: parseInt(per_page), sort: { _id: -1 } });
    }

    /* if (list && list.length > 0) {
      list = list.map(o => o.toJSON({ getters: true, virtuals: false }));
    } */

    return { total, list };
  }

  /**
   * 获取指定条件的统计数据
   * @param {string} app_id 应用id
   * @param {string} date_scope 查找时间范围
   */
  async getStatistics(app_id, date_scope = 'today') {
    const conditions = { app_id };
    let date_section = {};
    switch (date_scope) {
      case 'today':
        date_section = { $dateToString: { format: '%H', date: '$created', timezone: '+08:00' } };
        conditions.created = { $gte: new Date(moment().format('YYYY-MM-DD 00:00:00')), $lt: new Date(moment().format('YYYY-MM-DD 23:59:59')) };
        break;
      case 'yesterday':
        date_section = { $dateToString: { format: '%H', date: '$created', timezone: '+08:00' } };
        conditions.created = { $gte: new Date(moment().subtract(1, 'days').format('YYYY-MM-DD 00:00:00')), $lt: new Date(moment().subtract(1, 'days').format('YYYY-MM-DD 23:59:59')) };
        break;
      case '7days':
        date_section = { $dateToString: { format: '%Y-%m-%d', date: '$created', timezone: '+08:00' } };
        conditions.created = { $gte: new Date(moment().subtract(7, 'days').format('YYYY-MM-DD 00:00:00')), $lt: new Date(moment().format('YYYY-MM-DD 23:59:59')) };
        break;
      case '30days':
        date_section = { $dateToString: { format: '%Y-%m-%d', date: '$created', timezone: '+08:00' } };
        conditions.created = { $gte: new Date(moment().subtract(30, 'days').format('YYYY-MM-DD 00:00:00')), $lt: new Date(moment().format('YYYY-MM-DD 23:59:59')) };
        break;
      default:
        date_section = { $dateToString: { format: '%H', date: '$created', timezone: '+08:00' } };
        conditions.created = { $gte: new Date(moment().format('YYYY-MM-DD 00:00:00')), $lt: new Date(moment().format('YYYY-MM-DD 23:59:59')) };
        break;
    }

    // 请求频率情况
    const request_list = await this.ctx.model.InterfaceRequestLog.aggregate([
      {
        $match: conditions,
      },
      {
        $project: {
          date: date_section,
        },
      },
      {
        $group: {
          _id: '$date',
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // 请求数据正确(合法)率
    const result_map = await this.ctx.model.InterfaceRequestLog.aggregate([
      {
        $match: conditions,
      },
      {
        $group: {
          _id: '$result',
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // 请求路由排行榜
    const uri_rank = await this.ctx.model.InterfaceRequestLog.aggregate([
      {
        $match: conditions,
      },
      {
        $group: {
          _id: '$uri',
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $limit: 10,
      },
    ]);

    // 请求来源IP排行榜
    const ip_rank = await this.ctx.model.InterfaceRequestLog.aggregate([
      {
        $match: conditions,
      },
      {
        $group: {
          _id: '$ip',
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $limit: 10,
      },
    ]);

    return {
      request_list,
      result_map,
      uri_rank,
      ip_rank,
    };
  }

  /**
   * 根据id获取对应详情
   * @param {ObjectId} id id
   * @param {String} projection 要返回的字段
   */
  async getInfo(id, projection = null) {
    return await this.ctx.model.InterfaceRequestLog.findById(id, projection);
  }

  /**
   * 新增
   * @param {json} data 数据
   */
  insert(data) {
    this.ctx.model.InterfaceRequestLog(data).save();
  }

  /**
   * 编辑
   * @param {json} conditions 筛选条件
   * @param {json} doc 要想修改的属性
   */
  async update(conditions, doc) {
    const result = await this.ctx.model.InterfaceRequestLog.updateOne(conditions, doc);
    return result;
  }

  /**
   * 删除
   * @param {json} conditions 筛选条件
   */
  async delete(conditions) {
    const result = await this.ctx.model.InterfaceRequestLog.deleteOne(conditions);
    return result;
  }
}

module.exports = InterfaceRequestLogService;
