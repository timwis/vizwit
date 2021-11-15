const ThreadsPlugin = require('threads-plugin')

module.exports = {
  configureWebpack: {
    resolve: {
      fallback: {
        crypto: false,
        path: false,
        fs: false
      }
    },
    plugins: [
      new ThreadsPlugin()
    ]
  },
  devServer: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
}
