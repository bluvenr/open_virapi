'use strict';

/**
 * 应用模型相关服务
 */

const Service = require('egg').Service;
const fs = require('mz/fs');

class ApplicationService extends Service {

  constructor(ctx) {
    super(ctx);

    // 单账号用户最多可创建应用数
    this.maxAppCount = 20;

    this.rules = {
      uid: { type: 'object', required: true, allowEmpty: false },
      vir_uid: { type: 'string', required: true, allowEmpty: false },
      number: { type: 'string', required: true, allowEmpty: false },
      app_key: { type: 'string', required: true, allowEmpty: false },
      name: { type: 'string', required: true, allowEmpty: false, trim: true, min: 2, max: 20 },
      slug: { type: 'string', required: true, allowEmpty: false, min: 2, max: 20, trim: true, format: /^[\w\-\.]{4,20}$/ },
      verify_rule: {
        type: 'enum',
        required: false,
        values: [
          'param', 'header', 'compatible',
        ],
      },
      describe: { type: 'string', required: false, allowEmpty: true, max: 200 },
      response_template: {
        type: 'object',
        required: false,
        rule: {
          code_name: { type: 'string', required: true },
          succeed_code_value: {
            type: 'string',
            convertType: 'string',
            required: true,
          },
          failed_code_value: {
            type: 'string',
            convertType: 'string',
            required: true,
          },
          data_name: { type: 'string', required: true },
          message_name: { type: 'string', required: true },
          succeed_message_value: { type: 'string', required: true },
          failed_message_value: { type: 'string', required: true },
        },
      },
    };

    this.updateRules = {
      name: { type: 'string', required: false, allowEmpty: false, trim: true, min: 2, max: 20 },
      verify_rule: {
        type: 'enum',
        required: false,
        values: [
          'param', 'header', 'compatible',
        ],
      },
      describe: { type: 'string', required: false, allowEmpty: true, max: 200 },
      response_template: {
        type: 'object',
        required: false,
        rule: {
          code_name: { type: 'string', required: true },
          succeed_code_value: {
            type: 'string',
            convertType: 'string',
            required: true,
          },
          failed_code_value: {
            type: 'string',
            convertType: 'string',
            required: true,
          },
          data_name: { type: 'string', required: true },
          message_name: { type: 'string', required: true },
          succeed_message_value: { type: 'string', required: true },
          failed_message_value: { type: 'string', required: true },
        },
      },
    };
  }

  /**
   * Base64转文件
   * @param {String} base64 Base64图片字符串
   */
  _base64ToFile(base64) {
    if (/^\//.test(base64)) {
      return base64;
    }

    const baseExp = /^data:image\/\w+;base64,/;
    if (!baseExp.test(base64)) {
      this.ctx.throw(400, '非法base64资源');
    }

    const fileRelativePath = '/' + parseInt(this.ctx.helper.moment().format('YYYYMM')).toString(16) + '/';
    const res = this.ctx.helper.mkdirsSync(this.config.imgDir + fileRelativePath);
    if (!res) {
      this.ctx.throw(400, '目录创建失败');
    }

    const dataBuffer = new Buffer(base64.replace(baseExp, ''), 'base64');
    const fileName = parseInt(Date.now() + '' + Math.random() * 1000000).toString(18) + '.png';
    fs.writeFileSync(this.config.imgDir + fileRelativePath + fileName, dataBuffer);
    return fileRelativePath + fileName;
  }

  /**
   * 生成应用唯一编号
   */
  async createNumber() {
    return await this.ctx.helper.moment().format('YYYYMMDDHHmmss') + parseInt(Math.random() * 10000, 10);
  }

  /**
   * 生成app key
   * @param {String} flag 用于生成app key 的标识
   */
  async createAppKey(flag = null) {
    return await this.ctx.genHash(flag || 'virapi');
  }

  /**
   * 根据用户id获取其对应应用列表
   * @param {ObjectId} uid 用户id
   * @param {[String]} projection 要获取的字段
   * @param {Number} skip 要跳过的数量
   * @param {Number} limit 要查询数量
   * @param {JSON} sort 排序条件
   */
  async getListByUid(uid, projection = null, skip = 0, limit = 20, sort = { _id: -1 }) {
    return await this.ctx.model.Application.find({ uid }, projection, { skip, limit, sort });
  }

  /**
   * 根据应用id获取对应应用详情
   * @param {ObjectId} app_id 应用id
   * @param {String} projection 要返回的字段
   */
  async getInfo(app_id, projection = null) {
    return await this.ctx.model.Application.findById(app_id, projection);
  }

  /**
   * 根据条件获取对应详情
   * @param {JSON} conditions 筛选条件
   * @param {String} projection 要返回的字段
   */
  async getInfoByConditions(conditions, projection = null) {
    return await this.ctx.model.Application.findOne(conditions, projection);
  }

  /**
   * 新增应用信息
   * @param {json} data 应用数据
   */
  async insert(data) {
    // 验证同一用户创建的应用slug、name字段必须唯一
    const exist = await this.ctx.model.Application.findOne({
      uid: data.uid,
      $or: [{ name: data.name.trim() }, { slug: data.slug.trim() }],
    }, '_id');
    if (exist) {
      this.ctx.throw(400, '应用名或应用网址标识已在您其他应用中占用，请重新设置');
    }

    // 判断该用户创建的应用是否已超过设置
    const app_count = await this.ctx.model.Application.find({ uid: data.uid }).countDocuments();
    if (app_count >= this.maxAppCount) {
      this.ctx.throw(400, '同一账号最多创建' + this.maxAppCount + '个应用');
    }

    if (data.icon) {
      data.icon = this._base64ToFile(data.icon);
    }

    const application = this.ctx.model.Application(data);
    await application.save();

    // 更新对应用户的应用数
    this.ctx.service.user.increaseAppCountByUid(data.uid);

    return application;
  }

  /**
   * 编辑应用信息
   * @param {string} uid 用户id
   * @param {string} app_id 应用id
   * @param {json} data 数据
   */
  async updateByUidAndAppid(uid, app_id, data) {
    const app_info = await this.ctx.model.Application.findOne({ _id: app_id, uid }, '_id name');
    if (!app_info) this.ctx.throw(400, '应用不存在或无权限');

    // 验证同一用户创建的应用name字段必须唯一
    if (data.name && data.name !== app_info.name) {
      const exist = await this.ctx.model.Application.findOne({
        uid,
        name: data.name,
        _id: { $ne: app_id },
      }, '_id');
      if (exist) this.ctx.throw(400, '应用名已在您的应用中存在，请重新设置');
    }

    if (data.icon) {
      data.icon = this._base64ToFile(data.icon);
    }

    delete data._id;
    delete data.api_count;
    delete data.status;
    delete data.app_key;
    delete data.slug;
    delete data.uid;
    delete data.vir_uid;
    delete data.number;

    return await this.ctx.model.Application.updateOne({ _id: app_id }, data);
  }

  /**
   * 更新应用api数
   * @param {string} app_id 应用id
   * @param {integer} count 数量
   */
  async increaseApiCountByAppId(app_id, count = 1) {
    await this.ctx.model.Application.updateOne({ _id: app_id }, { $inc: { api_count: count } });
  }
  async decreaseApiCountByAppId(app_id, count = 1) {
    await this.ctx.model.Application.updateOne({ _id: app_id }, { $inc: { api_count: -count } });
  }

  /**
   * 更新应用appkey
   * @param {json} conditions 筛选条件
   */
  async changeAppKey(conditions) {
    const app_info = await this.ctx.model.Application.findOne(conditions, '_id uid slug');
    if (!app_info) this.ctx.throw(400, '应用不存在或无权限');

    const app_key = await this.createAppKey(app_info.uid + '_' + app_info.slug);
    const result = await this.ctx.model.Application.updateOne({ _id: app_info._id }, { app_key });
    if (result.ok !== 1) this.ctx.throw(400, 'appkey更换失败！');

    return app_key;
  }

  /**
   * 删除应用信息
   * @param {string} app_slug 应用slug
   * @param {string} uid 用户id
   */
  async deleteBySlug(app_slug, uid) {
    const app_info = await this.ctx.model.Application.findOneAndDelete({ slug: app_slug, uid }, { projection: { _id: 1, uid: 1 } });

    if (!app_info) this.ctx.throw(400, '应用不存在或无权限');

    // 更新对应用户的应用数
    this.ctx.service.user.decreaseAppCountByUid(uid);
  }

  /**
   * 获取请求成功响应数据体
   * @param {JSON} res_tpl 请求响应模板
   * @param {JSON} data 返回数据
   */
  async getSucceedResponse(res_tpl, data) {
    const res_data = [];
    res_data[res_tpl.code_name] = res_tpl.succeed_code_value;
    if (res_tpl.message_name) {
      res_data[res_tpl.message_name] = res_tpl.succeed_message_value;
    }
    if (res_tpl.data_name) {
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
    const res_data = [];
    res_data[res_tpl.code_name] = res_tpl.failed_code_value;
    if (res_tpl.message_name) {
      res_data[res_tpl.message_name] = message ? message : res_tpl.failed_message_value;
    }
    return res_data;
  }

  /**
   * 拷贝应用
   * @param {string} target_app_slug 目标应用slug
   * @param {string} name 应用名
   * @param {string} slug 应用slug
   * @param {string} describe 应用描述
   * @param {string} uid 用户id
   */
  async copyApp(target_app_slug, name, slug, describe = '', uid) {
    let app_info = await this.ctx.model.Application.findOne({ slug: target_app_slug, uid }, { created: 0, updated: 0 });
    if (!app_info) this.ctx.throw(400, '目标应用不存在或无权限');

    // 验证同一用户创建的应用slug、name字段必须唯一
    const exist = await this.ctx.model.Application.findOne({
      uid,
      $or: [{ name: name.trim() }, { slug: slug.trim() }],
    }, '_id');
    if (exist) this.ctx.throw(400, '应用名或应用网址标识已在您其他应用中占用，请重新设置');

    // 判断该用户创建的应用是否已超过设置
    const app_count = await this.ctx.model.Application.find({ uid }).countDocuments();
    if (app_count >= this.maxAppCount) this.ctx.throw(400, '同一账号最多创建' + this.maxAppCount + '个应用');

    const app_id = app_info._id;
    app_info.number = await this.createNumber();
    app_info.name = name;
    app_info.slug = slug;
    app_info.app_key = await this.createAppKey(slug);
    app_info.describe = describe;
    app_info = app_info.toJSON();
    delete app_info._id;

    const application = this.ctx.model.Application(app_info);
    await application.save();

    const api_list = await this.ctx.model.Interface.find({ app_id, uid }, { _id: 0, created: 0, updated: 0 });
    const api_data = [];
    api_list.forEach(o => {
      o.app_id = application._id;
      o.app_slug = slug;

      api_data.push(o);
    });

    if (api_data.length > 0) {
      await this.ctx.service.user.increaseAppCountByUid(uid);
      await this.ctx.model.Interface.insertMany(api_data);
    }
  }

  /**
   * 创建DEMO应用给新注册用户作为默认案例应用
   * @param {Object} user 用户对象
   */
  async createDemoAppByRegister(user) {
    let app_info = await this.ctx.model.Application.findOne({ slug: 'demo', vir_uid: 'virapi', status: 1 }, { created: 0, updated: 0 });
    if (!app_info) return;

    // 验证同一用户创建的应用slug、name字段必须唯一
    const exist = await this.ctx.model.Application.findOne({
      uid: user._id,
      $or: [{ name: app_info.name }, { slug: app_info.slug }],
    }, '_id');
    if (exist) return;

    const api_list = await this.ctx.model.Interface.find({ app_id: app_info._id, status: 1 }, { _id: 0, created: 0, updated: 0 });

    app_info.uid = user._id;
    app_info.vir_uid = user.vir_uid;
    app_info.api_count = api_list.length;
    app_info.number = await this.createNumber();
    app_info.app_key = await this.createAppKey(app_info.slug);
    app_info = app_info.toJSON();
    delete app_info._id;

    const application = this.ctx.model.Application(app_info);
    await application.save();

    const api_data = [];
    api_list.forEach(o => {
      o.uid = user._id;
      o.vir_uid = user.vir_uid;
      o.app_id = application._id;
      o.app_slug = app_info.slug;

      api_data.push(o);
    });

    if (api_data.length > 0) {
      await this.ctx.service.user.increaseAppCountByUid(user._id);
      await this.ctx.model.Interface.insertMany(api_data);
    }
  }

  /**
   * 导出接口Mockdown文档
   * @param {String} slug 应用slug
   * @param {Object} user 用户对象
   */
  async exportMockdownDoc(slug, user) {
    const app_info = await this.ctx.service.application.getInfoByConditions({ slug, uid: user.id });
    if (!app_info) {
      this.ctx.throw(400, '应用不存在或已删除');
    }

    const export_date = this.ctx.helper.moment().format('YYYYMMDDHHmmss');
    const verify_rule_map = { header: '请求头部Token验证', param: '请求参数Token验证', compatible: '兼容模式' };

    const api_request_uri = this.ctx.header.referer + 'api/';
    let content = `# [${app_info.name}] 接口文档

导出时间: ${export_date}


## 应用基本信息

+ slug: ${app_info.slug}
+ 编号: ${app_info.number}
+ 描述: ${app_info.describe}
+ 创建时间: ${app_info.created}
+ 更新时间: ${app_info.updated}
+ 总接口数: ${app_info.api_count}

+ 应用API网址: \`${api_request_uri + user.vir_uid}/${app_info.slug}\`
+ APP KEY: \`${app_info.app_key}\`
+ 验证方式: ${verify_rule_map[app_info.verify_rule] || '未知'}

+ 请求响应模板结构
    - 请求成功：
    \`\`\` json
    {
        "${app_info.response_template.code_name}": ${/^\d+$/.test(app_info.response_template.succeed_code_value) ? app_info.response_template.succeed_code_value : '"' + app_info.response_template.succeed_code_value + '"'},
        "${app_info.response_template.message_name}": "${app_info.response_template.succeed_message_value}",
        "${app_info.response_template.data_name}": {
            "id": 1,
            "name": "virapi"
        }
    }
    \`\`\`
    - 请求失败：
    \`\`\` json
    {
        "${app_info.response_template.code_name}": ${/^\d+$/.test(app_info.response_template.failed_code_value) ? app_info.response_template.failed_code_value : '"' + app_info.response_template.failed_code_value + '"'},
        "${app_info.response_template.message_name}": "${app_info.response_template.failed_message_value}"
    }
    \`\`\`

------------------------------

## 接口列表`;
    const api_list = await this.ctx.service.interface.getList(
      { uid: user.id, app_slug: app_info.slug },
      [
        'describe',
        'method',
        'name',
        'response_rules',
        'type',
        'uri',
      ], 0, 0
    );

    api_list.forEach((o, i) => {
      content += `
### ${i + 1}. ${o.name}
> ${o.describe || '接口无描述'}

+ **URL:** \`${api_request_uri + user.vir_uid}/${app_info.slug}/${o.uri}\`
+ **请求方式:** \`${o.method}\`
`;

      if (o.response_rules) {
        content += `+ **响应结构(data数据):**
\`\`\` MockJs
${JSON.stringify(o.response_rules, null, 4)}
\`\`\``;
      } else if (!o.response_rules || o.response_rules.length === 0) {
        content += '+ **响应结构(data数据):** 该接口无data数据响应';
      }

      content += `

`;
    });

    this.ctx.attachment(`${app_info.name}-接口文档${export_date}.md`);
    this.ctx.set('Content-Type', 'application/octet-stream');
    this.ctx.body = content;
  }
}

module.exports = ApplicationService;
