'use strict';

/**
 * 验证用户是否登录及身份合法性
 */
module.exports = () => {
  function _expectsJson(headers) {
    return headers['x-requested-with'] && headers['x-requested-with'] === 'XMLHttpRequest' || headers['x-pjax'] || headers.accept && headers.accept.indexOf('/json') > 0;
  }

  function _responseErr(ctx, code = 401, message = '登录信息异常或失效，请重新登录') {
    if (code === 401) {
      ctx.session = null;
      ctx.cookies.set('Vir_SESSION', null);
      ctx.cookies.set('v_token', null);
    }

    if (_expectsJson(ctx.request.header)) {
      ctx.body = {
        code,
        message,
      };
    } else {
      ctx.unsafeRedirect(`/login?err_msg=${encodeURI(message)}`);
    }
  }

  return async function validateUser(ctx, next) {
    // ctx.session.user_id = '5f3d434b47c1854b545ce64f';   // TODO 测试使用

    // 验证Session
    if (!ctx.session.user_id || ctx.session.user_id !== ctx.cookies.get('v_token', { signed: true, encrypt: true })) {
      _responseErr(ctx);
      return;
    }

    // 检测对应用户是否存在且状态正常
    const userInfo = await ctx.service.user.getInfoByConditions({ _id: ctx.session.user_id });
    if (!userInfo || userInfo.status !== 1) {
      _responseErr(ctx);
      return;
    }

    ctx._g = {
      userInfo,
    };

    await next();
  };
};
