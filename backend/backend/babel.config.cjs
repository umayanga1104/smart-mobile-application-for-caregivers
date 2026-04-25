module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 'current' },
        modules: 'auto', // Jest sets NODE_ENV=test, so Babel converts ESM → CJS
      },
    ],
  ],
};
