var watchify = require('watchify');
var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var assign = require('lodash.assign');
var del = require('del');

var dir = {
  dev: './src/',
  prod: './dist/'
};

gulp.task('default', ['clean'], function() {
  gulp.start('cname', 'scripts', 'styles', 'html');
});

// add custom browserify options here
var customOpts = {
  entries: [dir.dev + 'scripts/main.js'],
  debug: true
};
var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts)); 

// add transformations here
// i.e. b.transform(coffeeify);

gulp.task('scripts', bundle); // so you can run `gulp js` to build the file
b.on('update', bundle); // on any dep update, runs the bundler
b.on('log', gutil.log); // output build logs to terminal

function bundle() {
  return b.bundle()
    // log errors if they happen
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('bundle.js'))
    // optional, remove if you don't need to buffer file contents
    .pipe(buffer())
    // optional, remove if you dont want sourcemaps
    .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
       // Add transformation tasks to the pipeline here.
    .pipe(sourcemaps.write('./')) // writes .map file
    .pipe(gulp.dest(dir.prod + 'scripts/'));
}

gulp.task('cname', function() {
  return gulp.src('CNAME')
    .pipe(gulp.dest(dir.prod));
});

gulp.task('html', function() {
  return gulp.src(dir.dev + '*.html')
    //.pipe(minifyHTML())
    .pipe(gulp.dest(dir.prod));
});

gulp.task('styles', function() {
  return gulp.src(dir.dev + 'styles/*.css')
    .pipe(gulp.dest(dir.prod + 'styles/'));
});

gulp.task("clean", function(cb) {
  return del(dir.prod, cb);
});