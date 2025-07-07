const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 使用 Rollup 构建 MVVM UI Framework npm包...');

async function main() {
    try {
        // 清理旧的dist目录
        if (fs.existsSync('./dist')) {
            console.log('🧹 清理旧的构建文件...');
            execSync('rimraf ./dist', { stdio: 'inherit' });
        }

        // 执行Rollup构建
        console.log('📦 执行 Rollup 构建...');
        execSync('rollup -c', { stdio: 'inherit' });

        // 生成package.json
        console.log('📋 生成 package.json...');
        generatePackageJson();

        // 复制其他文件
        console.log('📁 复制必要文件...');
        copyFiles();

        // 输出构建结果
        showBuildResults();

        console.log('✅ MVVM UI Framework 构建完成！');
        console.log('\n🚀 发布命令:');
        console.log('cd dist && npm publish');

    } catch (error) {
        console.error('❌ 构建失败:', error.message);
        process.exit(1);
    }
}

function generatePackageJson() {
    const sourcePackage = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    
    const distPackage = {
        name: sourcePackage.name,
        version: sourcePackage.version,
        description: sourcePackage.description,
        main: 'index.cjs',
        module: 'index.mjs',
        types: 'index.d.ts',
        exports: {
            '.': {
                import: './index.mjs',
                require: './index.cjs',
                types: './index.d.ts'
            }
        },
        files: [
            'index.mjs',
            'index.mjs.map',
            'index.cjs',
            'index.cjs.map',
            'index.d.ts',
            'README.md',
            'LICENSE'
        ],
        keywords: [
            'ui',
            'mvvm',
            'data-binding',
            'ui-manager',
            'cocos',
            'fgui',
            'typescript',
            'decorators',
            'reflect-metadata'
        ],
        author: sourcePackage.author,
        license: sourcePackage.license,
        repository: sourcePackage.repository,
        dependencies: sourcePackage.dependencies,
        peerDependencies: sourcePackage.peerDependencies,
        engines: {
            node: '>=16.0.0'
        },
        sideEffects: false,
        publishConfig: {
            access: 'public'
        }
    };

    fs.writeFileSync('./dist/package.json', JSON.stringify(distPackage, null, 2));
}

function copyFiles() {
    const filesToCopy = [
        { src: './README.md', dest: './dist/README.md' },
        { src: './LICENSE', dest: './dist/LICENSE' }
    ];

    filesToCopy.forEach(({ src, dest }) => {
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log(`  ✓ 复制: ${path.basename(dest)}`);
        } else {
            console.log(`  ⚠️  文件不存在: ${src}`);
        }
    });
}

function showBuildResults() {
    const distDir = './dist';
    const files = ['index.mjs', 'index.cjs', 'index.d.ts'];
    
    console.log('\n📊 构建结果:');
    files.forEach(file => {
        const filePath = path.join(distDir, file);
        if (fs.existsSync(filePath)) {
            const size = fs.statSync(filePath).size;
            console.log(`  ${file}: ${(size / 1024).toFixed(1)}KB`);
        }
    });
}

main().catch(console.error); 