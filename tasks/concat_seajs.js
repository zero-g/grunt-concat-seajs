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


    /**
     * 注册 concat_seajs 任务
     */
    grunt.registerMultiTask('concat_seajs', profile, function() {
        var options = this.options({
            map_file_name: 'fetch',
            seajs_src: '',
            cdnBase: '',
            baseDir: '',
            injectFetch: false, //fetch文件引入方式:1.true 将fetch代码注入到页面中 , 2.false 将fetch代码生成外部js进行引用
            injectSea: false, //seajs文件引入方式:1.true 将sea代码注入到页面中 , 2.false 外部js引用
            map: []
        });


        //根据map设置 可以创建不同版本的 fetch
        var codeMap = {
            'default': {}
        };

        codeMap = createMapFile(options.baseDir, options); //general

        if(options.map.length){
            options.map.forEach(function(target){
                var dest = target.dest;
                var files = target.files;
                if(dest && files.length){
                    injectFiles(dest,files,options);
                }
            })
        }

        if(options.injectFetch == true) {
            this.files.forEach(function(filePair) {
                filePair.src.forEach(function(file) {
                    //根据map设置的dest 对file做下筛选 并调整fetch内容
                    //code = mapfilter(options, file, code);
                    appendMapSourceToView(file, codeMap, options);//todo: code数据格式已经变了 需要改后续逻辑
                });
            });
        } else {
            var mapFileName = path.join(options.seajs_src, options.map_file_name); //生成fetch文件的路径
            for(var c in codeMap){
                if(c !== 'default'){
                    mapFileName = path.join(options.seajs_src, options.map_file_name, '_', codeMap[c].id); //生成fetch文件的路径
                }
                grunt.file.write(mapFileName, codeMap[c].code); //todo: code数据格式已经变了 需要改后续逻辑
                var mapFileMd5Name = md5File(mapFileName);
                codeMap[c].md5Name = mapFileMd5Name;
                grunt.log.writeln('map file for md5：', mapFileMd5Name);
            }
            this.files.forEach(function(filePair) {
                filePair.src.forEach(function(file) {
                    appendMapFileToView(file, codeMap[file].md5Name, options);
                });
            });

        }

    });

    /**
     * 根据map设置 将指定文件注入到指定页面中
     * @param viewSrc
     * @param files
     * 说明:
     *      1.js必须插入到sea的紧下面,否则会有问题
     *      2.css插入到</head>前面,并且要删除掉该页面原有的css(即将插入的)引用
     */
    function injectFiles(viewSrc,files,options){
        var filePath = path.resolve(viewSrc);
        if(!grunt.file.exists(filePath)){
            return;
        }
        var code = grunt.file.read(filePath);
        var rules = [
            {
                name: 'js',
                type: /\.js/i,
                position: /<script.*(data-seajs-config)[^<]*<\/script>/i,///<script.*(sea[^(js)]*js)[^<]*<\/script>/i,///\<\/body\>/i,
                prefix: '<script type="text/javascript">',
                postfix: '</script>'
            },
            {
                name: 'css',
                type: /\.css/i,
                position: /\<\/head\>/i,
                prefix: '<style rel="stylesheet">',
                postfix: '</style>'
            }
        ];

        files.forEach(function(file){
            rules.forEach(function(rule){
                if(rule.type.test(file)){
                    var type = rule.name;
                    var source = '';
                    var filePath = path.resolve(file);
                    if(grunt.file.exists(filePath)){
                        source = grunt.file.read(filePath);
                        if(!source){
                            return;
                        }
                    }else{
                        return;
                    }


                    var m = code.match(rule.position);
                    if (!m) {
                        return;
                    }
                    var placeholder = m[0];
                    var injectCode = rule.prefix + source + rule.postfix;
                    if(type == 'css'){
                        //注入css
                        code = code.replace(placeholder, injectCode + placeholder);

                        //找到页面中原路引入的<link>标签 并将其去掉
                        var linkTagRge = /<link.*href=(['"])([^'"]*)(\1)[^<]*(<\/link>)*/ig;
                        var result;
                        while ((result = linkTagRge.exec(code)) != null) {
                            var cssSourceLink = result[2];
                            if(cssSourceLink.search(options.cdnBase) !== -1 ){
                                cssSourceLink = cssSourceLink.replace(options.cdnBase,'');
                            }
                            if(file.search(cssSourceLink) !== -1 ){
                                code = code.replace(result[0], '');
                                break;
                            }
                        }
                    }else if(type == 'js'){
                        //注入js脚本 将seajs放置在注入js脚本上方
                        code = code.replace(placeholder, function(match){
                            return match +'\n' + injectCode + '\n';
                        });

                        //注入js脚本 需在 seajs.config声明base之后...
                        //code = code.replace(placeholder, injectCode + placeholder);
                    }

                    grunt.file.write(viewSrc, code);

                    grunt.log.writeln('---- append file to the view：', file);
                }
            });

        });

        //grunt.file.read(viewSrc);
    }

    /**
     * 生成md5文件名
     * @param file
     * @returns {string}
     */
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

    /**
     * 将 fetch代码 注入页面
     * @param viewSrc
     * @param source
     * @param options
     */
    function appendMapSourceToView(viewSrc, codeMap, options) {
        var code = grunt.file.read(viewSrc);
        var injectSea = options.injectSea;
        var cdnBase = options.cdnBase;
        var baseDir = options.baseDir;
        var source = codeMap['default']['code'];
        var seajsReg = /<script.*(sea[^(js)]*js)[^<]*<\/script>/i;
        var m = code.match(seajsReg);
        if (!m) {
            return;
        }
        for(var c in codeMap){
            if(c == viewSrc){
                source = codeMap[c].code;
                break;//可能有问题
            }
        }


        var placeholder = m[0];
        var seaScript = placeholder;
        var fetchScript = '<script type="text/javascript">' + source + '</script>';
        if(injectSea == true){
            var seaScriptSource = appendSeaJSFileToView(seaScript,cdnBase,baseDir);
            if(seaScriptSource){
                seaScript = '<script  type="text/javascript">' + seaScriptSource + '</script>';
            }
        }
        code = code.replace(placeholder, seaScript + '\n' + fetchScript);

        grunt.file.write(viewSrc, code);
        grunt.log.writeln('append fetch source to：', viewSrc);
    }


    /**
     * 将 fetch文件 注入页面
     * @param viewSrc
     * @param mapFileName
     * @param options
     */
    function appendMapFileToView(viewSrc, mapFileName, options) {
        var code = grunt.file.read(viewSrc),
            injectSea = options.injectSea,
            cdnBase = options.cdnBase,
            baseDir = options.baseDir;

        var seajsReg = /<script.*(sea[^(js)]*js)[^<]*<\/script>/i;
        var m = code.match(seajsReg);
        if (!m) {
            return;
        }
        var placeholder = m[0];
        var seaScript = placeholder;
        var fetchScript = seaScript.replace(m[1], mapFileName);
        if(injectSea == true){
            var seaScriptSource = appendSeaJSFileToView(seaScript,cdnBase,baseDir);
            if(seaScriptSource){
                seaScript = '<script type="text/javascript">' + seaScriptSource + '</script>';
            }
        }
        code = code.replace(placeholder, seaScript + '\n' + fetchScript);

        grunt.file.write(viewSrc, code);
        grunt.log.writeln('append fetch file to：', viewSrc);
    }

    /**
     * 将seajs代码内容注入页面
     * @param seaScript
     * @param cdnBase
     * @param baseDir
     * @returns {string}
     */
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

    /**
     * 生成 fetch 映射表.
     * @param baseDir
     * @param options
     * @returns {{default: {}}}
     */
    function createMapFile(baseDir, options) {

        var codeMap = {
            default: {}
        };
        var filesMatch = getConcatFilesMatch(); //获取合并文件的md5映射表
        filesMatch = resolvePath(filesMatch, baseDir); //更正路径
        //生成map_file_name文件
        codeMap.default.code = createMapCode(filesMatch);

        //根据map设置的dest 对file做下筛选 并调整fetch内容
        var map = options.map;
        if(map && map.length){
            map.forEach(function(target, index, arr){
                var dest = target.dest;
                var files = target.files;
                if(!dest){
                    return;
                }
                var filesMatch = getConcatFilesMatch(target); //将设置map配置传入生成fetch方法中
                filesMatch = resolvePath(filesMatch, baseDir); //更正路径

                //生成map_file_name文件
                codeMap[dest] = {
                    id: index,
                    dest: dest,
                    code: createMapCode(filesMatch)
                };
            })
        }
        return codeMap;

        /**
         * 根据map设置的dest 对file做下筛选 并调整fetch内容
         * @param options
         * @param dest
         * @param code
         */
        function getConcatFilesMatch(map) {
            var concFilesMath = {}; //文件合并到哪个文件
            var concFiles = null; //合并的文件
            var unConcFiles = [];//记录map设置注入到页面的js并且包含concat合并的子文件(这些文件因为要注入页面中是不能fetch进去的)
            //var dest = map.dest;
            //var files = map.files;
            var concTaskConf = grunt.config.get('concat');
            if (!concTaskConf) {
                grunt.log.write('没有进行合并');
            } else {
                concFiles = {};
                for (var conf in concTaskConf) {
                    var f = concTaskConf[conf].files;
                    for (var concFile in f) {
                        var isContinue = true;
                        //如果concat里面的合并目标文件和map里面配置的文件重合 那么则不需要将concat源文件加入到fetch map中
                        if(map && map.files){
                            map.files.forEach(function(targe){
                                if(concFile == targe){
                                    isContinue = false;
                                    unConcFiles = unConcFiles.concat(f[concFile]);
                                    return;
                                }
                            })
                        }
                        if(!isContinue){
                            continue;
                        }
                        f[concFile].forEach(function(beConfFile) {
                            var tempFileDir = findup(beConfFile, {cwd: './'}),
                                isContinueInner = true;
                            console.log(tempFileDir);
                            if (!tempFileDir) {
                                console.log('待合并的文件', beConfFile, '找不到');
                                return;
                            }
                            if(map && map.files){
                                map.files.forEach(function(targe){
                                    if(beConfFile == targe){
                                        unConcFiles.push(beConfFile);
                                        isContinueInner = false;
                                        return;
                                    }
                                })
                            }
                            if(!isContinueInner){
                                return;
                            }
                            //beConfFile = tempFileDir;
                            concFilesMath[beConfFile] = concFile;
                            console.log(concFilesMath);
                            concFiles[concFile] = true;

                        });
                    }
                }
            }

            var summary = grunt.filerev ? grunt.filerev.summary: null;

            if (!summary) {
                grunt.log.write('没有进行md5');
            } else {

                if (!concFiles) {
                    //如果没有合并文件，那么md5的作为match
                    concFilesMath = summary;
                } else {
                    for (var src in summary) {
                        if (concFiles[src]) {
                            //如果是合并的文件，合并的文件，不被引用，不需要加入math
                            continue;
                        }
                        var isContinue = true;
                        if(map && map.files){
                            map.files.forEach(function(targe){
                                if(src == targe){
                                    isContinue = false;
                                    return;
                                }
                            })
                        }
                        if(!isContinue){
                            continue;
                        }
                        if(unConcFiles.length){
                            unConcFiles.forEach(function(targe){
                                if(src == targe){
                                    isContinue = false;
                                    return;
                                }
                            })
                        }
                        if(!isContinue){
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
            }
            var concFilesMath = typeFilter(concFilesMath);

            return concFilesMath;
        }

        /**
         * 对fetch 映射表做筛选, 去除掉.jpg|.bmp|.gif|.png|.map|.css|.eot|.svg|.ttf|.woff 格式文件映射
         * @param map
         * @returns {{}}
         */
        function typeFilter(map){
            var reg = /\.(jpg|bmp|gif|png|map|css|eot|svg|ttf|woff)$/i,
                newMap = {};
            for (var src in map) {
                if(!reg.test(src)){
                    newMap[src] = map[src];
                }
            }
            return newMap;
        }

        /**
         * 对fetch 映射表做路径处理将绝对地址替换成相对地址
         * @param concFilesMath
         * @param baseDir
         * @returns {{}}
         */
        function resolvePath(concFilesMath, baseDir) {
            var resultMap = {};
            baseDir = path.normalize(baseDir);
            for (var src in concFilesMath) {
                resultMap[src.substr(baseDir.length)] = concFilesMath[src].substr(baseDir.length);

            }
            return resultMap;
        }

        /**
         * 生成fetch 映射表代码字符串
         * @param concFilesMath
         * @returns {string}
         */
        function createMapCode(concFilesMath) {
            //var FETCH_TEMPLATE = 'seajs.on("fetch", function(data) {\n' + '\tvar cfm = concFilesMath;\n' + '\tfor(var beConfFile in cfm) {\n' + '\t\tdata.requestUri = data.uri.replace(beConfFile, cfm[beConfFile]);\n' + '\t\tif(data.uri !== data.requestUri) { break;}\n' + '\t};\n' + '});';
            var FETCH_TEMPLATE = '\nseajs.on("fetch", function(data) {\n' + '\tvar cfm = concFilesMath;\n' + '\tvar mod=data.uri.replace(seajs.data.base,"");\n' + '\tdata.requestUri = data.uri;\n' + '\tif(cfm[mod]){\n' + '\t\tdata.requestUri = data.uri.replace(mod, cfm[mod]);\n' + '\t}\n'   + '\t});\n';
            var code = FETCH_TEMPLATE.replace('concFilesMath', JSON.stringify(concFilesMath));
            return code;
        }

    }

};
