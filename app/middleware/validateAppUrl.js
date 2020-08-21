'use strict';

/**
 * 验证Api请求Url是否存在且有效(请求生成虚拟数据接口)
 */
module.exports = () => {
  return async function validateAppUrl(ctx, next) {
    const ip = ctx.ips.length > 0 ? (ctx.ips[0] !== '127.0.0.1' ? ctx.ips[0] : ctx.ips[1]) : ctx.ip;

    const vir_uid = ctx.params[0];
    const app_slug = ctx.params[1];
    const uri = ctx.params[2];
    const method = ctx.request.method;

    // 检测对应用户是否存在且状态正常
    const user = await ctx.service.user.getInfoByConditions({ vir_uid });
    if (!user || user.status !== 1) {
      ctx.body = 'APPLICATION NOT EXIST!';
      ctx.status = 404;
      return;
    }

    // 检测对应App是否存在且状态正常
    const app = await ctx.service.application.getInfoByConditions({ uid: user.id, slug: app_slug });
    if (!app || app.status !== 1) {
      ctx.body = 'The application does not exist or is invalid!';
      ctx.status = 404;
      return;
    }

    // 检测app_key
    let app_token = null;
    if (app.verify_rule === 'header') {
      app_token = ctx.get('app-token');
    } else if (app.verify_rule === 'param') {
      app_token = ctx.query._token;
    } else {
      app_token = ctx.get('app-token') || ctx.query._token;
    }
    const res_tpl = app.response_template;
    if (app.app_key !== app_token) {
      const res_data = {};
      res_data[res_tpl.code_name] = res_tpl.failed_code_value;
      if (res_tpl.message_name) {
        res_data[res_tpl.message_name] = '[VirApi] token error!';
      }
      ctx.body = res_data;
      ctx.status = 401;
      return;
    }

    // 检测对应接口是否存在且状态正常
    const api = await ctx.service.interface.getApiByAppIdAndMethod(app.id, method, uri);
    if (!api) {
      const res_data = {};
      res_data[res_tpl.code_name] = res_tpl.failed_code_value;
      if (res_tpl.message_name) {
        res_data[res_tpl.message_name] = 'Interface error or invalid!';
      }
      ctx.body = res_data;
      ctx.status = 400;
      return;
    }

    ctx._g = {
      user,
      app,
      api,
    };

    await next();

    // 添加请求日志记录
    ctx.service.interfaceRequestLog.insert({
      app_id: app.id,
      app_slug: app.slug,
      api_id: api.id,
      uri: ctx.request.url.replace(/\/api/, ''),
      method,
      params: (method === 'POST' || method === 'PUT') ? ctx.request.body : ctx.query,
      response: ctx.body,
      result: (ctx.body && ctx.body[res_tpl.code_name] !== undefined && ctx.body[res_tpl.code_name] === res_tpl.succeed_code_value) ? 1 : 0,
      referer: ctx.get('referer'),
      ip,
      device: ctx.get('user-agent'),
    });
  };
};
