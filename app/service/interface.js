'use strict';

/**
 * Api接口模型相关服务
 */

const Service = require('egg').Service;
const moment = require('moment');
const Mock = require('mockjs');

class InterfaceService extends Service {

  constructor(ctx) {
    super(ctx);

    // 单应用最多接口数
    this.maxApiCount = 30;

    this.validateRules = {
      app_id: { type: 'string' },
      app_slug: { type: 'string', required: false, allowEmpty: false },
      uid: { type: 'string', required: false, allowEmpty: false },
      creator: { type: 'string', required: false, allowEmpty: false },
      vir_uid: { type: 'string', required: false, allowEmpty: false },
      name: { type: 'string', min: 2, max: 36 },
      uri: { type: 'string', max: 100, trim: true, format: /^(([\w-.]+)|(\{[a-zA-Z_][a-zA-Z0-9_]*(\?)?}))(\/[\w-.]*(([\w-.]+)|(\{[a-zA-Z_][a-zA-Z0-9_]*(\?)?})))*$/ },
      method: { type: 'enum', values: ['GET', 'POST', 'PUT', 'DELETE'] },
      response_rules: { type: 'object', required: false, default: null },
      describe: { type: 'string', required: false, allowEmpty: true, max: 200, default: '' },
    };
  }

  /**
   * 根据条件获取其对应列表
   * @param {json} conditions 筛选条件
   * @param {[String]} projection 要获取的字段
   * @param {Number} skip 要跳过的数量
   * @param {Number} limit 要查询数量
   * @param {json} sort 排序条件
   */
  async getList(conditions, projection = null, skip = 0, limit = 20, sort = { _id: -1 }) {
    return await this.ctx.model.Interface.find(conditions, projection, { skip, limit, sort });
  }
  async getProcessList(conditions, projection = null, skip = 0, limit = 20, sort = { _id: -1 }) {
    const list = await this.ctx.model.Interface.find(conditions, projection, { skip, limit, sort });

    return list.map(o => {
      o = o.toJSON({ getters: true });
      o.succeed_response = Mock.mock(o.response_rules);
      return o;
    });
  }

  /**
   * 根据id获取对应详情
   * @param {ObjectId} id id
   * @param {String} projection 要返回的字段
   */
  async getInfo(id, projection = null) {
    return await this.ctx.model.Interface.findById(id, projection);
  }

  /**
   * 根据条件获取对应详情
   * @param {JSON} conditions 筛选条件
   * @param {String} projection 要返回的字段
   */
  async getInfoByConditions(conditions, projection = null) {
    return await this.ctx.model.Interface.findOne(conditions, projection);
  }

  /**
   * 获取指定应用指定请求类型所有接口
   * @param {String} app_id 应用id
   * @param {String} method 请求类型
   * @param {String} uri 请求URL
   */
  async getApiByAppIdAndMethod(app_id, method, uri) {
    return await this.ctx.model.Interface.findOne({
      app_id,
      method,
      uri,
    }, null, { sort: { _id: -1 } });
  }

  /**
   * 获取接口详情
   * @param {String} app_id 应用id
   * @param {String} method 请求类型
   * @param {String} uri 接口路由URI
   */
  async getApiData(app_id, method, uri) {
    const api = await this.ctx.model.Interface.findOne({
      app_id,
      method,
      uri,
    });

    return api || null;
  }

  /**
   * 新增
   * @param {string} uid 用户id
   * @param {json} data 数据
   */
  async insertByUid(uid, data) {
    const app_info = await this.ctx.model.Application.findOne({ _id: data.app_id, uid }, '_id api_count status slug vir_uid');
    if (!app_info || app_info.status !== 1) this.ctx.throw(400, '无权限操作或接口所属应用状态异常');
    if (app_info.api_count >= this.maxApiCount) this.ctx.throw(400, '单应用最多创建' + this.maxApiCount + '个接口');

    // 验证同一应用下接口名是否有重复 && 验证同一应用相同请求类型下uri是否有重复
    const exist_api = await this.ctx.model.Interface.findOne({
      app_id: data.app_id,
      $or: [
        { name: data.name },
        {
          method: data.method,
          uri: data.uri,
        },
      ],
    }, '_id name method uri');
    if (exist_api) {
      if (exist_api.name === data.name) {
        this.ctx.throw(400, '当前应用下接口名已存在');
      } else {
        this.ctx.throw(400, '当前应用下接口uri已存在');
      }
    }

    data.app_slug = app_info.slug;
    data.vir_uid = app_info.vir_uid;
    data.uid = uid;
    data.creator = uid;

    const api = this.ctx.model.Interface(data);
    await api.save();

    // 更新对应应用下的接口数
    this.ctx.service.application.increaseApiCountByAppId(data.app_id);

    return api;
  }

  /**
   * 编辑
   * @param {string} api_id 接口id
   * @param {string} uid 用户id
   * @param {json} data 数据
   */
  async updateByIdAndUid(api_id, uid, data) {
    const interfaceModel = this.ctx.model.Interface;
    const api_info = await interfaceModel.findOne({ _id: api_id, uid }, '_id app_id');
    if (!api_info) this.ctx.throw(400, '接口不存在或无权限');

    // 验证同一应用下接口名是否有重复 && 验证同一应用相同请求类型下uri是否有重复
    const exist_api = await interfaceModel.findOne({
      app_id: api_info.app_id,
      $or: [
        { name: data.name },
        {
          method: data.method,
          uri: data.uri,
        },
      ],
      _id: { $ne: api_id },
    });
    if (exist_api) {
      if (exist_api.name === data.name) {
        this.ctx.throw(400, '该接口名已被占用，请重新设置');
      } else {
        this.ctx.throw(400, '该uri已被占用，请重新设置');
      }
    }

    delete data._id;
    delete data.app_id;
    delete data.app_slug;
    delete data.vir_uid;
    delete data.uid;
    delete data.creator;

    const res = await interfaceModel.updateOne({ _id: api_id }, data);
    res.succeed_response = Mock.mock(data.response_rules || null);

    return res;
  }

  /**
   * 清空指定应用所有api
   * @param {string} app_slug 应用slug
   * @param {string} uid 用户id
   */
  async emptyByAppSlugAndUid(app_slug, uid) {
    const result = await this.ctx.model.Interface.deleteMany({ app_slug, uid });
    if (result.ok !== 1) this.ctx.throw(400, '清空失败');

    await this.ctx.model.Application.updateOne({ slug: app_slug, uid }, { api_count: 0 });
  }

  /**
   * 拷贝接口到指定应用
   * @param {string} target_app_slug 目标应用slug
   * @param {array} api_ids 接口id数组
   * @param {string} uid 用户id
   */
  async copyApi(target_app_slug, api_ids, uid) {
    const app_info = await this.ctx.model.Application.findOne({ slug: target_app_slug, uid }, '_id uid api_count slug');
    if (!app_info) this.ctx.throw(400, '目标应用不存在或无权限');
    if (app_info.api_count >= this.maxApiCount) this.ctx.throw(400, '目标应用所建接口已达到最大数量');

    const api_list = await this.ctx.model.Interface.find({ _id: { $in: api_ids }, uid }, { _id: 0, created: 0, updated: 0 });
    const now_date = moment().format('YYYYMMDDHHmmss');
    const api_data = [];
    api_list.forEach(o => {
      o.name = o.name + '_' + now_date;
      o.uri = o.uri + '/' + o.app_slug + '_' + now_date;
      o.app_id = app_info._id;
      o.app_slug = app_info.slug;

      api_data.push(o);
    });

    if (api_data.length > 0) {
      await this.ctx.service.application.decreaseApiCountByAppId(app_info._id, api_data.length);
      await this.ctx.model.Interface.insertMany(api_data);
    }
  }

  /**
   * 转移接口
   * @param {string} target_app_slug 目标应用slug
   * @param {array} api_ids 接口id数组
   * @param {string} uid 用户id
   */
  async moveApi(target_app_slug, api_ids, uid) {
    const app_info = await this.ctx.model.Application.findOne({ slug: target_app_slug, uid }, '_id uid api_count slug');
    if (!app_info) this.ctx.throw(400, '目标应用不存在或无权限');
    if (app_info.api_count >= this.maxApiCount) this.ctx.throw(400, '目标应用所建接口已达到最大数量');

    const interfaceModel = this.ctx.model.Interface;
    const api_list = await interfaceModel.find({ _id: { $in: api_ids }, uid }, { _id: 1, app_slug: 1, name: 1, uri: 1 });
    const now_date = moment().format('YYYYMMDDHHmmss');
    for (let i = 0; i < api_list.length; i++) {
      const o = api_list[i];
      const api_data = {
        app_id: app_info._id,
        app_slug: app_info.slug,
        name: o.name + '_' + o.app_slug + '_' + now_date,
        uri: o.uri + '/' + o.app_slug + '_' + now_date,
      };

      await interfaceModel.updateOne({ _id: o._id }, api_data);
    }

    await this.ctx.service.application.increaseApiCountByAppId(app_info._id, api_list.length);
  }

  /**
   * 删除
   * @param {string} api_id 接口id
   * @param {string} uid 用户id
   */
  async deleteByIdAndUid(api_id, uid) {
    const api_info = await this.ctx.model.Interface.findOneAndDelete({ _id: api_id, uid }, { projection: { _id: 1, app_id: 1 } });

    if (!api_info) this.ctx.throw(400, '接口不存在或无权限');

    this.ctx.service.application.decreaseApiCountByAppId(api_info.app_id);
  }

  /**
   * 获取请求成功响应数据体
   * @param {JSON} res_tpl 请求响应模板
   * @param {JSON} data 返回数据
   */
  async getSucceedResponse(res_tpl, data) {
    const res_data = {};
    res_data[res_tpl.code_name] = res_tpl.succeed_code_value;
    if (res_tpl.message_name) {
      res_data[res_tpl.message_name] = res_tpl.succeed_message_value;
    }
    if (res_tpl.data_name && data !== null) {
      res_data[res_tpl.data_name] = data;
    }
    return res_data;
  }

  /**
   * 获取请求失败响应数据体
   * @param {JSON} res_tpl 请求响应模板
   * @param {String} message 错误信息
   */
  async getFailedResponse(res_tpl, message) {
    const res_data = {};
    res_data[res_tpl.code_name] = res_tpl.failed_code_value;
    if (res_tpl.message_name) {
      res_data[res_tpl.message_name] = message ? message : res_tpl.failed_message_value;
    }
    return res_data;
  }

  /**
   * 响应请求
   * @param {JSON} app 对app模型
   * @param {JSON} api 对应api模型
   */
  async processResponse(app, api) {
    // 响应请求返回数据
    const data = Mock.mock(api.response_rules);

    return await this.getSucceedResponse(app.response_template, data);
  }
}

module.exports = InterfaceService;
