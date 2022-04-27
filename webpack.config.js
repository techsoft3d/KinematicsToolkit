const path = require('path');

module.exports = {
  entry: './dev/js/kinematicsManager/km.js',
  mode: "production",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'kinematicsManager.bundle.js',
    library: 'KM', //add this line to enable re-use
  },
};
