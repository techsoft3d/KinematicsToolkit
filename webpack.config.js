const path = require('path');

module.exports = {
  entry: './dev/js/kinematicsToolkit/kt.js',
  mode: "production",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'kinematicsToolkit.min.js',
    library: 'KT', //add this line to enable re-use
  },
};
