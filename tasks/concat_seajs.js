/*
 * grunt-concat-seajs
 * https://github.com/zero-g/grunt-concat-seajs
 *
 * Copyright (c) 2015 zero-g
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
    var crypto = require('crypto');
    var path = require('path');
    var fs = require('fs');
    var findup = require('findup-sync');

    var profile = '支持 指定的seajs模块化文件的合并';
    grunt.registerMultiTask('concat_seajs', profile, function() {
        var options = this.options({
            map_file_name: 'fetch.js',
            seajs_src: '',
            cdnBase: '',
            baseDir: '',
            injectFetch: false, //fetch文件引入方式:1.true 将fetch代码注入到页面中 , 2.false 将fetch代码生成外部js进行引用
            injectSea: false //seajs文件引入方式:1.true 将sea代码注入到页面中 , 2.false 外部js引用
        });

        var mapFileSrc = path.join(options.seajs_src, options.map_file_name); //生成map文件的路径
        var code = createMapFile(options.baseDir); //general

        if(options.injectFetch === true) {
            this.files.forEach(function(filePair) {
                filePair.src.forEach(function(file) {
                    appendMapSourceToView(file, code,options.injectSea,options.cdnBase,options.seajs_src);
                });
            });
        } else {
            grunt.file.write(mapFileSrc, code);
            var mapFileMd5Name = md5File(mapFileSrc);
            grunt.log.writeln('map file for md5：', mapFileMd5Name);

            this.files.forEach(function(filePair) {
                filePair.src.forEach(function(file) {
                    appendMapFileToView(file, mapFileMd5Name,options.injectSea,options.cdnBase,options.seajs_src);
                });
            });
        }
    });

    function md5File(file) {
        var MD5_LENGTH = 8; //set hash length, todo be the filerev md5 length config
        var hash = crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
        var suffix = hash.slice(0, MD5_LENGTH);
        var newName = [path.basename(file, path.extname(file)), suffix, path.extname(file).slice(1)].join('.');

        var dirname = path.dirname(file);
        var resultPath = path.resolve(dirname, newName);

        fs.renameSync(file, resultPath);
        return newName;
    }

    function appendMapSourceToView(viewSrc, source,injectSea,cdnBase,baseDir) {
        var code = grunt.file.read(viewSrc);

        var seajsReg = /<script.*(sea[^(js)]*js)[^<]*<\/script>/i;
        var m = code.match(seajsReg);
        if (!m) {
            return;
        }
        var placeholder = m[0];
        var seaScript = placeholder;
        var fetchScript = '<script type="text/javascript">' + source + '</script>';
        if(injectSea === true){
            var seaScriptSource = appendSeaJSFileToView(seaScript,cdnBase,baseDir);
            if(seaScriptSource){
                seaScript = '<script  type="text/javascript">' + seaScriptSource + '</script>';
            }
        }
        code = code.replace(placeholder, seaScript + '\n' + fetchScript);

        grunt.file.write(viewSrc, code);
        grunt.log.writeln('append fetch source to：', viewSrc);
    }

    function appendMapFileToView(viewSrc, mapFileName,injectSea,cdnBase,baseDir) {
        var code = grunt.file.read(viewSrc);

        var seajsReg = /<script.*(sea[^(js)]*js)[^<]*<\/script>/i;
        var m = code.match(seajsReg);
        if (!m) {
            return;
        }
        var placeholder = m[0];
        var seaScript = placeholder;
        var fetchScript = seaScript.replace(m[1], mapFileName);
        if(injectSea === true){
            var seaScriptSource = appendSeaJSFileToView(seaScript,cdnBase,baseDir);
            if(seaScriptSource){
                seaScript = '<script type="text/javascript">' + seaScriptSource + '</script>';
            }
        }
        code = code.replace(placeholder, seaScript + '\n' + fetchScript);

        grunt.file.write(viewSrc, code);
        grunt.log.writeln('append fetch file to：', viewSrc);
    }

    function appendSeaJSFileToView(seaScript,cdnBase,baseDir) {

        var seajsReg = /src=(['"])([^'"]*)\1/i;
        var m = seaScript.match(seajsReg);
        var seaScript = '';
        if (!m) {
            return;
        }
        var seaScriptSrc = m[2];//.substr(baseDir.length);
        if(seaScriptSrc.search(cdnBase) !== -1 ){
            seaScriptSrc = seaScriptSrc.replace(cdnBase,'');
        }
        //if(seaScriptSrc.search(baseDir) == -1 ){
            seaScriptSrc = path.join(baseDir , seaScriptSrc);
        //}
        grunt.log.writeln('------seajs file: ', seaScriptSrc);
        if(grunt.file.exists(seaScriptSrc)){
            seaScript = grunt.file.read(seaScriptSrc);
        }

        return seaScript;
    }

    function createMapFile(baseDir) {
        var filesMatch = getConcatFilesMatch(); //获取合并文件的md5映射表
        filesMatch = resolvePath(filesMatch, baseDir); //更正路径

        //生成map_file_name文件
        var code = createMapCode(filesMatch);
        return code;

        function getConcatFilesMatch() {
            var concFilesMath = {}; //文件合并到哪个文件
            var concFiles = null; //合并的文件
            var concTaskConf = grunt.config.get('concat');
            if (!concTaskConf) {
                grunt.log.write('没有进行合并');
            } else {
                concFiles = {};
                for (var conf in concTaskConf) {
                    var f = concTaskConf[conf].files;
                    for (var concFile in f) {
                        f[concFile].forEach(function(beConfFile) {
                            var tempFileDir = findup(beConfFile, {cwd: './'});
                            console.log(tempFileDir);
                            if (!tempFileDir) {
                                console.log('待合并的文件', beConfFile, '找不到');
                            } else {
                                beConfFile = tempFileDir;
                                concFilesMath[beConfFile] = concFile;
                                console.log(concFilesMath);
                                concFiles[concFile] = true;
                            }
                        });
                    }
                }
            }

            var summary = grunt.filerev ? grunt.filerev.summary: null;

            if (!summary) {
                grunt.log.write('没有进行md5');
            } else if (!concFiles) {
                //如果没有合并文件，那么md5的作为match
                concFilesMath = grunt.filerev.summary;
            } else {
                for (var src in summary) {
                    if (concFiles[src]) {
                        //如果是合并的文件，合并的文件，不被引用，不需要加入math
                        continue;
                    }

                    var absuluteSrc = path.resolve(src);
                    if (concFilesMath[src]) {
                        //如果该文件是被合并的文件，则修改合并文件的url
                        concFilesMath[src] = summary[concFilesMath[src]];
                    }
                    if (concFilesMath[absuluteSrc]) {
                        concFilesMath[src] = summary[concFilesMath[absuluteSrc]];
                        delete concFilesMath[absuluteSrc];
                    } else {
                        concFilesMath[src] = summary[src];
                    }
                }
            }

            return concFilesMath;
        }
        function resolvePath(concFilesMath, baseDir) {
            var resultMap = {};
            baseDir = path.normalize(baseDir);
            for (var src in concFilesMath) {
                resultMap[src.substr(baseDir.length)] = concFilesMath[src].substr(baseDir.length);

            }
            return resultMap;
        }
        function createMapCode(concFilesMath) {
            //var FETCH_TEMPLATE = 'seajs.on("fetch", function(data) {\n' + '\tvar cfm = concFilesMath;\n' + '\tfor(var beConfFile in cfm) {\n' + '\t\tdata.requestUri = data.uri.replace(beConfFile, cfm[beConfFile]);\n' + '\t\tif(data.uri !== data.requestUri) { break;}\n' + '\t};\n' + '});';
            var FETCH_TEMPLATE = '\nseajs.on("fetch", function(data) {\n' + '\tvar cfm = concFilesMath;\n' + '\tvar mod=data.uri.replace(seajs.data.base,"");\n' + '\tdata.requestUri = data.uri;\n' + '\tif(cfm[mod]){\n' + '\t\tdata.requestUri = data.uri.replace(mod, cfm[mod]);\n' + '\t}\n'   + '\t});\n';
            var code = FETCH_TEMPLATE.replace('concFilesMath', JSON.stringify(concFilesMath));
            return code;
        }

    }

};
