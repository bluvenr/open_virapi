'use strict';

const CommonController = require('./common');

class UserController extends CommonController {
  /**
   * 获取当前我的账号信息
   */
  async my_account() {
    let user_info = this.ctx._g.userInfo;
    user_info = user_info.toJSON({ getters: true, virtuals: false });

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

  /**
   * 退出登录
   */
  async logout() {
    this.ctx.session = null;
    this.ctx.cookies.set('Vir_SESSION', null);
    this.ctx.cookies.set('v_token', null);

    this.success();
  }

  /**
   * 编辑个人资料
   */
  async update() {
    const { ctx } = this;

    ctx.validate({
      nickname: { type: 'string', min: 2, max: 20 },
      vir_uid: { type: 'string', required: false, allowEmpty: false, format: /^[a-z][a-z0-9_\-]{3,23}$/ },
      email: { type: 'email', required: false, allowEmpty: false },
      avatar: { type: 'string', required: false, format: /^data:image\/\w+;base64,/ },
    }, ctx.request.body);

    await ctx.service.user.updateByUid(this.user.id, ctx.request.body);

    this.success();
  }

  /**
   * 重置登录密码
   */
  async change_pwd() {
    const { ctx } = this;

    ctx.validate({
      old_password: { type: 'string', min: 6, max: 20 },
      password: { type: 'string', min: 6, max: 20 },
    }, ctx.request.body);

    await ctx.service.user.updatePwdByUid(this.user.id, ctx.request.body);

    this.success();
  }
}

module.exports = UserController;
