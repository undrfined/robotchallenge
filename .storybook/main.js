module.exports = {
  "stories": [
    "../src/**/*.stories.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/preset-scss",
  ],
  "framework": "@storybook/react",
  "core": {
    "builder": "@storybook/builder-webpack5"
  },
  webpackFinal: config => {
    // Default rule for images /\.(svg|ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf)(\?.*)?$/
    const fileLoaderRule = config.module.rules.find(rule => rule.test && rule.test.test('.svg'));
    fileLoaderRule.exclude = /\.svg$/;

    config.module.rules.push({
      test: /\.svg$/,
      enforce: 'pre',
      loader: require.resolve('@svgr/webpack'),
      issuer: /\.[jt]sx?$/,
    });

    console.log(config.module.rules)
    const rule = config.module.rules.find(rule => rule.test && rule.test.test('.scss'));
    const cssLoader = rule.use.find(use => use.loader && use.loader.match(/\/css-loader\//));
    cssLoader.options = {
      ...cssLoader.options,
      modules: {
        ...(cssLoader.options?.modules || {}),
        exportLocalsConvention: 'camelCase',
      }
    };

    return config;
  }
}
