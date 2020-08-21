'use strict';

const CommonController = require('./common');

class ApplicationController extends CommonController {

  /**
   * 获取当前用户应用列表(简易信息)
   */
  async list() {
    const { ctx } = this;
    const list = await ctx.service.application.getListByUid(this.user.id, '_id number name slug icon api_count', 0, 0);
    this.success(list.map(o => o.toJSON({ getters: true, virtuals: false })));
  }

  /**
   * 获取当前用户应用列表
   */
  async index() {
    const { ctx } = this;
    const list = await ctx.service.application.getListByUid(this.user.id, '_id created describe icon name number slug updated api_count', 0, 0);
    this.success(list.map(o => o.toJSON({ getters: true, virtuals: false })));
  }

  /**
   * 创建新应用
   */
  async create() {
    const { ctx } = this;

    if (!ctx.request.body.slug) {
      this.failed('必要参数缺失');
      return;
    }

    const data = Object.assign({
      app_key: await ctx.service.application.createAppKey(ctx.request.body.slug),
    }, ctx.request.body, {
      uid: this.user.id,
      vir_uid: this.user.vir_uid,
      number: await ctx.service.application.createNumber(),
    });

    ctx.validate(await ctx.service.application.rules, data);

    const application = await ctx.service.application.insert(data);
    this.success(application);
  }

  /**
   * 查看应用详情
   */
  async show() {
    const { ctx } = this;

    if (!ctx.params.id) {
      this.failed('必要参数缺失');
      return;
    }

    const info = await ctx.service.application.getInfoByConditions({ slug: ctx.params.id, uid: this.user.id });
    if (info) {
      this.success(info.toJSON({ getters: true/* , virtuals: false */ }));
    } else {
      this.failed('应用不存在或已删除');
    }
  }

  /**
   * 获取应用基本信息
   */
  async base_info() {
    const { ctx } = this;

    if (!ctx.params.slug) {
      this.failed('必要参数缺失');
      return;
    }

    const info = await ctx.service.application.getInfoByConditions({ slug: ctx.params.slug, uid: this.user.id }, '_id number icon name slug api_count response_template');
    if (info) {
      this.success(info.toJSON({ getters: true, virtuals: false }));
    } else {
      this.failed('应用不存在或已删除');
    }
  }

  /**
   * 修改应用
   */
  async update() {
    const { ctx } = this;

    if (!ctx.params.id) {
      this.failed('必要参数缺失');
      return;
    }

    ctx.validate(await ctx.service.application.updateRules, ctx.request.body);
    const res = await ctx.service.application.updateByUidAndAppid(this.user.id, ctx.params.id, ctx.request.body);

    if (res.ok === 1) {
      this.success();
    } else {
      this.failed('编辑失败，请稍后再试！');
    }
  }

  /**
   * 删除应用
   */
  async destroy() {
    const { ctx } = this;

    if (!ctx.params.id) {
      this.failed('必要参数缺失');
      return;
    }

    await ctx.service.application.deleteBySlug(ctx.params.id, this.user.id);
    this.success();
  }

  /**
   * 更换应用appkey
   */
  async change_app_key() {
    const { ctx } = this;

    if (!ctx.request.body.id) {
      this.failed('必要参数缺失');
      return;
    }

    const res = await ctx.service.application.changeAppKey({ _id: ctx.request.body.id, uid: this.user.id });
    this.success(res);
  }

  /**
   * 拷贝应用
   */
  async copy() {
    const { ctx } = this;

    if (!ctx.request.body.target_app_slug || !ctx.request.body.name || !ctx.request.body.slug) {
      this.failed('必要参数缺失');
      return;
    }

    await ctx.service.application.copyApp(ctx.request.body.target_app_slug, ctx.request.body.name, ctx.request.body.slug, ctx.request.body.describe, this.user.id);
    this.success();
  }
}

module.exports = ApplicationController;
