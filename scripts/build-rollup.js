const fs = require('fs');
const path = require('path');

// 创建dist目录
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// 复制package.json到dist目录，用于发布
const packageJson = require('../package.json');

// 修改package.json用于发布
const publishPackageJson = {
    ...packageJson,
    main: 'index.js',
    module: 'index.esm.js',
    types: 'index.d.ts',
    scripts: undefined, // 移除构建脚本
    devDependencies: undefined // 移除开发依赖
};

fs.writeFileSync(
    path.join(distDir, 'package.json'),
    JSON.stringify(publishPackageJson, null, 2)
);

// 复制README.md
const readmePath = path.join(__dirname, '../README.md');
if (fs.existsSync(readmePath)) {
    fs.copyFileSync(readmePath, path.join(distDir, 'README.md'));
}

// 复制LICENSE
const licensePath = path.join(__dirname, '../LICENSE');
if (fs.existsSync(licensePath)) {
    fs.copyFileSync(licensePath, path.join(distDir, 'LICENSE'));
}

console.log('✅ UI Framework 构建完成！');
console.log('📦 发布文件已准备就绪，位于 dist/ 目录');
console.log('🚀 运行 "cd dist && npm publish" 来发布到 npm'); 