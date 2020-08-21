'use strict';

module.exports = (option, app) => {
  return async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      // 所有的异常都在 app 上触发一个 error 事件，框架会记录一条错误日志
      app.emit('error', err, this);

      const status = err.status || 500;
      // 生产环境时 500 错误的详细错误内容不返回给客户端，因为可能包含敏感信息
      const message = status === 500 && app.config.env === 'prod' ? 'Internal Server Error' : err.message;

      // 从 error 对象上读出各个属性，设置到响应中
      ctx.body = {
        code: status, // 服务端自身的处理逻辑错误(包含框架错误500 及 自定义业务逻辑错误533开始 ) 客户端请求参数导致的错误(4xx开始)，设置不同的状态码
        message,
      };

      if (status === 422) { // 校验参数抛出异常情况
        // ctx.body.detail = err.errors;
        ctx.body.message += ' ERR:' + err.errors.map(o => `${o.field} ${o.message}`).join(',');
      }
      ctx.status = 200;
    }
  };
};
