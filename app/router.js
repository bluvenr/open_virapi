'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, middlewares } = app;

  router.get('/', controller.console.common.index);
  router.get('/console', controller.console.common.index);

  /**
   * Api模块路由
   */
  const validateAppUrl = middlewares.validateAppUrl();
  router.get(/^\/api\/([\w-.]+)\/([\w-.]+)\/([\w-.\/]+)$/, validateAppUrl, controller.api.http.get);
  router.post(/^\/api\/([\w-.]+)\/([\w-.]+)\/([\w-.\/]+)$/, validateAppUrl, controller.api.http.get);
  router.put(/^\/api\/([\w-.]+)\/([\w-.]+)\/([\w-.\/]+)$/, validateAppUrl, controller.api.http.get);
  router.delete(/^\/api\/([\w-.]+)\/([\w-.]+)\/([\w-.\/]+)$/, validateAppUrl, controller.api.http.get);


  /**
   * Console模块路由
   */
  router.post('/ajax/login', controller.console.oauth.login);

  const validateUser = middlewares.validateUser();
  router.get('/ajax/account', validateUser, controller.console.user.my_account);
  router.delete('/ajax/session', validateUser, controller.console.user.logout);
  router.post('/ajax/user/profile', validateUser, controller.console.user.update);

  router.get('/ajax/request_log', validateUser, controller.console.log.request_log);

  router.get('/ajax/statistics', validateUser, controller.console.statistics.index);

  router.get('/ajax/application/list', validateUser, controller.console.application.list);
  router.post('/ajax/change_application_key', validateUser, controller.console.application.change_app_key);
  router.post('/ajax/application/copy', validateUser, controller.console.application.copy);
  router.get('/ajax/application/:slug/base_info', validateUser, controller.console.application.base_info);

  router.post('/ajax/interface/empty', validateUser, controller.console.interface.empty);
  router.post('/ajax/interface/copy', validateUser, controller.console.interface.copy);
  router.post('/ajax/interface/move', validateUser, controller.console.interface.move);
  router.get('/ajax/interface/list', validateUser, controller.console.interface.list);
  router.get('/ajax/interface_map', validateUser, controller.console.interface.map);
  router.post('/ajax/interface_debug', validateUser, controller.console.interface.debug);

  router.resources('application', '/ajax/application', validateUser, controller.console.application);
  router.resources('interface', '/ajax/interface', validateUser, controller.console.interface);
};
