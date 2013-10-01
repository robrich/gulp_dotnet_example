/*jshint node:true */

var gulp = require('gulp');

gulp.task('clean', function(){
	console.log('clean');
});

gulp.task('version', function(){
	console.log('version');
});

gulp.task('build', ['clean','version'], function(){
	console.log('build');
});

gulp.task('test', ['build'], function(){
	console.log('test');
});

// If you're going to deploy without build and test you probably have a good reason
gulp.task('deploy', function(){
	console.log('deploy');
});

// default task gets called when you run the `gulp` command
gulp.task('default', function(){
	gulp.run('clean', 'version', 'build', 'test', 'deploy');
});
