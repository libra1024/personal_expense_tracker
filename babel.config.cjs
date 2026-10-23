/** Configures Expo transforms while NativeWind v5 compiles class names through Metro. */
module.exports = function configureBabel(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
