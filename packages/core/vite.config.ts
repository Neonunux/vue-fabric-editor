/*
 * @Description:
 * @version:
 * @Author: June
 * @Date: 2023-04-24 00:25:39
 * @LastEditors: June 1601745371@qq.com
 * @LastEditTime: 2024-04-18 10:14:25
 */
import { defineConfig } from 'vite';
import eslintPlugin from 'vite-plugin-eslint'; // Imported package
import { resolve } from 'path';

const config = () => {
  return {
    base: './',
    build: {
      lib: {
        entry: resolve(__dirname, './index.ts'),
        name: 'Kuaitu',
        fileName: 'index',
      },
      outDir: resolve(__dirname, '../../dist'),
    },
    plugins: [
      // Add the following configuration items, so that you can check the ESLint specification during runtime
      eslintPlugin({
        include: ['src/**/*.js', 'src/**/*.vue', 'src/*.js', 'src/*.vue'],
      }),
    ],
  };
};

export default defineConfig(config);
