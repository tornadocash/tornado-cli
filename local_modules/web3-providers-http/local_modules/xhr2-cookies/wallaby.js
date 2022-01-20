module.exports = function (wallaby) {
	return {
		files: ['**/*.ts', '*.ts', '!test/**/*'],
		tests: ['test/**/*.ts'],
		env: {type: 'node'},
		testFramework: 'ava',
		recycle: true,
		name: 'XMLHttpRequest 2+',
		slowTestThreshold: 300,
		reportUnhandledPromises: false,
		workers: {
			// initial: 1,
			// regular: 1,
			recycle: true
		},
		compilers: {
			'**/*.ts': wallaby.compilers.typeScript({
				target: 'es2015',
				module: 'commonjs',
				sourceMap: true,
				experimentalDecorators: true,
				emitDecoratorMetadata: true,
				lib: ['es5', 'es6', 'es2016', 'es2017', 'dom']
			})
		}
	}
};
