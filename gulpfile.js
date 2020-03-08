const path = require('path');
const fs = require('fs');

const argv = require('yargs').argv;

const gulp = require('gulp');
const clean = require('gulp-clean');
const cleanCSS = require('gulp-clean-css');
const gls = require('gulp-live-server');
const ifCondition = require('gulp-if');
const inject = require('gulp-inject-string');
const postcss = require('gulp-postcss');
const rename = require('gulp-rename');
const replace = require('gulp-replace');

const es = require('event-stream');

const rework = require('rework');
const pureGrids = require('rework-pure-grids');

const cssRoot = './src/css';

function remove(assets) {
    if (!Array.isArray(assets)) throw error('no assets defined to clean');

    return gulp.src(assets, { allowEmpty: true, read: false })
        .pipe(clean());
}

function buildImages() {
    return gulp.src(['./public/images/**'], { allowEmpty: true })
        .pipe(gulp.dest('./wwwroot/images'));
}

function buildFonts() {
    return gulp.src(['./node_modules/@fortawesome/fontawesome-free/webfonts/**'], { allowEmpty: true })
        .pipe(gulp.dest('./wwwroot/fonts'));
}

function buildCssLib() {
    let isMinified = argv.minify;

    return gulp
        .src(['./node_modules/@fortawesome/fontawesome-free/css/all.css'], { allowEmpty: true })
        .pipe(postcss([
            require('postcss-replace')({
                'pattern': /(webfonts)/g,
                'data': { 'webfonts': 'fonts' }
            })
        ]))
        .pipe(ifCondition(isMinified, cleanCSS()))
        .pipe(rename('lib.css'))
        .pipe(gulp.dest('./wwwroot/css'));
}

function getThemePath(theme) {
    let themePath = path.join(cssRoot, theme);

    if (fs.existsSync(themePath)) return themePath;
    else return null;
}

function compileThemeStream(theme, isMinified) {
    if (!theme) throw error('theme argument expects a value');

    let themePath = getThemePath(theme);
    if (!fs.existsSync(themePath)) throw error('invalid theme argument');

    let gridResponsiveCss = rework('')
        .use(pureGrids.units({
            mediaQueries: {
                xs: 'screen and (min-width: 320px)',
                sm: 'screen and (min-width: 768px)',
                md: 'screen and (min-width: 1024px)',
                lg: 'screen and (min-width: 1280px)',
                xl: 'screen and (min-width: 1680px)'
            }
        }))
        .toString();

    return gulp
        .src(path.join(themePath, 'theme.pcss'), { allowEmpty: true })
        .pipe(inject.append('\n\n' + '/* responsive grids */' + '\n\n' + gridResponsiveCss))
        .pipe(postcss([
            require('autoprefixer')({ grid: 'autoplace', overrideBrowserslist: ['>1%'] }),
            require('postcss-import-ext-glob'),
            require('postcss-import'),
            require('precss'),
            require('postcss-calc'),
            require('postcss-color-function')
        ]))
        .pipe(rename('purecss-ui-' + theme + '.css'))
        .pipe(ifCondition(isMinified, cleanCSS()))
        .pipe(gulp.dest('./wwwroot/css'));
}

function compileThemes(themes, isMinified) {
    if (!Array.isArray(themes)) throw error('themes argument expects an array');

    let theme = themes.shift();
    if (!theme) Promise.resolve();

    return new Promise((resolve, reject) => {
        compileThemeStream(theme, isMinified)
            .on('end', () => {
                console.log(theme + '.css');

                if (themes.length) {
                    compileThemes(themes, isMinified)
                        .then(() => {
                            resolve();
                        });
                } else {
                    resolve();
                }
            });
    });
}

function findThemes() {
    let themes = [];

    if (fs.existsSync(cssRoot) && fs.statSync(cssRoot).isDirectory()) {
        fs.readdirSync(cssRoot).forEach(theme => {
            let themePath = path.join(cssRoot, theme);
            if (fs.statSync(themePath).isDirectory()) themes.push(theme);
        });
    }

    return themes;
}

function buildTheme(resolve) {
    let themes = argv.theme ? [argv.theme] : findThemes();
    let isMinified = argv.minify;

    compileThemes(themes, isMinified)
        .then(() => {
            resolve();
        })
        .catch((err) => {
            resolve(error(err));
        });
}

function buildDist(resolve) {
    let themes = findThemes();

    compileThemes(themes, false)
        .then(() => {
            es.merge([
                gulp.src(['./wwwroot/css/purecss-ui-*.css'], { allowEmpty: true })
                    .pipe(gulp.dest('./dist')),
                gulp.src(['./wwwroot/css/purecss-ui-*.css'], { allowEmpty: true })
                    .pipe(cleanCSS())
                    .pipe(rename(function(path) {
                        return {
                            dirname: path.dirname,
                            basename: path.basename + '.min',
                            extname: '.css'
                        };
                    }))
                    .pipe(gulp.dest('./dist'))
            ]).on('end', resolve);
        })
        .catch((err) => {
            resolve(error(err));
        });
}

function watch() {
    let env = argv.env || 'development';
    let server = gls('app.js', { env: { NODE_ENV: env } });

    server.start();

    let views = ['./index.html'];
    gulp.watch(views, function reloadHTML() {
        return gulp.src(views, { allowEmpty: true }).pipe(server.notify());
    });

    let css = ['./src/css/**/*'];
    gulp.watch(css, function reloadCSS() {
        return es.merge(compileThemeStream('default'), compileThemeStream('dark')).pipe(server.notify());
    });

    let app = ['./app.js'];
    gulp.watch(app, function reloadApp() {
        server.start.bind(server)();
    });
}

function error(err) {
    return new Error(err);
}

function buildGhpages(resolve) {
    return es.merge([
        gulp.src(['./wwwroot/css/*.css'], { allowEmpty: true })
            .pipe(cleanCSS())
            .pipe(gulp.dest('./public/css')),
        gulp.src(['./node_modules/@fortawesome/fontawesome-free/webfonts/**'], { allowEmpty: true })
            .pipe(gulp.dest('./public/fonts')),
        gulp.src(['./index.html'], { allowEmpty: true })
            .pipe(replace('href="/"', 'href="/purecss-ui/"'))
            .pipe(replace('"css/', '"public/css/'))
            .pipe(replace('"fonts/', '"public/fonts/'))
            .pipe(replace('"images/', '"public/images/'))
            .pipe(gulp.dest('./'))
    ]).on('end', resolve);
}

exports['clean:dev'] = remove.bind(this, ['wwwroot/*']);
exports['clean:dist'] = remove.bind(this, ['dist/*']);

exports['clean'] = gulp.parallel(
    remove.bind(this, ['wwwroot/*']),
    remove.bind(this, ['dist/*'])
);

exports['build:images'] = buildImages;
exports['build:fonts'] = buildFonts;

exports['build:csslib'] = buildCssLib;
exports['build:theme'] = buildTheme;

exports['build:css'] = gulp.series(
    buildCssLib,
    buildTheme
);

exports['build:dev'] = gulp.series(
    remove.bind(this, ['wwwroot/*']),
    buildCssLib,
    buildImages,
    buildFonts,
    buildTheme
);

exports['build:dist'] = gulp.series(
    remove.bind(this, ['dist/*']),
    buildDist
);

exports['watch'] = watch;

exports['build:ghpages'] = gulp.series(
    remove.bind(this, ['wwwroot/*', 'public/css/*', 'public/fonts/*']),
    buildCssLib,
    buildTheme,
    buildGhpages
);