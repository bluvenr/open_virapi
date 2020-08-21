'use strict';

/** @type Egg.EggPlugin */
module.exports = {
  // had enabled by egg
  static: {
    enable: true,
  },

  session: {
    enable: true, // enable by default
    package: 'egg-session',
  },

  validate: {
    enable: true,
    package: 'egg-validate',
  },

  mongoose: {
    enable: true,
    package: 'egg-mongoose',
  },

  bcrypt: {
    enable: true,
    package: 'egg-bcrypt',
  },

  moment: {
    enable: true,
    package: 'moment',
  },

  jwt: {
    enable: true,
    package: 'egg-jwt',
  },

  routerPlus: {
    enable: true,
    package: 'egg-router-plus',
  },

  cors: {
    enable: true,
    package: 'egg-cors',
  },
};
