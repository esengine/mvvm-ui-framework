# UI Framework

一个轻量级、高性能的MVVM UI数据管理框架，支持与任何UI库集成。

## 特性

- **MVVM架构** - 完整的Model-View-ViewModel数据绑定
- **数据绑定** - 支持单向、双向、一次性绑定
- **UI管理** - 完整的UI生命周期管理
- **装饰器支持** - 简化开发，减少样板代码
- **命令模式** - 解耦UI操作和业务逻辑，支持参数化命令和异步命令
- **值转换器** - 灵活的数据格式化
- **高性能** - 优化的观察者模式和缓存机制

## 快速开始

### 安装

```bash
npm install @esengine/mvvm-ui-framework
```

### 基础使用

```typescript
import { ViewModel, observable, computed, command, viewModel } from '@esengine/mvvm-ui-framework';

@viewModel
class UserViewModel extends ViewModel {
    public get name(): string { return 'UserViewModel'; }

    @observable
    public firstName: string = '';

    @observable
    public lastName: string = '';

    @computed(['firstName', 'lastName'])
    public get fullName(): string {
        return `${this.firstName} ${this.lastName}`.trim();
    }

    @command()
    public saveUser(): void {
        console.log('保存用户:', this.fullName);
    }
}
```

### 数据绑定

```typescript
import { DataBinding, BindingType, BindingMode } from '@esengine/mvvm-ui-framework';

const viewModel = new UserViewModel();
const uiElement = { textContent: '' };

// 创建数据绑定
const dataBinding = DataBinding.getInstance();
dataBinding.bind(viewModel, uiElement, {
    type: BindingType.ONE_WAY,
    mode: BindingMode.REPLACE,
    source: 'fullName',
    target: 'textContent'
});

// 当ViewModel数据变化时，UI会自动更新
viewModel.firstName = 'John';
viewModel.lastName = 'Doe';
// uiElement.textContent 现在是 "John Doe"
```

## 核心概念

### ViewModel

ViewModel是MVVM模式的核心，负责管理UI状态和业务逻辑：

```typescript
@viewModel
class GameViewModel extends ViewModel {
    public get name(): string { return 'GameViewModel'; }

    @observable
    public score: number = 0;

    @observable
    public lives: number = 3;

    @observable
    public currentLevel: number = 1;

    @computed(['lives'])
    public get isGameOver(): boolean {
        return this.lives <= 0;
    }

    @command('canRestart')
    public restartGame(): void {
        this.score = 0;
        this.lives = 3;
        this.currentLevel = 1;
    }

    // 参数化命令 - 支持传入参数
    @command({ parameterized: true, canExecuteMethod: 'canAddScore' })
    public addScore(points: number, multiplier: number = 1): void {
        this.score += points * multiplier;
    }

    // 异步参数化命令
    @command({ parameterized: true, async: true })
    public async loadLevel(levelId: number): Promise<void> {
        console.log(`正在加载关卡 ${levelId}...`);
        // 模拟异步加载
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.currentLevel = levelId;
        console.log(`关卡 ${levelId} 加载完成`);
    }

    public canRestart(): boolean {
        return this.isGameOver;
    }

    public canAddScore(points: number, multiplier: number = 1): boolean {
        return points > 0 && !this.isGameOver;
    }
}

// 使用示例
const gameVM = new GameViewModel();

// 执行基础命令
gameVM.executeCommand('restartGame');

// 执行参数化命令
gameVM.executeCommand('addScore', 100, 2); // 添加200分
gameVM.executeCommand('loadLevel', 5); // 加载第5关
```

### 装饰器

框架提供了丰富的装饰器来简化开发：

#### @viewModel - ViewModel类装饰器
```typescript
@viewModel
class MyViewModel extends ViewModel {
    public get name(): string { return 'MyViewModel'; }
    
    @observable
    public data: string = '';
}
```
**重要说明：** 使用 `@viewModel` 装饰器可以自动初始化所有装饰器功能，包括 `@observable`、`@computed`、`@command` 等。这解决了 TypeScript 属性初始化覆盖装饰器的问题，确保数据绑定正常工作。

#### @observable - 可观察属性
```typescript
@observable
public playerName: string = '';
```

#### @computed - 计算属性
```typescript
@computed(['score', 'level'])
public get totalScore(): number {
    return this.score * this.level;
}
```

#### @command - 命令
```typescript
// 基础命令
@command('canSave')
public saveGame(): void {
    // 保存游戏逻辑
}

// 参数化命令 - 支持传入参数
@command({ parameterized: true, canExecuteMethod: 'canAttack' })
public attackEnemy(enemyId: number, damage: number): void {
    // 攻击敌人逻辑
    console.log(`攻击敌人 ${enemyId}，造成 ${damage} 伤害`);
}

public canAttack(enemyId: number, damage: number): boolean {
    return this.lives > 0 && damage > 0;
}

// 异步参数化命令
@command({ parameterized: true, async: true })
public async loadLevel(levelId: number): Promise<void> {
    // 异步加载关卡
    console.log(`开始加载关卡 ${levelId}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`关卡 ${levelId} 加载完成`);
}
```

#### @validate - 验证
```typescript
@observable
@validate((value: number) => value >= 0, '分数不能为负数')
public score: number = 0;
```

#### @async - 异步状态管理
```typescript
@observable
public loading: boolean = false;

@observable
public error: Error | null = null;

@async('loading', 'error')
public async loadData(): Promise<void> {
    // 异步操作，loading和error状态会自动管理
}
```

#### @debounce - 防抖
```typescript
@debounce(500)
public search(keyword: string): void {
    // 搜索逻辑，500ms内多次调用只执行最后一次
}
```

#### @throttle - 节流
```typescript
@throttle(1000)
public autoSave(): void {
    // 自动保存，1秒内多次调用只执行一次
}
```

### 命令系统

框架提供了完整的命令系统，支持基础命令、参数化命令和异步命令：

#### 基础命令
基础命令不接受参数，用于简单的操作：
```typescript
class UserViewModel extends ViewModel {
    @observable
    public hasPermission: boolean = false;

    @command()
    public save(): void {
        // 保存逻辑
    }
    
    @command('canDelete')
    public delete(): void {
        // 删除逻辑
    }
    
    public canDelete(): boolean {
        return this.hasPermission;
    }
}
```

#### 参数化命令
参数化命令可以接受参数，提供更大的灵活性：
```typescript
class GameViewModel extends ViewModel {
    @observable
    public playerAlive: boolean = true;

    @command({ parameterized: true })
    public movePlayer(direction: string, distance: number): void {
        console.log(`玩家向${direction}移动${distance}距离`);
    }
    
    @command({ parameterized: true, canExecuteMethod: 'canAttack' })
    public attackEnemy(enemyId: number, damage: number): void {
        console.log(`攻击敌人${enemyId}，造成${damage}伤害`);
    }
    
    public canAttack(enemyId: number, damage: number): boolean {
        return enemyId > 0 && damage > 0 && this.playerAlive;
    }
}
```

#### 异步命令
异步命令支持Promise操作，自动管理执行状态：
```typescript
interface UploadOptions {
    compress?: boolean;
}

class DataViewModel extends ViewModel {
    @observable
    public maxFileSize: number = 1024 * 1024 * 10; // 10MB
    
    @observable
    public isUploading: boolean = false;

    private apiService = {
        uploadFile: async (file: File, options?: UploadOptions) => {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    };

    @command({ async: true })
    public async loadData(): Promise<void> {
        console.log('开始加载数据...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('数据加载完成');
    }
    
    @command({ parameterized: true, async: true, canExecuteMethod: 'canUpload' })
    public async uploadFile(file: File, options?: UploadOptions): Promise<void> {
        console.log(`开始上传文件: ${file.name}`);
        this.isUploading = true;
        try {
            await this.apiService.uploadFile(file, options);
            console.log('文件上传完成');
        } finally {
            this.isUploading = false;
        }
    }
    
    public canUpload(file: File, options?: UploadOptions): boolean {
        return file.size <= this.maxFileSize && !this.isUploading;
    }
}
```

#### 命令执行
```typescript
const gameViewModel = new GameViewModel();
const dataViewModel = new DataViewModel();

// 执行基础命令
gameViewModel.executeCommand('save');

// 执行参数化命令
gameViewModel.executeCommand('movePlayer', 'north', 10);
gameViewModel.executeCommand('attackEnemy', 123, 50);

// 执行异步命令
dataViewModel.executeCommand('loadData');

// 执行异步参数化命令
const file = new File(['content'], 'test.txt');
dataViewModel.executeCommand('uploadFile', file, { compress: true });

// 获取命令状态
const loadCommand = dataViewModel.getCommand('loadData');
if (loadCommand?.isExecuting && loadCommand.isExecuting()) {
    console.log('数据正在加载中...');
}
```

#### 命令装饰器选项
`@command` 装饰器支持以下选项：
- `canExecuteMethod`: 指定可执行检查方法名
- `parameterized`: 标记为参数化命令（框架会根据方法参数数量自动检测）
- `async`: 标记为异步命令

```typescript
// 字符串形式（向后兼容）
@command('canExecuteMethodName')

// 对象形式（推荐）
@command({
    canExecuteMethod: 'canExecuteMethodName',
    parameterized: true,
    async: true
})
```

### 数据绑定

支持多种绑定类型和模式：

```typescript
// 单向绑定
dataBinding.bind(viewModel, uiElement, {
    type: BindingType.ONE_WAY,
    mode: BindingMode.REPLACE,
    source: 'playerName',
    target: 'text'
});

// 双向绑定
dataBinding.bind(viewModel, inputElement, {
    type: BindingType.TWO_WAY,
    mode: BindingMode.REPLACE,
    source: 'playerName',
    target: 'value'
});

// 使用转换器
dataBinding.bind(viewModel, uiElement, {
    type: BindingType.ONE_WAY,
    mode: BindingMode.REPLACE,
    source: 'score',
    target: 'text',
    converter: 'string'
});

// 使用格式化
dataBinding.bind(viewModel, uiElement, {
    type: BindingType.ONE_WAY,
    mode: BindingMode.FORMAT,
    source: 'score',
    target: 'text',
    format: '分数: {0}'
});
```

### UI管理

完整的UI生命周期管理：

```typescript
import { UIManager, UIConfig, UILayer } from '@esengine/mvvm-ui-framework';

// 注册UI配置
const uiManager = UIManager.getInstance();
uiManager.registerUI({
    name: 'GamePanel',
    path: 'panels/GamePanel',
    modal: false,
    cacheable: true,
    layer: UILayer.MAIN
});

// 显示UI
const gameViewModel = new GameViewModel();
const uiInstance = await uiManager.showUI('GamePanel', gameViewModel);

// 隐藏UI
await uiManager.hideUI('GamePanel');

// 关闭UI
await uiManager.closeUI('GamePanel');
```

### 值转换器

内置多种值转换器：

```typescript
// 注册自定义转换器
dataBinding.registerConverter('currency', {
    convert: (value: number) => `¥${value.toFixed(2)}`,
    convertBack: (value: string) => parseFloat(value.replace('¥', ''))
});

// 使用转换器
dataBinding.bind(viewModel, uiElement, {
    source: 'price',
    target: 'text',
    converter: 'currency'
});
```

## 与UI框架集成

### Cocos Creator集成

```typescript
import { cc } from 'cc';
import { IUILoader, UIConfig } from '@esengine/mvvm-ui-framework';

class CocosUILoader implements IUILoader {
    async loadUI(config: UIConfig): Promise<cc.Node> {
        const prefab = await new Promise<cc.Prefab>((resolve, reject) => {
            cc.resources.load(config.path, cc.Prefab, (err, prefab) => {
                if (err) reject(err);
                else resolve(prefab);
            });
        });
        
        return cc.instantiate(prefab);
    }

    async unloadUI(config: UIConfig): Promise<void> {
        cc.resources.release(config.path);
    }

    isLoaded(config: UIConfig): boolean {
        return cc.resources.get(config.path) !== null;
    }
}

// 设置UI加载器
const uiManager = UIManager.getInstance();
uiManager.setLoader(new CocosUILoader());
```

### FGUI集成

```typescript
import * as fgui from 'fairygui-cc';
import { IUILoader, UIConfig } from '@esengine/mvvm-ui-framework';

class FGUILoader implements IUILoader {
    async loadUI(config: UIConfig): Promise<fgui.GComponent> {
        return fgui.UIPackage.createObject(config.path, config.name);
    }

    async unloadUI(config: UIConfig): Promise<void> {
        // FGUI的清理逻辑
    }

    isLoaded(config: UIConfig): boolean {
        return fgui.UIPackage.getById(config.path) !== null;
    }
}
```

## 最佳实践

### 1. ViewModel设计原则

- **必须使用 `@viewModel` 装饰器**：确保装饰器功能正常工作
- 保持ViewModel的纯净性，不包含UI相关代码
- 使用装饰器简化代码
- 合理使用计算属性避免重复计算
- 为异步操作添加loading和error状态

```typescript
// ✅ 正确的做法
@viewModel
class MyViewModel extends ViewModel {
    @observable
    public data: string = '';
}

// ❌ 错误的做法 - 缺少 @viewModel 装饰器
class MyViewModel extends ViewModel {
    @observable
    public data: string = '';  // 这样的数据绑定不会工作
}
```

### 2. 数据绑定优化

- 使用合适的绑定类型（避免不必要的双向绑定）
- 利用值转换器进行数据格式化
- 批量更新时使用batchUpdate减少通知次数

### 3. UI管理策略

- 合理设置UI缓存策略
- 使用UI层级管理界面显示顺序
- 及时清理不需要的UI实例

### 4. 性能优化

- 使用防抖和节流优化频繁操作
- 合理使用计算属性缓存
- 避免在观察者回调中进行重计算

## 许可证

MIT License 