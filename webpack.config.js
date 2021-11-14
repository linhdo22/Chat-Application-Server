const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const BundleAnalyzerPlugin =
	require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const plugins = [new MiniCssExtractPlugin()]
if (process.env.ANALYZER) {
	plugins.push(new BundleAnalyzerPlugin())
}

const mode = process.env.MODE
module.exports = {
	mode: mode,
	plugins: plugins,
	entry: ['@babel/polyfill', '/public/modules/core/components/index.jsx'],
	output: {
		filename: '[name].js',
		chunkFilename: '[name].js',
		path: path.resolve(__dirname, 'public/dist'),
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /(node_modules|bower_components)/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env', '@babel/preset-react'],
					},
				},
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.scss$/,
				use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
			},
		],
	},
	optimization: {
		splitChunks: {
			cacheGroups: {
				default: false,
				vendors: false,
				vendor: {
					chunks: 'all',
					test: /node_modules/,
					name: 'vendor',
				},
			},
		},
	},
}
