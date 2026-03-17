// Configuración para análisis de bundle
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const path = require('path');

// Configuración de Webpack para análisis de bundle
module.exports = {
  mode: 'production',
  entry: './src/main.tsx',
  
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },

  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: true,
      reportFilename: 'bundle-report.html',
    }),
  ],

  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          chunks: 'all',
        },
        
        // React Flow específico
        reactflow: {
          test: /[\\/]node_modules[\\/]@?xyflow[\\/]/,
          name: 'reactflow',
          priority: 20,
          chunks: 'all',
        },
        
        // UI components
        ui: {
          test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
          name: 'ui-components',
          priority: 15,
          chunks: 'all',
        },
        
        // Builder components
        builder: {
          test: /[\\/]src[\\/]components[\\/]builder[\\/]/,
          name: 'builder-components',
          priority: 15,
          chunks: 'all',
        },
        
        // Common utilities
        utils: {
          test: /[\\/]src[\\/](utils|hooks|types)[\\/]/,
          name: 'utils',
          priority: 5,
          chunks: 'all',
        },
      },
    },
  },
};
