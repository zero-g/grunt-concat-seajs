/*
 * grunt-concat-seajs
 * https://github.com/zero-g/grunt-concat-seajs
 *
 * Copyright (c) 2015 zero-g
 * Licensed under the MIT license.
 */

'use strict';
var config = {
      srcDir : 'test/fixtures/src',
      releaseDir : 'test/fixtures/dist'
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
  grunt.loadNpmTasks('grunt-filerev');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'copy', 'filerev', 'concat_seajs'/*, 'nodeunit'*/]);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
