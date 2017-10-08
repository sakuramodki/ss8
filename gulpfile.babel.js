import gulp from 'gulp';
import browserify from 'browserify';
import babelify from 'babelify';
import watchify from 'watchify';
import buffer from 'vinyl-buffer';
import source from 'vinyl-source-stream';
import browserSync from 'browser-sync';

import gulpLoadPlugins from 'gulp-load-plugins';
const $ = gulpLoadPlugins();

function bundle(watching = false) {
  const b = browserify({
    entries: ['src/scripts/main.js'],
    transform: ['babelify'],
    debug: true,
    plugin: (watching) ? [watchify] : null
  })
  .on('update', () => {
    bundler();
    console.log('scripts rebuild');
  });

  function bundler() {
    return b.bundle()
      .on('error', (err) => {
        console.log(err.message);
      })
      .pipe(source('scripts.js'))
      .pipe(buffer())
      .pipe($.sourcemaps.init({loadMaps: true}))
      .pipe($.uglify())
      .pipe($.sourcemaps.write('./'))
      .pipe(gulp.dest('assets/'));
  }

  return bundler();
}

gulp.task('scripts', () => {
  bundle();
});

gulp.task('styles', () => {
  gulp.src(`src/styles/**/*.less`)
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.less())
    .pipe($.cssmin())
    .pipe($.autoprefixer())
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('assets'))
});

gulp.task('cssmin', () => {
  gulp.src('assets/*.css')
  .pipe($.cssmin())
  .pipe($.rename({suffix: '.min'}))
  .pipe(gulp.dest('assets/'));
});

gulp.task('build', ['scripts', 'styles', 'cssmin']);

gulp.task('watch', () => {
  bundle(true);
  gulp.watch('src/styles/**/*.less', ['styles', 'cssmin']);
});

gulp.task('server', ['watch'], () => {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: '.'
    }
  });

  gulp.watch([
    '**/*.html',
    '**/*.php',
    'assets/**/*.css',
    'assets/**/*.js'
  ]).on('change', browserSync.reload);
});

gulp.task('default', ['build', 'server']);
