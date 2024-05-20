const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const plugins = [
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
];

module.exports = plugins;
