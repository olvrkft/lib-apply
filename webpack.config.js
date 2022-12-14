var path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    'isoline': './src/isoline.js',
    'quadtree': './src/quadtree.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'examples')
  }
};
