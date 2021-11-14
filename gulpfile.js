const gulp = require('gulp')
const nodemon = require('gulp-nodemon')
const paths = {
	serverJS: ['server.js', 'app/', 'config'],
}

function runServer() {
	return nodemon({
		script: 'server.js',
		nodeArgs: ['--inspect'],
		watch: [...paths.serverJS],
		ext: 'cjs,js,html,jsx',
	})
}

exports.default = runServer
