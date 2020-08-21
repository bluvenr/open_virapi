'use strict';

/**
 * 接口模型
 */
const moment = require('moment');

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ObjectId = mongoose.Schema.Types.ObjectId;

  const InterfaceSchema = new Schema({
    app_id: {
      type: ObjectId,
      required: true,
    },
    app_slug: {
      type: String,
      required: true,
    },
    uid: {
      type: ObjectId,
      required: true,
    },
    vir_uid: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    describe: {
      type: String,
      maxlength: 200,
      default: '',
    },
    uri: {
      type: String,
      maxlength: 100,
      match: /^[\w-.]+$/,
      trim: true,
    },
    method: {
      type: String,
      enum: [
        'GET', 'POST', 'PUT', 'DELETE',
      ],
      default: 'GET',
    },
    response_rules: {
      type: Schema.Types.Mixed,
    },
    creator: {
      type: ObjectId,
    },
    status: {
      type: Number,
      default: 1,
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
  }, {
    timestamps: { createdAt: 'created', updatedAt: 'updated' },
  });

  InterfaceSchema.pre('save', next => {
    const now = new Date();
    this.updated = now;
    next();
  });

  return mongoose.model('Interface', InterfaceSchema, 'interface');
};
