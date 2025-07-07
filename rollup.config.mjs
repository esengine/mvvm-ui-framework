import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

const isProduction = process.env.NODE_ENV === 'production';

export default [
    // ES模块构建 (.mjs)
    {
        input: 'bin/index.js',
        output: {
            file: 'dist/index.mjs',
            format: 'es',
            sourcemap: !isProduction
        },
        external: ['reflect-metadata'],
        plugins: [
            resolve({
                browser: true,
                preferBuiltins: false
            }),
            commonjs(),
            ...(isProduction ? [terser()] : [])
        ]
    },
    // CommonJS构建 (.cjs)
    {
        input: 'bin/index.js',
        output: {
            file: 'dist/index.cjs',
            format: 'cjs',
            sourcemap: !isProduction,
            exports: 'named'
        },
        external: ['reflect-metadata'],
        plugins: [
            resolve({
                browser: true,
                preferBuiltins: false
            }),
            commonjs(),
            ...(isProduction ? [terser()] : [])
        ]
    },
    // 类型定义文件
    {
        input: 'bin/index.d.ts',
        output: {
            file: 'dist/index.d.ts',
            format: 'es'
        },
        plugins: [dts()]
    }
]; 