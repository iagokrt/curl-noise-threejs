const path = require('path');

const entries = {
    index: path.resolve(__dirname, 'src', 'main.js'), 
    rgbshift: './src/templates/rgbshift/index.js',
    basicdistortions: './src/templates/basicdistortions/index.js', 
    curlnoise: './src/templates/curlnoise/index.js', 
    sculpture: './src/templates/sculpture/index.js',
    videointoparticles: './src/templates/video/index.js',
    videointoparticles2: './src/templates/video2/index.js',
    triangles: './src/templates/triangles/index.js',
    stippling: './src/templates/stippling/index.js',
    noiseandpoints: './src/templates/noiseandpoints/index.js',

};

module.exports = entries;
