const path = require("path");

// [定数] webpack の出力オプションを指定します
// 'production' か 'development' を指定
const MODE = "development";

// ソースマップの利用有無(productionのときはソースマップを利用しない)
const enabledSourceMap = MODE === "development";

const outputPath = path.resolve(__dirname, "dist");

module.exports = {
  // モード値を production に設定すると最適化された状態で、
  // development に設定するとソースマップ有効でJSファイルが出力される
  mode: MODE,

  entry: "./src/index.ts",
  output: {
    filename: "main.js",
    path: outputPath,
  },

  // webpack-dev-serverを立ち上げた時のドキュメントルートを設定
  // ここではdistディレクトリのindex.htmlにアクセスするよう設定してます
  devServer: {
    contentBase: outputPath,
  },

  module: {
    rules: [
      // Sassファイルの読み込みとコンパイル
      {
        // Sassファイルの読み込みとコンパイル
        test: /\.(sc|c|sa)ss$/, // 対象となるファイルの拡張子
        use: [
          // linkタグに出力する機能
          "style-loader",
          // CSSをバンドルするための機能
          {
            loader: "css-loader",
            options: {
              // オプションでCSS内のurl()メソッドの取り込みを禁止する
              url: false,
              // ソースマップの利用有無
              sourceMap: enabledSourceMap,

              // 0 => no loaders (default);
              // 1 => postcss-loader;
              // 2 => postcss-loader, sass-loader
              importLoaders: 2,
            },
          },
          {
            loader: "sass-loader",
            options: {
              // ソースマップの利用有無
              sourceMap: enabledSourceMap,
            },
          },
        ],
      },
      {
        test: /\.ts$/,
        use: "ts-loader",
      },
      {
        test: /\.(ttf|eot|woff|woff2|svg)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[ext]",
              outputPath: "./webfonts",
              publicPath: "../webfonts",
            },
          },
        ],
      },
    ],
  },

  // import 文で .ts ファイルを解決するため
  resolve: {
    extensions: [".js", ".ts"],
  },
};
