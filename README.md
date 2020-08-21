<div style="text-align:center;" align="center">

<img src="https://images.gitee.com/uploads/images/2020/0821/230221_561fc363_863133.png" alt="VirAPI LOGO" style="width:260px;">

<h3>VirAPI——在线虚拟数据云接口平台</h3>

内置MockJs语法支持，请求接口即可获得自定义规则的虚拟数据。帮助开发者，特别是前端开发者，提供很好的快速开发体验。

[VirAPI官网  »](http://www.virapi.com/?_from=github)

<br/>

[文章](http://www.virapi.com/article.html?_from=github)
·
[关于](http://www.virapi.com/about.html?_from=github)
·
[控制台](http://console.virapi.com/?_from=github)

</div>
<br/>

## VirAPI开源版

对应前端UI代码仓库：[https://github.com/bluvenr/open_virapi_front_end](https://github.com/bluvenr/open_virapi_front_end)

### 环境依赖
+ NodeJs(NPM)
+ MongoDB

本项目使用了[eggjs](https://eggjs.org/zh-cn/intro/quickstart.html)作为后端逻辑项目框架。

### 运行&部署
搭建好必要环境后，执行`npm install`安装项目所需依赖包。

本地测试运行，则请执行：`npm dev`

正式环境运行，请执行：`npm start`；此时若想关闭停止项目，则执行：`npm stop`。由于eggjs框架的机制，请每次修改后端代码后重启该项目`npm restart`。

默认服务端口为`7001`，本地可直接访问`http://127.0.0.1:7001/`进入控制台管理页面。若是部署到线上，可配置nginx或apache进行重定向。


### 项目配置相关介绍
项目配置文件放在`config/config.default.js`文件中，若是放置服务器正式环境，则建议复制该文件您需要自定义的配置在同目录下命名为`config.local.js`文件中，并设置您要的配置参数。

默认`config.default.js`文件内容为：

```
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
```

在您的自定义配置参数文件`config.local.js`中，我们建议您配置以下必要参数：

```
'use strict';

// cookie & session 数据加密安全字符串
exports.keys = 'xxxxxxxxx';   // 建议您自定义重置该参数，cookie、session等数据加密时会用到该参数

// MongoDB 相关参数
exports.mongoose = {
  client: {
    url: 'mongodb://127.0.0.1:27017/local_virapi_db',   // 您的mongo数据库访问地址
    options: {
      // useMongoClient: true,
      autoReconnect: true,
      reconnectTries: Number.MAX_VALUE,
      bufferMaxEntries: 0,
    },
  },
};

// 图片资源访问域名
exports.imgUri = 'http://{您的图片访问地址}';    // 若您要对图片资源独立分配域名可设置该参数
```


### Mongo数据库
为了能登录控制台系统，需要一个初始化的账号信息。在您的mongo所在服务器执行以下命令，创建初始账号：

``` mongo
// 进入Mongo命令台
mongo 127.0.0.1:27017/local_virapi_db;  // 请更换您的Mongo访问地址

// 切换到目标数据库
use local_virapi_db;  // 请更换您的Mongo数据名

// 插入初始账号信息
db.getCollection('user').insertOne({
    "nickname" : "admin",
    "vir_uid" : "vir_admin",
    "vir_uid_updated" : null,
    "email" : "admin@virapi.com",
    "password" : "$2a$10$6fam2XUhNqU0nTNixjuoBuCx5aK2R8t.vEndOuVQ6vxVrinWXu9wy",
    "avatar" : "/default_avatar.jpg",
    "apps_count" : 0,
    "login_date" : ISODate("2020-08-21T12:35:47.312Z"),
    "status" : 1,
    "created" : ISODate("2020-08-19T15:20:43.192Z"),
    "updated" : ISODate("2020-08-21T12:35:47.315Z"),
    "__v" : 0
});
```

其中登录账号即为：`admin@virapi.com`，默认登录密码为：`123456`。

登录成功后，**请注意重置登录密码**，以保障账号安全。


## 若您觉得VirAPI有帮到您，请赞助一下以示支持哦~
😁请备注`virapi`。

| <div style="text-align:center;color:#019fe8;">支付宝赞助</div> | <div style="text-align:center;color:#22ab39;">微信赞助</div> |
| --------- | --------- |
| <img src="https://images.gitee.com/uploads/images/2020/0821/230258_d7ecb18b_863133.png" alt="支付宝赞助" style="width:160px;"> | <img src="https://images.gitee.com/uploads/images/2020/0821/230314_08ec5aad_863133.png" alt="微信赞助" style="width:160px;"> |

<br/>
<br/>

欢迎大家通过[Gitter](https://gitter.im/virapi/feedback)与我们沟通和联系。
