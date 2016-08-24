var gulp = require('gulp');

var gulpLoadPlugins = require('gulp-load-plugins');
var p = gulpLoadPlugins();
var runSeq = require('run-sequence');

var src = 'src/';
var dest = 'dist/';

// ===== REPORTS ==================================================================================

var plumberError = function(type) {
    return p.plumber({
        errorHandler: p.notify.onError(type + ' Error: <%= error.message %>')
    })
};

var notify = function(title, message) {
    return p.notify({
        title: title,
        message: message,
        onLast: true
    });
};

// ===== FUNCTIONS ================================================================================

var jade = function() {
    return gulp
        .src(['**/*.jade', '!includes/*.jade', '!partials/*.jade'], {
            cwd: src + 'jades',
        })
        .pipe(plumberError('Jade'))
        .pipe(p.jade())
        .pipe(gulp.dest(dest));
};

var sass = function(outputStyle) {
    var sassOptions = {
        outputStyle: outputStyle
    };

    var autoprefixerOptions = {
        browsers: ['last 2 version', 'ie 9']
    };

    return gulp
        .src('style.scss', {
            cwd: src + 'sass'
        })
        .pipe(plumberError('Sass'))
        .pipe(p.sass(sassOptions))
        .pipe(p.autoprefixer(autoprefixerOptions))
        .pipe(gulp.dest(dest + 'css'));
};

var coffee = function() {
    var lintOptions = {
        'max_line_length': {
            'level': 'ignore'
        },
        'indentation': {
            'value': 4
        }
    };
    var coffeeOptions = {
        join: true
    };

    return gulp
        .src('**/*.coffee', {
            cwd: src + 'coffee'
        })
        .pipe(plumberError('Coffee'))
        .pipe(p.coffeelint(null, lintOptions))
        .pipe(p.coffeelint.reporter())
        .pipe(p.sourcemaps.init())
        .pipe(p.concat('app.js'))
        .pipe(p.coffee(coffeeOptions))
        .pipe(p.sourcemaps.write('../maps'))
        .pipe(gulp.dest(dest + 'js'));
};

var copy = function() {
    return gulp
        .src('*.*', {
            cwd: src
        })
        .pipe(plumberError('Copy'))
        .pipe(gulp.dest(dest));
};

var copyJson = function() {
    return gulp
        .src('*.json', {
            cwd: src + 'jsons'
        })
        .pipe(plumberError('Copy'))
        .pipe(gulp.dest(dest + 'jsons'));
}

var libs = function() {
    return gulp
        .src('*.js', {
            cwd: src + 'libs'
        })
        .pipe(plumberError('Copy'))
        .pipe(gulp.dest(dest + 'libs'));
}

var css = function() {
    return gulp
        .src('*.css', {
            cwd: src + 'css'
        })
        .pipe(plumberError('Copy'))
        .pipe(gulp.dest(dest + 'css'));
}

var watch = function() {
    p.livereload.listen();

    gulp.watch(src + '*', ['copy']);
    gulp.watch(src + '/jades/**/*.jade', ['jade']);
    gulp.watch(src + 'coffee/**/*.coffee', ['coffee']);
    gulp.watch(src + 'sass/**/*.scss', ['sass']);
    gulp.watch(src + 'jsons/*.json', ['copy-json']);

    gulp.watch(dest + '**/*').on('change', p.livereload.changed);
};

var imagemin = function() {

    var options = {
        svgoPlugins: [{
            removeViewBox: true
        }, {
            removeUselessStrokeAndFill: true
        }, {
            cleanupIDs: false
        }]
    };

    return gulp
        .src('**/*.{png,jpg,jpeg,gif,svg}', {
            cwd: src + '/images'
        })
        .pipe(p.imagemin(options))
        .pipe(gulp.dest(dest + 'images'));
};

gulp.task('connect', function() {
    p.connect.server({
        root: dest,
        port: 1337
    });
});

// ===== TASKS ====================================================================================

gulp.task('jade', jade);
gulp.task('coffee', coffee);
gulp.task('copy', copy);
gulp.task('watch', watch);
gulp.task('imagemin', imagemin);
gulp.task('copy-json', copyJson);
gulp.task('libs', libs);
gulp.task('css', css);

gulp.task('sass', function() {
    return sass('expanded');
});

gulp.task('dev', function() {
    runSeq(['copy', 'jade', 'coffee', 'sass', 'imagemin', 'copy-json', 'libs', 'css'], 'connect', 'watch');
});
