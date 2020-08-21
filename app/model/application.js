'use strict';

/**
 * 应用模型
 */
const moment = require('moment');

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ObjectId = mongoose.Schema.Types.ObjectId;
  const iconBaseUri = app.config.imgUri;

  const ResponseTemplateSchema = new Schema({
    code_name: {
      type: String,
      required: true,
      default: 'code',
    },
    succeed_code_value: {
      type: Schema.Types.Mixed,
      required: true,
      default: 200,
    },
    failed_code_value: {
      type: Schema.Types.Mixed,
      required: true,
      default: 1000,
    },
    data_name: {
      type: String,
      default: 'data',
    },
    message_name: {
      type: String,
      default: 'message',
    },
    succeed_message_value: {
      type: String,
      default: 'Succeed',
    },
    failed_message_value: {
      type: String,
      default: 'Failed',
    },
  });

  const ApplicationSchema = new Schema({
    uid: {
      type: ObjectId,
    },
    vir_uid: {
      type: String,
    },
    number: {
      type: String,
      unique: true,
    },
    icon: {
      type: String,
      get: v => (v ? `${iconBaseUri}${v}` : ''),
    },
    name: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 36,
    },
    slug: {
      type: String,
      match: /^[\w\-\.]{2,20}$/,
      trim: true,
    },
    app_key: {
      type: String,
    },
    verify_rule: {
      type: String,
      enum: [
        'param', 'header', 'compatible',
      ],
      default: 'compatible',
    },
    api_count: {
      type: Number,
      default: 0,
    },
    describe: {
      type: String,
      maxlength: 200,
    },
    status: {
      type: Number,
      default: 1,
      enum: [
        0, 1, -1,
      ],
    },
    created: {
      type: Date,
      default: Date.now,
      get: v => v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : null,
    },
    updated: {
      type: Date,
      default: Date.now,
      get: v => v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : null,
    },
    response_template: {
      type: ResponseTemplateSchema,
      default: {
        code_name: 'code',
        succeed_code_value: 200,
        failed_code_value: 1000,
        data_name: 'data',
        message_name: 'message',
        succeed_message_value: 'Succeed',
        failed_message_value: 'Failed',
      },
      get: v => {
        if (v && v.succeed_code_value && /^\d+$/.test(v.succeed_code_value)) v.succeed_code_value = parseInt(v.succeed_code_value);
        if (v && v.failed_code_value && /^\d+$/.test(v.failed_code_value)) v.failed_code_value = parseInt(v.failed_code_value);
        return v;
      },
    },
  }, { timestamps: { createdAt: 'created', updatedAt: 'updated' } });

  ApplicationSchema.virtual('statusName').get(function () {
    switch (this.status) {
      case 0: return '冻结';
      case 1: return '正常';
      case -1: return '软删除';
      default: return '未知状态';
    }
  });

  return mongoose.model('Application', ApplicationSchema, 'application');
};
