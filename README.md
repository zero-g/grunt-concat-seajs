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

#### options.view_src
Type: `String`

The path of the view which contain seajs file is used to insert the concat math file of seajs.

#### options.seajs_src
Type: `String`

The path of seajs file is used to be the path of the match file.

### Usage Examples

#### Custom Options
In this example, custom options are used to do something else with whatever else. 
So if the `concat` config concat the files and `filerev` make files md5, the generated result would be genarate a match file in `seajs_src`. At the same time, the match file would be insert to the `view_src`.  

```js
grunt.initConfig({
  concat_seajs: {
    options: {
          seajs_src: 'js/lib/',
          view_src: '../views/index.php'
    }
  },
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
