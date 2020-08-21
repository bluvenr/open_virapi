'use strict';

/**
 * 用户模型
 */
const moment = require('moment');

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const avatarBaseUri = app.config.imgUri;

  const UserSchema = new Schema({
    vir_uid: {
      type: String,
      unique: true,
      match: /^[a-z][a-z0-9_\-]{3,23}$/,
      trim: true,
    },
    vir_uid_updated: {
      type: Date,
      default: null,
      get: v => v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : null,
    },
    nickname: {
      type: String,
      // lowercase: true,
      trim: true,
      minlength: 2,
      maxlength: 20,
    },
    avatar: {
      type: String,
      get: v => `${avatarBaseUri}${v}`,
      default: '/default_avatar.jpg',
    },
    email: {
      type: String,
      trim: true,
      match: /^[a-zA-Z0-9._-]+@[a-z0-9-]{2,}\.[a-z]{2,}$/,
    },
    apps_count: {
      type: Number,
      default: 0,
    },
    password: {
      type: String,
      minlength: 6,
    },
    status: {
      type: Number,
      default: 1,
      enum: [0, 1],
    },
    login_date: {
      type: Date,
      default: null,
      get: v => v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : null,
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
  }, { timestamps: { createdAt: 'created', updatedAt: 'updated' } });

  UserSchema.virtual('statusName').get(function () {
    switch (this.status) {
      case 0: return '冻结';
      case 1: return '正常';
      default: return '未知状态';
    }
  });

  UserSchema.pre('save', next => {
    const now = new Date();
    this.updated = now;
    next();
  });

  return mongoose.model('User', UserSchema, 'user');
};
