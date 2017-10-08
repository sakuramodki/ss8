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
    .pipe($.less({
      paths: [
        './node_modules/font-awesome/less',
        './node_modules/bootstrap-less/',
        './src/styles'
      ]
    }))
    .pipe($.cssmin())
    .pipe($.autoprefixer())
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('assets'))
});

/** cssを圧縮します */
gulp.task('cssmin', () => {
  gulp.src('assets/*.css')
  .pipe($.cssmin())
  .pipe($.rename({suffix: '.min'}))
  .pipe(gulp.dest('assets/min/'));
});

/** カスタムfontをを生成します */
gulp.task('subset', cb => {
  const texts = []
  // まずCSSを処理してcontentプロパティの値を集めます
  gulp.src(['./assets/**.css'])
    .pipe($.css2txt())
    .on('data', file => texts.push(file.contents.toString()))
    .on('end', () => {

      const text =  texts.join('')
      const formats = ['eot', 'ttf', 'woff', 'svg']

      // cssからの文字の抽出が終わったら、これをフォントファイルに適用します
      gulp.src(['./node_modules/font-awesome/fonts/fontawesome-webfont.ttf'])
        .pipe($.fontmin({ text, formats }))
        .pipe(gulp.dest('./fonts'))
        .on('end', () => cb())
    })
});

gulp.task('build', ['scripts', 'styles', 'cssmin', 'subset']);

gulp.task('watch', () => {
  bundle(true);
  gulp.watch('src/styles/**/*.less', ['styles', 'cssmin', 'subset']);
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
