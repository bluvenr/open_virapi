'use strict';

const CommonController = require('./common');

class InterfaceController extends CommonController {

  /**
   * 获取指定应用接口列表
   */
  async index() {
    const { ctx } = this;

    const app_slug = ctx.query.app_slug;
    if (!app_slug) {
      this.failed('请指定要查找的应用');
      return;
    }

    const list = await ctx.service.interface.getProcessList(
      { uid: this.user.id, app_slug },
      [
        'app_id',
        'app_slug',
        'created',
        'describe',
        'method',
        'name',
        'response_rules',
        'updated',
        'uri',
        // '_id',
      ], 0, 0
    );

    this.success({
      max_api_count: ctx.service.interface.maxApiCount,
      list,
    });
  }

  /**
   * 获取指定应用接口Map
   */
  async map() {
    const { ctx } = this;

    const app_slug = ctx.query.app_slug;
    if (!app_slug) {
      this.failed('请指定要查找的应用');
      return;
    }

    let list = [];
    if (ctx.query._type === 'api_uri_map') {
      list = await ctx.service.interface.getList(
        { uid: this.user.id, app_slug },
        [
          '_id',
          'name',
          'method',
          'uri',
        ], 0, 0
      );
    } else {
      list = await ctx.service.interface.getList(
        { uid: this.user.id, app_slug },
        [
          '_id',
          'name',
          'method',
          'uri',
          'describe',
        ], 0, 0
      );
    }

    this.success(list);
  }

  /**
   * 获取指定应用接口简易list
   */
  async list() {
    const { ctx } = this;

    const app_slug = ctx.query.app_slug;
    if (!app_slug) {
      this.failed('请指定要查找的接口');
      return;
    }

    const list = await ctx.service.interface.getList(
      { uid: this.user.id, app_slug },
      [
        '_id',
        'name',
      ], 0, 0
    );

    this.success(list);
  }

  /**
   * 创建新接口
   */
  async create() {
    const { ctx } = this;

    const validateRules = await ctx.service.interface.validateRules;
    ctx.validate(validateRules, ctx.request.body);


    // 验证response参数
    if (ctx.request.body.response_rules && ctx.request.body.response_rules.length > 0) {
      ctx.request.body.response_rules.forEach(item => {
        ctx.validate(ctx.service.interface.responseValidateRules, item);
      });
    }

    await ctx.service.interface.insertByUid(this.user.id, ctx.request.body);
    this.success();
  }

  /**
   * 查看接口详情
   */
  async show() {
    const { ctx } = this;

    if (!ctx.query.id) {
      this.failed('必要参数缺失');
      return;
    }

    const info = await ctx.service.interface.getInfoByConditions({ _id: ctx.query.id, uid: this.user.id });
    this.success(info);
  }

  /**
   * 修改接口
   */
  async update() {
    const { ctx } = this;

    const validateRules = await ctx.service.interface.validateRules;
    ctx.validate(validateRules, ctx.request.body);

    // 验证response参数
    if (ctx.request.body.response_rules && ctx.request.body.response_rules.length > 0) {
      ctx.request.body.response_rules.forEach(item => {
        ctx.validate(ctx.service.interface.responseValidateRules, item);
      });
    }

    const res = await ctx.service.interface.updateByIdAndUid(ctx.params.id, this.user.id, ctx.request.body);

    if (res.ok === 1) {
      this.success({ succeed_response: res.succeed_response });
    } else {
      this.failed('编辑失败，请稍后再试！');
    }
  }

  /**
   * 清空应用接口
   */
  async empty() {
    const { ctx } = this;

    if (!ctx.request.body.app_slug) {
      this.failed('必要参数缺失');
      return;
    }

    await ctx.service.interface.emptyByAppSlugAndUid(ctx.request.body.app_slug, this.user.id);
    this.success();
  }

  /**
   * 拷贝应用接口
   */
  async copy() {
    const { ctx } = this;

    if (!ctx.request.body.target_app_slug || !ctx.request.body.api_ids || !ctx.request.body.api_ids.length) {
      this.failed('必要参数缺失');
      return;
    }

    await ctx.service.interface.copyApi(ctx.request.body.target_app_slug, ctx.request.body.api_ids, this.user.id);
    this.success();
  }

  /**
   * 转移接口
   */
  async move() {
    const { ctx } = this;

    if (!ctx.request.body.target_app_slug || !ctx.request.body.api_ids || !ctx.request.body.api_ids.length) {
      this.failed('必要参数缺失');
      return;
    }

    await ctx.service.interface.moveApi(ctx.request.body.target_app_slug, ctx.request.body.api_ids, this.user.id);
    this.success();
  }

  /**
   * 删除接口
   */
  async destroy() {
    const { ctx } = this;

    if (!ctx.params.id) {
      this.failed('必要参数缺失');
      return;
    }

    await ctx.service.interface.deleteByIdAndUid(ctx.params.id, this.user.id);
    this.success();
  }

  /**
   * 调试测试接口
   */
  async debug() {
    const { ctx } = this;

    if (!ctx.request.body.api_id) {
      this.failed('必要参数缺失');
      return;
    }

    const api = await ctx.service.interface.getInfoByConditions({ _id: ctx.request.body.api_id, uid: this.user.id });
    if (!api) {
      this.failed('接口不存在或无权限');
      return;
    }

    const app = await ctx.service.application.getInfo(api.app_id);
    if (!app || app.status !== 1) {
      this.failed('接口所属应用不存在或状态异常');
      return;
    }

    const res = await ctx.service.interface.processResponse(app, api, ctx, true);
    this.success(res);
  }
}

module.exports = InterfaceController;
