'use strict';

/**
 * 用户相关服务
 */

const moment = require('moment');
const Service = require('egg').Service;
const fs = require('mz/fs');

class UserService extends Service {
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

    const fileRelativePath = '/' + parseInt(moment().format('YYYYMM')).toString(16) + '/';
    const res = this.ctx.helper.mkdirsSync(this.config.imgDir + fileRelativePath);
    if (!res) {
      this.ctx.throw(400, '目录创建失败');
    }

    const dataBuffer = new Buffer(base64.replace(baseExp, ''), 'base64');
    const fileName = parseInt(Date.now() + '' + Math.random() * 1000000).toString(16) + '.png';
    fs.writeFileSync(this.config.imgDir + fileRelativePath + fileName, dataBuffer);
    return fileRelativePath + fileName;
  }

  /**
   * 根据条件获取其对应列表
   * @param {json} conditions 筛选条件
   * @param {[String]} projection 要获取的字段
   * @param {Number} skip 要跳过的数量
   * @param {Number} limit 要查询数量
   */
  async getListByUid(conditions, projection = null, skip = 0, limit = 20) {
    return await this.ctx.model.User.find(conditions, projection, { skip, limit });
  }

  /**
   * 根据条件获取其对应列表
   * @param {json} querys 筛选条件
   * @param {[String]} projection 要获取的字段
   * @param {Number} page 第几页
   * @param {Number} page_size 每页数量
   * @param {json} sort 排序
   */
  async getPagination(querys, projection = null, page = 1, page_size = 20, sort = { _id: -1 }) {
    const conditions = {};

    if (querys.kw && querys.kw.trim()) {
      const reg = new RegExp(querys.kw.trim(), 'i');
      conditions.$or = [
        { nickname: { $regex: reg } },
        { email: { $regex: reg } },
        { vir_uid: { $regex: reg } },
        // { nickname: { '$regex': querys.kw.trim(), $options: '$i' } }
      ];
    }

    if (querys.login_dates) {
      const dates = querys.login_dates.split(',');
      conditions.login_date = { $gte: dates[0], $lte: dates[1] };
    }

    if (querys.register_dates) {
      const dates = querys.register_dates.split(',');
      conditions.created = { $gte: dates[0], $lte: dates[1] };
    }

    if (querys.uid_status) {
      conditions.vir_uid_updated = querys.uid_status == 1 ? { $ne: null } : { $eq: null };
    }

    if (querys.app_min_count !== undefined && querys.app_min_count !== null) {
      if (conditions.apps_count) {
        conditions.apps_count.$gte = querys.app_min_count;
      } else {
        conditions.apps_count = { $gte: querys.app_min_count };
      }
    }

    if (querys.app_max_count !== undefined && querys.app_max_count !== null) {
      if (conditions.apps_count) {
        conditions.apps_count.$lte = querys.app_max_count;
      } else {
        conditions.apps_count = { $lte: querys.app_max_count };
      }
    }

    if (querys.status) {
      conditions.status = querys.status;
    }

    const total = await this.ctx.model.User.count(conditions);
    let list = [];
    if (total) {
      list = (await this.ctx.model.User.find(conditions, projection, { skip: (page - 1) * page_size, limit: parseInt(page_size), sort })).map(o => o.toJSON({ getters: true, virtuals: false }));
    }

    return {
      total,
      list,
    };
  }

  /**
   * 根据id获取对应详情
   * @param {ObjectId} id id
   * @param {String} projection 要返回的字段
   */
  async getInfo(id, projection = null) {
    return await this.ctx.model.User.findById(id, projection);
  }

  /**
   * 根据条件获取对应详情
   * @param {json} conditions 筛选条件
   * @param {String} projection 要返回的字段
   */
  async getInfoByConditions(conditions, projection = null) {
    return await this.ctx.model.User.findOne(conditions, projection);
  }

  /**
   * 用户登录(邮箱&密码)
   * @param {String} email 邮箱
   * @param {String} password 登录密码
   */
  async loginByEmailAndPwd(email, password) {
    const user = await this.ctx.model.User.findOne({ email });
    if (!user) {
      this.ctx.throw(400, '该邮箱未注册，请重新输入登录');
    }

    // 加密登录密码
    const verifyPsw = await this.ctx.compare(password, user.password);
    if (!verifyPsw) {
      this.ctx.throw(400, '登录密码错误，请重新输入');
    }

    user.login_date = Date.now();
    await user.save();

    return user;
  }

  _generateVirUid() {
    return 'vir_' + parseInt(moment().format('ssmmSSShhYYYYDDDD')).toString(18);
  }

  /**
   * 编辑
   * @param {string} uid 用户id
   * @param {json} doc 要想修改的属性
   */
  async updateByUid(uid, doc) {
    // 检测vir_uid、email等字段值合法性(必须唯一不重复等)
    const user_info = await this.ctx.model.User.findOne({ _id: uid }, '_id vir_uid email');
    if (!user_info) this.ctx.throw(400, '更新失败，服务错误！');
    if (user_info.vir_uid_updated) delete doc.vir_uid;
    if (doc.email && doc.email !== user_info.email) {
      const exist = await this.ctx.model.User.findOne({
        email: doc.email,
      });
      if (exist) this.ctx.throw(400, '该Email已被占用');
    }
    if (doc.vir_uid) {
      const exist = await this.ctx.model.User.findOne({
        vir_uid: doc.vir_uid,
      });
      if (exist) this.ctx.throw(400, '唯一ID已被占用');
    }

    if (doc.password) {
      doc.password = await this.ctx.genHash(doc.password);
    }

    if (doc.vir_uid) {
      doc.vir_uid_updated = Date.now();
    }

    if (doc.avatar) {
      doc.avatar = this._base64ToFile(doc.avatar);
    }

    const result = await this.ctx.model.User.updateOne({ _id: uid }, doc);

    // 更新该用户下的应用及接口vir_uid值
    if (doc.vir_uid) {
      await this.ctx.model.Application.updateMany({ uid }, { vir_uid: doc.vir_uid });
      await this.ctx.model.Interface.updateMany({ uid }, { vir_uid: doc.vir_uid });
    }

    return result;
  }

  /**
   * 退出登录
   */
  async logout() {
    this.ctx.session = null;
    this.ctx.cookies.set('Vir_SESSION', null);
    this.ctx.cookies.set('v_token', null);
  }

  /**
   * 删除
   * @param {json} conditions 筛选条件
   */
  async delete(conditions) {
    const result = await this.ctx.model.User.updateOne(conditions, { status: -1 });
    return result;
  }

  /**
   * 更新应用数
   * @param {string} uid 用户id
   */
  async increaseAppCountByUid(uid) {
    await this.ctx.model.User.updateOne({ _id: uid }, { $inc: { apps_count: 1 } });
  }
  async decreaseAppCountByUid(uid) {
    await this.ctx.model.User.updateOne({ _id: uid }, { $inc: { apps_count: -1 } });
  }
}

module.exports = UserService;
