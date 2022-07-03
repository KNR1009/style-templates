const gulp = require("gulp");
const pug = require("gulp-pug");
const sass = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const cssmin = require("gulp-cssmin");
const uglify = require("gulp-uglify");
const browsersync = require("browser-sync");
const notify = require("gulp-notify");
const plumber = require("gulp-plumber");
const del = require("del");
const merge = require("merge-stream");
// コード整形
const htmlbeautify = require("gulp-html-beautify");
// 画像圧縮
const imageMin = require("gulp-imagemin");
const pngquant = require("imagemin-pngquant");
const changed = require("gulp-changed");
const mozjpeg = require("imagemin-mozjpeg");

const paths = {
  src: "src",
  dest: "dest",
};

// src/pug/destディレクトリへ
gulp.task("html", function () {
  var index = gulp
    .src([paths.src + "/pug/index.pug"])
    .pipe(
      plumber({
        errorHandler: notify.onError("Error: <%= error.message %>"),
      })
    )
    .pipe(pug({ pretty: true }))
    .pipe(
      htmlbeautify({
        // インデント幅
        indent_size: 2,
        // インデントに使う文字列
        indent_char: " ",
        // 改行を削除する
        max_preserve_newlines: 0,
        preserve_newlines: false,
        extra_liners: [],
      })
    )
    .pipe(gulp.dest(paths.dest + "/"));

  // 出力すべき変数を格納
  return merge(index);
});

//Sassをコンパイルしdest/cssディレクトリに出力
gulp.task("css", function () {
  var css = gulp
    .src([paths.src + "/sass/index.scss"])
    .pipe(
      plumber({
        errorHandler: notify.onError("Error: <%= error.message %>"),
      })
    )
    .pipe(
      sass({
        outputStyle: "expanded",
      })
    )
    .pipe(
      autoprefixer({
        overrideBrowserslist: "last 2 versions",
      })
    )
    .pipe(cssmin())
    .pipe(gulp.dest(paths.dest + "/assets/styles/"));

  return merge(css);
});

// jsの圧縮
gulp.task("js", function () {
  var js = gulp
    .src(paths.src + "/js/**")
    .pipe(uglify())
    .pipe(gulp.dest(paths.dest + "/assets/scripts/"));

  return merge(js);
});

/* 画像圧縮 */
gulp.task("image", function () {
  var image = gulp
    .src(paths.src + "/images/**")
    // 一度圧縮した画像を再度圧縮しないようにする
    .pipe(changed("./dest/assets/images/"))
    .pipe(
      imageMin([
        pngquant({
          // 追加
          quality: [0.6, 0.7],
          speed: 1,
        }),
        mozjpeg({ quality: 65 }),
        imageMin.svgo(),
        imageMin.optipng(),
        imageMin.gifsicle({ optimizationLevel: 3 }),
      ])
    )
    .pipe(gulp.dest(paths.dest + "assets/images"));

  return merge(image);
});

//Browser Sync
gulp.task("browser-sync", function (done) {
  browsersync({
    server: {
      //ローカルサーバー起動
      baseDir: paths.dest,
    },
  });
  done();
});

//保存時に自動でリロード
gulp.task("watch", function () {
  const reload = () => {
    browsersync.reload(); //リロード
  };
  gulp.watch(paths.src + "/sass/**/*").on("change", gulp.series("css", reload));
  gulp.watch(paths.src + "/pug/**/*").on("change", gulp.series("html", reload));
  gulp.watch(paths.src + "/js/**/*").on("change", gulp.series("js", reload));
  gulp
    .watch(paths.src + "/images/**/*")
    .on("change", gulp.series("image", reload));
});

//destディレクトリ配下を全て削除
gulp.task("clean", function (done) {
  del.sync(paths.dest + "/**", "！" + paths.dest);
  done();
});

//Default
gulp.task(
  "default",
  gulp.series(
    "clean",
    gulp.parallel("html", "css", "js", "image", "watch", "browser-sync")
  )
);
