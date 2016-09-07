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
      main: {
        files: {
          //公用lib类库(大部分第三方)
          'test/fixtures/dist/module.min.css': [
            'test/fixtures/srcmodule1.css',
            'test/fixtures/srcmodule2.css',
            'test/fixtures/srcmodule3.css',
            'test/fixtures/srcmodule4.css'
          ]
        }
      }
    },

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
          src: ['**/*.js', '**/*.css', '**/*.{png,jpg,jpeg,gif}'],
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
        //map_file_name: 'fetch.js',
        injectFetch: true, //选择生成js文件，还是嵌入到html
        injectSea: true //选择生成js文件，还是嵌入到html
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
  grunt.loadNpmTasks('grunt-template');
  grunt.loadNpmTasks('grunt-filerev');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'copy', 'template', 'concat', 'filerev', 'concat_seajs'/*, 'nodeunit'*/]);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
