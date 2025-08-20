// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      // this tells Babel to use NativeWind’s JSX transform…
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      // …and this runs NativeWind’s own Babel plugin
      'nativewind/babel',
    ],
    plugins: [
      "@babel/plugin-transform-class-static-block",  // 👈 ADD THIS
    ],
    
    // if you’re using react-native-reanimated you can still add it here:
    //plugins: ['react-native-reanimated/plugin', 'expo-router/babel'],
  };
};
