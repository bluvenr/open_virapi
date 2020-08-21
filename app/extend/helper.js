'use strict';

const moment = require('moment');
const fs = require('mz/fs');
const path = require('path');

exports.moment = () => moment();

// 格式化时间
exports.formatTime = time => moment(time).format('YYYY-MM-DD HH:mm:ss');

// 同步创建多级目录
function mkdirsSync(dirname) {
  if (fs.existsSync(dirname)) {
    return true;
  } else if (mkdirsSync(path.dirname(dirname))) {
    fs.mkdirSync(dirname);
    return true;
  }
  return false;
}
exports.mkdirsSync = mkdirsSync;

// 处理成功响应
// 使用方法：ctx.helper.success(ctx, {'xx':'xxxx'});
exports.success = (ctx, res = null, msg = 'Success') => {
  ctx.body = {
    code: 200,
    data: res,
    msg,
  };

  ctx.status = 200;
};

// 处理失败响应
// 使用方法：ctx.helper.failed(ctx, error.message);
exports.failed = (ctx, msg = 'Failed', code = 1000) => {
  ctx.body = {
    code,
    msg,
  };

  ctx.status = 200;
};
