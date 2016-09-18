/*
 * grunt-concat-seajs
 * https://github.com/zero-g/grunt-concat-seajs
 *
 * Copyright (c) 2015 zero-g
 * Licensed under the MIT license.
 */

'use strict';
var now = new Date(),
    config = {
      srcDir : 'test/fixtures/src',
      releaseDir : 'test/fixtures/dist',
      date: '' + now.getFullYear() + (now.getMonth() + 1)
    },
    path = require('path');
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: [config.releaseDir]
    },

    copy: {
      main: {
        files: [{
          expand: true,
          cwd: path.join(config.srcDir),
          src: ['**/*'],
          dest: config.releaseDir
        }]
      }
    },
    concat: {
      main:{
        files: {
          //公用lib类库(大部分第三方)
          'test/fixtures/dist/index.min.css': [
            'test/fixtures/dist/module1.css',
            'test/fixtures/dist/module2.css',
            'test/fixtures/dist/module3.css',
            'test/fixtures/dist/module4.css'
          ],
          'test/fixtures/dist/index.min.js': [
            'test/fixtures/dist/module1.js',
            'test/fixtures/dist/module2.js',
            'test/fixtures/dist/module3.js',
            'test/fixtures/dist/module4.js',
            'test/fixtures/dist/index.js'
          ]
        }
      }

    },
    //concat: {
    //  embed: {
    //    files: {
    //      'test/fixtures/dist/module.min.css': [
    //        'test/fixtures/src/module1.css',
    //        'test/fixtures/src/module2.css',
    //        'test/fixtures/src/module3.css',
    //        'test/fixtures/src/module4.css'
    //      ],
    //      'test/fixtures/dist/module.min.js': [
    //        'test/fixtures/src/module1.js',
    //        'test/fixtures/src/module2.js',
    //        'test/fixtures/src/module3.js',
    //        'test/fixtures/src/module4.js'
    //      ]
    //    }
    //  },
    //  async: {
    //    files: {
    //      'test/fixtures/dist/module.min.css': [
    //        'test/fixtures/src/module1.css',
    //        'test/fixtures/src/module2.css',
    //        'test/fixtures/src/module3.css',
    //        'test/fixtures/src/module4.css'
    //      ]
    //    }
    //  }
    //},

    template: {
      options: {
        data: {
          staticBase: '//s.geilicdn.com/' + config.date
        }
      },
      main: {
        files: [{
          expand: true,
          cwd: config.releaseDir,
          src: ['**/*.html'],
          dest: config.releaseDir
        }]
      }

    },

    // generate any new files which is md5 named.
    filerev: {
      main: {
        files: [{
          expand: true,
          cwd: config.releaseDir,
          src: ['**/*.js', '**/*.css', '**/*.{png,jpg,jpeg,gif}', '!sea.min.js'],
          dest: config.releaseDir
        }]
      }
    },
    transport: {
      options: {
        debug: false
      },
      main: {
        files: [{
          expand: true,
          cwd: config.releaseDir,
          src: ['**/*.js', '!**/sea.*js'],
          dest: config.releaseDir
        }]
      }
    },

    // Configuration to be run (and then tested).
    concat_seajs: {
      options: {
        baseDir: config.releaseDir + '/',
        seajs_src: config.releaseDir + '/',
        cdnBase: '//s.geilicdn.com/' + config.date,
        map_file_name: 'fetch.js',
        injectFetch: true,
        injectSea: true,
        map: [//注入页面map 并且使fetch兼容
          {
            'dest': path.join(config.releaseDir ,'index.html'),
            'files': [
               path.join(config.releaseDir , 'index.min.js'),//this file must be exist.
               //path.join(config.releaseDir , 'index.min.css'),
               path.join(config.releaseDir , 'module1.css'),
               path.join(config.releaseDir , 'module2.css'),
               path.join(config.releaseDir , 'module3.css'),
               path.join(config.releaseDir , 'module4.css')
            ]
          }
        ]
      },
      main: {
        files: [{
          expand: true,
          cwd: config.releaseDir,
          src: ['**/*.html']
        }]
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-cmd-transport');
  grunt.loadNpmTasks('grunt-template');
  grunt.loadNpmTasks('grunt-filerev');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'copy', 'template', 'transport', 'concat', 'filerev', 'concat_seajs'/*, 'nodeunit'*/]);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
