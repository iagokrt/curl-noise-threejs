const path = require('path');

const entries = {
    index: path.resolve(__dirname, 'src', 'main.js'), 
    basicdistortions: './src/templates/basicdistortions/index.js', 
    curlnoise: './src/templates/curlnoise/index.js', 
    sculpture: './src/templates/sculpture/index.js',
    videointoparticles: './src/templates/video/index.js',    triangles: './src/templates/triangles/index.js',

};

module.exports = entries;
