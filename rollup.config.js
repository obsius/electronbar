import babel from 'rollup-plugin-babel';

export default {
	input: 'src/Electronbar.js',
	output: {
		file: 'lib/Electronbar.js',
		format: 'cjs'
	},
	plugins: [
		babel({
			exclude: 'node_modules/**'
		})
	]
};