const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const plugins = [
    // webpack-dev-server exposes `public/` directly, but production builds
    // only publish `dist/`. Keep the video URLs identical in both environments.
    new CopyPlugin({
        patterns: [
            {
                from: path.resolve(__dirname, 'public', 'video'),
                to: 'video',
            },
        ],
    }),
    new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'public', 'index.html'), // template for index
        chunks: ['index'], // Specify the chunks for this HTML file
    }),
    new HtmlWebpackPlugin({
        template: './src/templates/rgbshift/index.html',
        chunks: ['rgbshift'],
        filename: 'rgbshift.html',
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
    new HtmlWebpackPlugin({
        template: './src/templates/video2/index.html',
        chunks: ['videointoparticles2'],
        filename: 'videointoparticles2.html',
    }),
    new HtmlWebpackPlugin({
        template: './src/templates/triangles/index.html', 
        chunks: ['triangles'], 
        filename: 'triangles.html',
    }),
    new HtmlWebpackPlugin({
        template: './src/templates/stippling/index.html',
        chunks: ['stippling'],
        filename: 'stippling.html',
    }),
    new HtmlWebpackPlugin({
        template: './src/templates/noiseandpoints/index.html',
        chunks: ['noiseandpoints'],
        filename: 'noiseandpoints.html',
    }),

];

module.exports = plugins;
