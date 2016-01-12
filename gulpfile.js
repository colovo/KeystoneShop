var gulp = require('gulp');
var jshint = require('gulp-jshint');
var jshintReporter = require('jshint-stylish');
var watch = require('gulp-watch');
var shell = require('gulp-shell')
var watchify = require('watchify')
var browserify = require('browserify')
var babelify = require('babelify')
var chalk = require('chalk')

var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')
var merge = require('utils-merge')
var rename = require('gulp-rename')
var sourcemaps = require('gulp-sourcemaps')
var uglify = require('gulp-uglify')
var gutil = require('gulp-util')

var stylus = require('gulp-stylus')
var nib = require('nib')

var publicJS = 'public/js'
var jsxPath = '/src/jsx'

var paths = {
	'src':['./models/**/*.js','./routes/**/*.js', 'keystone.js', 'package.json']

,
	'style': {
		main: './public/styles/site.styl',
		all: './public/styles/**/*.styl',
		output: './public/styles/'
	}

};

// gulp lint
gulp.task('lint', function(){
	gulp.src(paths.src)
		.pipe(jshint())
		.pipe(jshint.reporter(jshintReporter));
});

// gulp watcher for lint
gulp.task('watch:lint', function () {
	gulp.watch(paths.src, ['lint']);
});


gulp.task('watch:stylus', function () {
	gulp.watch(paths.style.all, ['stylus']);
});

gulp.task('stylus', function () {
	gulp.src(paths.style.main)
		.pipe(stylus({
      use: nib()
    }))
		.pipe(gulp.dest(paths.style.output));
});


gulp.task('runKeystone', shell.task('node keystone.js'));
gulp.task('watch', [

  'watch:stylus',

  'watch:lint'
]);

// Watchify
gulp.task('watchify', function () {
    var args = merge(watchify.args, { debug: true })
    var bundler = watchify(browserify('.' + jsxPath + '/cart.jsx', args)).transform(babelify, { presets: ['es2015', 'react'] })
    bundle_js(bundler)

    bundler.on('update', function () {
        bundle_js(bundler)
    })
})

function bundle_js(bundler) {
  return bundler.bundle()
    .on('error', map_error)
    .pipe(source('cart.js'))
    .pipe(buffer())
    .pipe(gulp.dest(publicJS))
    .pipe(rename('cart.min.js'))
    .pipe(sourcemaps.init({ loadMaps: true }))
      // capture sourcemaps from transforms
      .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(publicJS))
}

// Color errors with chalk
function map_error(err) {
  if (err.fileName) {
    // regular error
    gutil.log(chalk.red(err.name)
      + ': '
      + chalk.yellow(err.fileName.replace(__dirname + jsxPath + '/', ''))
      + ': '
      + 'Line '
      + chalk.magenta(err.lineNumber)
      + ' & '
      + 'Column '
      + chalk.magenta(err.columnNumber || err.column)
      + ': '
      + chalk.blue(err.description))
  } else {
    // browserify error..
    gutil.log(chalk.red(err.name)
      + ': '
      + chalk.yellow(err.message))
  }

  if (this.end) {
      this.end()
  }
}


gulp.task('default', ['watch', 'watchify', 'runKeystone']);

