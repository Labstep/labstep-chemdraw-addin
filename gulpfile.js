const gulp = require('gulp');
const zip = require('gulp-zip');
const fs = require('fs');

const files = fs.readdirSync('dist');

gulp.task('default', () =>
	gulp.src('src/*')
		.pipe(zip(`labstep${files.length}.chemdrawaddin`))
		.pipe(gulp.dest('dist'))
);