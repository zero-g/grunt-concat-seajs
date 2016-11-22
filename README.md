# grunt-concat-seajs

> If you combine a seajs project file, this task can be used with the seajs module to load the corresponding.

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-concat-seajs --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-concat-seajs');
```

## The "concat_seajs" task

### Overview
In your project's Gruntfile, add a section named `concat_seajs` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  concat_seajs: {
    options: {
      // Task-specific options go here.
    }
  },
});
```

### Options

#### baseDir
Type: `String`

Building the project then generate the destination path, fllowing this path is to find the file content for injecting the aim files.

#### seajs_src
Type: `String`

The path of seajs file is used to be the path of the match file.

#### map_file_name
Type: `String`
Default: `fetch.js`

This is the seajs fetch file name.

#### cdnBase
Type: `String`

If you static source put on the cdn service before you publish your project,you should config this param.

#### injectFetch
Type: `Boolean`
Default: `false`

Turns on injectFetch of the generated source code. the seajs fetch file will inject to the views which you config.

#### injectSea
Type: `Boolean`
Default: `false`

Turns on injectFetch of the generated source code. the seajs file will inject to the views which you config.

#### map
Type: `Array`
Default: `[]`
Param: `dest` , `files`

If you want to inject different js/css for individual pages, you can use this property,Any page can be configured individually.


### Usage Examples

#### Custom Options
In this example, custom options are used to do something else with whatever else.
So if the `concat` config concat the files and `filerev` make files md5, the generated result would be genarate a match file in `seajs_src`. At the same time, the match file would be insert to the `view_src`.

```js
grunt.initConfig({
  concat_seajs: {
    options: {
            map_file_name: 'fetch.js',
            seajs_src: '',
            cdnBase: 'http://s.geilicdn.com/',
            baseDir: 'dist/',
            injectFetch: true,
            injectSea: true,
            map: [{
                      'dest': path.join(config.releaseDir ,'pages/index.html'),
                      'files': [
                          path.join(config.releaseDir , 'js/common.min.js'),
                          path.join(config.releaseDir , 'js/index.min.js')
                      ]
                  }]
    }
  },
});
```
#### The most Important part
This is a very critical step！Please pay attention to this step.
It's will need you to do some simple configuration in your pages：
You have to separate the seajs.config part and the seajs.use part to two different <script>. And ensure that <script> reference should be follow this order.

```html
<script src="js/base/sea.js"></script>
<script type="text/javascript" data-seajs-config="true">
    seajs.config({
        base: '',
        charset : 'utf-8'
    });
</script>
<script type="text/javascript">
    seajs.use('js/index',function(index){
        index.init();
        ...
    });
</script>```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
- 2016 11.22   -v1.0.20   -Bug fixed. use htmlmin plugin's bug.
- 2016 10.11   -v1.0.19   -Bug fixed. Fix fetch map absolute path bug.
- 2016 9.20   -v1.0.16   -Support part of file inject to the pages & process the fetch map.
- 2016 9.7   -v1.0.15   -Add fethc map filter ,static files do not appear to the fetch map.
  eg: .jpg|.bmp|.gif|.png|.map|.css|.eot|.svg|.ttf|.woff
- 2016 9.2   -v1.0.13   -Fix no concat file fetch error bug,and Update readme.md.
- 2016 8.30   -v1.0.12   -Fix get filerev map bug, and add inject fetch/seajs file into pages feature.
