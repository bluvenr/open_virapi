'use strict';

/**
 * 应用接口请求日志模型
 */
const moment = require('moment');

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ObjectId = mongoose.Schema.Types.ObjectId;

  const InterfaceRequestLogSchema = new Schema({
    app_id: {
      type: ObjectId,
      required: true,
    },
    app_slug: {
      type: String,
      required: true,
    },
    api_id: {
      type: ObjectId,
      default: null,
    },
    uri: {
      type: String,
      // maxlength: 100,
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
    },
    params: {
      type: Map,
    },
    response: {
      type: Map,
    },
    result: { // 请求结果状态：1-成功、0-失败
      type: Number,
      default: 1,
    },
    referer: {
      type: String,
    },
    ip: {
      type: String,
    },
    device: {
      type: String,
    },
    created: {
      type: Date,
      default: Date.now,
      get: v => v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : null,
    },
  }, { timestamps: { createdAt: 'created', updatedAt: false } });

  return mongoose.model('InterfaceRequestLog', InterfaceRequestLogSchema, 'interface_request_log');
};
