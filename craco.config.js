const path = require('path');
const { ModuleFederationPlugin } = require("webpack").container;
const deps = require("./package.json").dependencies;

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      webpackConfig.plugins.push(
        new ModuleFederationPlugin({
          name: "videoAssetManager",
          filename: "remoteEntry.js",
          exposes: {
            "./App": "./src/App",
            "./VideoAssetManager": "./src/App",
            "./menuConfig": "./src/menuConfig",
          },
          shared: {
            react: {
              singleton: true,
              requiredVersion: deps.react,
              eager: true,
            },
            "react-dom": {
              singleton: true,
              requiredVersion: deps["react-dom"],
              eager: true,
            },
            "lucide-react": {
              singleton: true,
              requiredVersion: deps["lucide-react"],
              eager: true,
            },
            "@radix-ui/react-slot": {
              singleton: true,
              requiredVersion: deps["@radix-ui/react-slot"],
              eager: true,
            },
            "@radix-ui/react-label": {
              singleton: true,
              requiredVersion: deps["@radix-ui/react-label"],
              eager: true,
            },
            "@radix-ui/react-dialog": {
              singleton: true,
              requiredVersion: deps["@radix-ui/react-dialog"],
              eager: true,
            },
            "class-variance-authority": {
              singleton: true,
              requiredVersion: deps["class-variance-authority"],
              eager: true,
            },
            "clsx": {
              singleton: true,
              requiredVersion: deps.clsx,
              eager: true,
            },
            "tailwind-merge": {
              singleton: true,
              requiredVersion: deps["tailwind-merge"],
              eager: true,
            },
          },
        })
      );

      webpackConfig.output.publicPath = "auto";
      webpackConfig.optimization.runtimeChunk = false;

      return webpackConfig;
    },
  },
  devServer: {
    port: 3004,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
    },
    proxy: {
      '/v2': {
        target: 'https://api.field59.com',
        changeOrigin: true,
        secure: true,
        logLevel: 'debug',
        onProxyRes: function(proxyRes, req, res) {
          // Add CORS headers to proxy responses
          proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
          proxyRes.headers['Access-Control-Allow-Headers'] = 'X-Requested-With, content-type, Authorization';
        },
        onProxyReq: function(proxyReq, req, res) {
          // Handle preflight OPTIONS requests
          if (req.method === 'OPTIONS') {
            res.writeHead(200, {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
              'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
              'Access-Control-Max-Age': '86400'
            });
            res.end();
            return;
          }
        }
      }
    },
    // Handle OPTIONS requests before they reach the proxy
    setupMiddlewares: (middlewares, devServer) => {
      devServer.app.options('/v2/*', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');
        res.setHeader('Access-Control-Max-Age', '86400');
        res.status(200).end();
      });
      return middlewares;
    }
  }
};
