'use strict';

const BaseController = require('../base');

class OauthController extends BaseController {
  /**
   * 登录
   */
  async login() {
    const account = this.ctx.request.body.account;
    const password = this.ctx.request.body.password;
    if (!account || !password) {
      this.failed('必要参数缺失');
      return;
    }

    let user_info = await this.ctx.service.user.loginByEmailAndPwd(account, password);
    if (!user_info) {
      this.failed('对应登录信息不存在，请先创建登录！');
      return;
    }

    user_info = user_info.toJSON({ getters: true, virtuals: false });

    // 存储用户信息到session
    this.ctx.session.login_time = Date.now();
    this.ctx.session.user_id = user_info._id.toString();
    this.ctx.cookies.set('v_token', user_info._id.toString(), {
      httpOnly: false,
      signed: true,
      encrypt: true,
    });

    this.success({
      nickname: user_info.nickname,
      avatar: user_info.avatar,
      vir_uid: user_info.vir_uid,
      other_info: {
        created: user_info.created,
        have_app_count: user_info.apps_count,
        max_app_count: this.ctx.service.application.maxAppCount,
        max_api_count: this.ctx.service.interface.maxApiCount,
        vir_uid_updated: user_info.vir_uid_updated,
        email: user_info.email,
      },
    });
  }
}

module.exports = OauthController;
