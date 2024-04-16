const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const dev = process.env.NODE_ENV !== 'production'

module.exports = {
    mode: dev ? 'development' : 'production',
    devtool: dev ? 'eval-source-map' : 'source-map',
    entry: {
        index: path.resolve(__dirname, 'src', 'main.js'), 
        // project: './src/templates/project/index.js', // entry for project template
        basicdistortions: './src/templates/basicdistortions/index.js', 
        curlnoise: './src/templates/curlnoise/index.js', 
        sculpture: './src/templates/sculpture/index.js',
        videointoparticles: './src/templates/video/index.js', 
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js',
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    devServer: {
        contentBase: path.resolve(__dirname, 'public'),
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'public', 'index.html'), // template for index
            chunks: ['index'], // Specify the chunks for this HTML file
        }),
        new HtmlWebpackPlugin({
            template: './src/templates/curlnoise/index.html',
            chunks: ['curlnoise'],
            filename: 'curlnoise.html',
        }),
        new HtmlWebpackPlugin({
            template: './src/templates/basicdistortions/index.html', 
            chunks: ['basicdistortions'], 
            filename: 'basicdistortions.html', 
        }),
        new HtmlWebpackPlugin({
            template: './src/templates/sculpture/index.html', 
            chunks: ['sculpture'], 
            filename: 'sculpture.html',
        }),
        new HtmlWebpackPlugin({
            template: './src/templates/video/index.html', 
            chunks: ['videointoparticles'], 
            filename: 'videointoparticles.html',
        }),
        // Example
        // new HtmlWebpackPlugin({
        //     template: './src/templates/project/index.html', // Template for project
        //     chunks: ['project'], // Specify the chunks for this HTML file
        //     filename: 'project', // Output filename
        // }),
    ],
    module: {
        rules: [
            {
                test: /\.jsx$/,
                exclude: /node_modules/,
                use: 'babel-loader',
            },
            {
                test: /\.scss$/,
                exclude: /node_modules/,
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: 'url-loader?mimetype=image/png',
            },
            {
                test: /\.(glsl|vs|fs|vert|frag)$/,
                exclude: /node_modules/,
                use: ['raw-loader', 'glslify-loader'],
            },
            {
                test: /\.(glb|gltf)$/,
                use: [{ loader: 'file-loader', options: { outputPath: '3d/models/' }}]
            },
        ],
    },
}
