const gulp = require('gulp');
const del = require('del');
const workboxBuild = require('workbox-build');

// Clean "build" directory
const clean = () => {
    return del(['build/*'], { dot: true });
};
gulp.task('clean', clean);

// Copy "app" directory to "build" directory
const copy = () => {
    return gulp.src(['app/**/*']).pipe(gulp.dest('build'));
};
gulp.task('copy', copy);

// Inject a precache manifest into the service worker
const serviceWorker = () => {
    return workboxBuild.injectManifest({
        swSrc: 'app/sw.js',
        swDest: 'build/sw.js',
        globDirectory: 'build',
        globPatterns: [
            'style/main.css',
            'index.html',
            'js/idb-promised.js',
            'js/main.js',
            'images/**/*.*',
            'manifest.json'
        ]
    }).then(resources => {
        console.log(`Injected ${resources.count} resources for precaching, ` +
            `totaling ${resources.size} bytes.`);
    }).catch(err => {
        console.log('Uh oh 😬', err);
    });
}
gulp.task('service-worker', serviceWorker);

// This is the app's build process
const build = gulp.series('clean', 'copy', 'service-worker');
gulp.task('build', build);

// Watch our "app" files & rebuild whenever they change
const watch = () => {
    gulp.watch('app/**/*', build);
};
gulp.task('watch', watch);

// Set the default task to "build"
gulp.task('default', build);