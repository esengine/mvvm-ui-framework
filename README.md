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

基于装饰器的UI管理系统，支持类型安全操作、可扩展层级和自动组件关联：

```typescript
import { ViewModel, ui, UIOperations, DEFAULT_UI_LAYERS } from '@esengine/mvvm-ui-framework';

@ui({
    name: 'GamePanel',
    path: 'panels/GamePanel',
    modal: false,
    cacheable: true,
    layer: DEFAULT_UI_LAYERS.MAIN
})
export class GamePanelViewModel extends ViewModel {
    public get name(): string { return 'GamePanelViewModel'; }

    @command()
    public close(): void {
        UIOperations.closeUI(this);
    }
}

// UI组件自动关联
import { Component, _decorator } from 'cc';
import { uiComponent, getCurrentViewModel } from '@esengine/mvvm-ui-framework';

@ccclass('GamePanelUI')
@uiComponent(GamePanelViewModel)  // 自动关联ViewModel
export class GamePanelUI extends Component {
    private _viewModel: GamePanelViewModel | null = null;

    protected onLoad(): void {
        this._viewModel = getCurrentViewModel<GamePanelViewModel>(this);
    }
}

// 使用
const gameViewModel = new GamePanelViewModel();
const uiInstance = await UIOperations.showUI(gameViewModel);
```

详细使用指南请参考：[UIManager文档](./docs/UIManager.md)

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
import { IUILoader, UIConfig, uiManager } from '@esengine/mvvm-ui-framework';

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
uiManager.setLoader(new CocosUILoader());
```

### FGUI集成

```typescript
import * as fgui from 'fairygui-cc';
import { IUILoader, UIConfig, uiManager } from '@esengine/mvvm-ui-framework';

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
// 正确的做法
@viewModel
class MyViewModel extends ViewModel {
    @observable
    public data: string = '';
}

// 错误的做法 - 缺少 @viewModel 装饰器
class MyViewModel extends ViewModel {
    @observable
    public data: string = '';  // 这样的数据绑定不会工作
}
```

### 2. 数据绑定优化

#### 传统绑定方式
```typescript
// 传统方式 - 字符串绑定，无类型检查
dataBinding.bind(viewModel, uiElement, {
    type: BindingType.ONE_WAY,
    mode: BindingMode.REPLACE,
    source: 'playerName', // 字符串，容易拼写错误
    target: 'textContent',
    converter: 'string'
});
```

#### 新的类型安全绑定方式

框架现在提供了完整的类型安全绑定系统，包括编译时类型检查、智能代码提示和重构安全性。

**方式1：类型安全bindSafe方法**
```typescript
// 编译时类型检查，智能提示
const bindingId = dataBinding.bindSafe(viewModel, uiElement, {
    type: BindingType.ONE_WAY,
    mode: BindingMode.REPLACE,
    source: 'playerName', // 类型检查：必须是viewModel的有效属性
    target: 'textContent', // 类型检查：必须是uiElement的有效属性
    converter: 'string' // 类型检查：必须是已注册的转换器
});

// 返回绑定ID，可用于后续管理
console.log('绑定ID:', bindingId);
```

**方式2：Fluent API（推荐）**
```typescript
// 流畅的链式调用，完整智能提示和错误处理
const result = dataBinding
    .from(viewModel) // 设置绑定源
    .property('playerName') // 智能提示viewModel的所有可观察属性
    .to(uiElement, 'textContent') // 智能提示uiElement的所有可写属性
    .withConverter('string') // 智能提示所有可用转换器
    .bind({
        type: BindingType.ONE_WAY,
        mode: BindingMode.REPLACE
    });

// 检查绑定结果
if (result.success) {
    console.log('绑定成功:', result.id);
    
    // 可以获取绑定实例进行进一步操作
    const binding = dataBinding.getBinding(result.id);
    console.log('绑定详情:', binding);
} else {
    console.error('绑定失败:', result.error);
}

// 支持复杂绑定配置
const advancedResult = dataBinding
    .from(viewModel)
    .property('score')
    .to(scoreElement, 'textContent')
    .withConverter('string')
    .bind({
        type: BindingType.ONE_WAY,
        mode: BindingMode.FORMAT,
        format: '得分: {0} 分' // 格式化显示
    });
```

**方式3：快捷绑定**
```typescript
// 一行代码完成常见绑定，所有方法都返回绑定结果
const result1 = dataBinding.quick.oneWay(viewModel, 'playerName', uiElement, 'textContent');
const result2 = dataBinding.quick.twoWay(viewModel, 'inputValue', inputElement, 'value');
const result3 = dataBinding.quick.format(viewModel, 'score', scoreElement, 'textContent', '得分: {0}', 'string');
const result4 = dataBinding.quick.oneTime(viewModel, 'initialData', initElement, 'textContent');

// 检查绑定结果
console.log('单向绑定:', result1.success ? '成功' : '失败');
console.log('双向绑定:', result2.success ? '成功' : '失败');
console.log('格式化绑定:', result3.success ? '成功' : '失败');
console.log('一次性绑定:', result4.success ? '成功' : '失败');

// 快捷绑定也支持转换器
const currencyResult = dataBinding.quick.oneWay(
    viewModel, 
    'price', 
    priceElement, 
    'textContent',
    'currency' // 使用货币转换器
);
```

**方式4：批量绑定管理**
```typescript
// 创建批量绑定管理器
const batchManager = dataBinding.createBatchManager();

// 批量添加绑定 - 支持链式调用
batchManager
    .add(dataBinding.quick.oneWay(viewModel, 'health', healthBar, 'value'))
    .add(dataBinding.quick.oneWay(viewModel, 'mana', manaBar, 'value'))
    .add(dataBinding.quick.format(viewModel, 'level', levelLabel, 'textContent', '等级 {0}', 'string'))
    .add(dataBinding.quick.twoWay(viewModel, 'playerName', nameInput, 'value'));

// 获取批量操作统计
console.log(`成功绑定: ${batchManager.getSuccessCount()}, 失败: ${batchManager.getFailureCount()}`);

// 获取失败的绑定错误信息
const errors = batchManager.getErrors();
if (errors.length > 0) {
    console.error('绑定错误:', errors);
}

// 批量解除绑定
batchManager.unbindAll();
console.log('所有绑定已清理');

// 也可以逐个解除绑定
batchManager.getSuccessfulBindings().forEach(bindingId => {
    dataBinding.unbind(bindingId);
});
```

#### 自定义转换器系统

框架提供了完整的类型安全转换器系统，支持自定义转换器注册和管理。

```typescript
// 注册类型安全的自定义转换器
dataBinding.registerTypeSafeConverter('currency', {
    convert: (value: number): string => `¥${value.toFixed(2)}`,
    convertBack: (value: string): number => parseFloat(value.replace('¥', '')) || 0
}, '货币格式转换器');

// 注册更复杂的转换器
dataBinding.registerTypeSafeConverter('userDisplay', {
    convert: (user: { name: string; level: number }): string => 
        `${user.name} (Lv.${user.level})`,
    convertBack: (display: string): { name: string; level: number } => {
        const match = display.match(/(.+) \(Lv\.(.+)\)/);
        return match ? 
            { name: match[1], level: parseInt(match[2]) } : 
            { name: '', level: 1 };
    }
}, '用户显示转换器');

// 使用自定义转换器
dataBinding
    .from(viewModel)
    .property('price')
    .to(priceElement, 'textContent')
    .withConverter('currency')
    .bind({ type: BindingType.TWO_WAY, mode: BindingMode.REPLACE });

// 检查转换器是否存在
if (dataBinding.hasConverter('currency')) {
    console.log('货币转换器已注册');
}

// 获取所有已注册的转换器
const converters = dataBinding.getRegisteredConverters();
console.log('已注册转换器:', converters);
```

**内置转换器**

框架提供了多个内置转换器：

```typescript
// string - 转换为字符串
dataBinding.quick.oneWay(viewModel, 'score', element, 'textContent', 'string');

// number - 转换为数字
dataBinding.quick.oneWay(viewModel, 'inputValue', element, 'customData', 'number');

// bool - 转换为布尔值
dataBinding.quick.oneWay(viewModel, 'isActive', element, 'disabled', 'bool');

// date - 日期格式化
dataBinding.quick.oneWay(viewModel, 'createdAt', element, 'textContent', 'date');

// visibility - 显示隐藏转换
dataBinding.quick.oneWay(viewModel, 'isVisible', element, 'style', 'visibility');

// not - 布尔值取反
dataBinding.quick.oneWay(viewModel, 'isLoading', element, 'disabled', 'not');
```

#### 性能优化建议

**类型安全绑定优势：**
- 使用 `bindSafe` 或 Fluent API 享受编译时类型检查，避免运行时错误
- 使用 `quick` 方法简化常见绑定场景，减少代码量
- 使用 `BatchBindingManager` 管理大量绑定，提供统一的错误处理
- 利用类型安全的值转换器进行数据格式化

**性能优化技巧：**
```typescript
// 推荐：批量创建绑定
const batchManager = dataBinding.createBatchManager();
const results = [
    dataBinding.quick.oneWay(viewModel, 'prop1', elem1, 'textContent'),
    dataBinding.quick.oneWay(viewModel, 'prop2', elem2, 'textContent'),
    dataBinding.quick.oneWay(viewModel, 'prop3', elem3, 'textContent')
];
results.forEach(result => batchManager.add(result));

// 推荐：使用一次性绑定避免不必要的监听
dataBinding.quick.oneTime(viewModel, 'staticData', element, 'textContent');

// 推荐：及时清理不需要的绑定
const bindingId = dataBinding.quick.oneWay(viewModel, 'temp', element, 'textContent');
// ... 使用完毕后
if (bindingId.success) {
    dataBinding.unbind(bindingId.id);
}

// 推荐：使用转换器代替复杂的计算属性
dataBinding.registerTypeSafeConverter('fastFormat', {
    convert: (value: number) => `${value}%` // 简单快速的转换
});
```

### 3. UI管理策略

- 使用装饰器声明UI配置，保持配置集中
- 利用UILayerRegistry注册自定义层级
- 通过UIOperations进行类型安全的UI操作
- 合理设置UI缓存策略和模态属性

### 4. 性能优化

- 使用防抖和节流优化频繁操作
- 合理使用计算属性缓存
- 避免在观察者回调中进行重计算

## 许可证

MIT License 