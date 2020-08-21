'use strict';

const Controller = require('egg').Controller;

class HttpController extends Controller {

  success(data) {
    const { ctx } = this;

    const res_tpl = ctx._g.app.response_template;
    const res_data = {};
    res_data[res_tpl.code_name] = res_tpl.succeed_code_value;
    if (res_tpl.message_name) {
      res_data[res_tpl.message_name] = res_tpl.succeed_message_value;
    }
    if (res_tpl.data_name && data) {
      res_data[res_tpl.data_name] = data;
    }
    ctx.body = res_data;
  }

  /**
   * 用户自定义GET请求统一处理入口
   */
  async get() {
    const { ctx } = this;

    ctx.body = await ctx.service.interface.processResponse(ctx._g.app, ctx._g.api, ctx);
  }

  /**
   * 用户自定义POST请求统一处理入口
   */
  async post() {
    const { ctx } = this;

    ctx.body = await ctx.service.interface.processResponse(ctx._g.app, ctx._g.api, ctx);
  }

  /**
   * 用户自定义PUT请求统一处理入口
   */
  async put() {
    const { ctx } = this;

    ctx.body = await ctx.service.interface.processResponse(ctx._g.app, ctx._g.api, ctx);
  }

  /**
   * 用户自定义DELETE请求统一处理入口
   */
  async delete() {
    const { ctx } = this;

    ctx.body = await ctx.service.interface.processResponse(ctx._g.app, ctx._g.api, ctx);
  }
}

module.exports = HttpController;
