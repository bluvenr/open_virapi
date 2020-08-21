/* eslint valid-jsdoc: "off" */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = {
    mongoose: {
      // url: 'mongodb://127.0.0.1:27017/open_virapi_db',
      options: {
        // useMongoClient: true,
        autoReconnect: true,
        reconnectTries: Number.MAX_VALUE,
        bufferMaxEntries: 0,
      },
    },
    bcrypt: {
      saltRounds: 10,
    },
    security: {
      csrf: {
        enable: false,
        ignoreJSON: true,
      },
      domainWhiteList: [
        'http://localhost:8080',
      ],
    },
    validate: {
      convert: true,
    },
    cors: {
      // origin: '*',
      allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
    },
    jwt: {
      secret: 'virapi-202008192239',
    },
    proxy: true, // 通过ips获取nginx代理层真实IP
    session: {
      key: 'Vir_SESSION', // 承载 Session 的 Cookie 键值对名字
      maxAge: 2 * 3600 * 1000, // Session 的最大有效时间
      httpOnly: true,
      encrypt: true,
      renew: true, // 每次访问页面都会给session会话延长时间
    },
    static: {
      prefix: '/',
      dir: path.join(appInfo.baseDir, 'app/public'),
      dynamic: true,
      preload: false,
      maxAge: 0,
      buffer: false,
    },
  };

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_hNW87vqPkMiMpLBHEtolB3Yg6vQsk5Ip4AJzCih2QCXbZBmjh5I033ELjdwB';

  // add your middleware config here
  config.middleware = [
    'errorHandler',
  ];

  config.siteFile = {
    '/favicon.ico': fs.readFileSync(appInfo.baseDir + '/app/public/favicon.ico'),
  };

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
    imgUri: '/images',
    imgDir: appInfo.baseDir + '/app/public/images',
  };

  return {
    ...config,
    ...userConfig,
  };
};
