import babel from 'rollup-plugin-babel';

export default {
	external: [
		'react',
		'react-dom'
	],
	input: 'src/Electronbar.js',
	output: {
		file: 'lib/index.js',
		format: 'cjs'
	},
	plugins: [
		babel({
			exclude: 'node_modules/**'
		})
	]
};