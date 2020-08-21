'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/user.test.js', () => {

  // 注册
  // it('should status 200 and get the request body', () => {
  //   app.mockCsrf();
  //   return app.httpRequest()
  //     .post('/register')
  //     .send({ name: 'john' })
  //     .set('Accept', 'application/json')
  //     .expect('Content-Type', /json/)
  //     .expect(200)
  //     .end((err, res) => {
  //       if (err) return done(err);
  //       done();
  //     });
  // });

  // // 登录
  // it('should status 200 and get the request body', () => {
  //   app.mockCsrf();
  //   return app.httpRequest()
  //     .post('/login')
  //     .send({ name: 'john' })
  //     .set('Accept', 'application/json')
  //     .expect('Content-Type', /json/)
  //     .expect(200)
  //     .end((err, res) => {
  //       if (err) return done(err);
  //       done();
  //     });
  // });

});
