# UI Framework

一个轻量级、高性能的MVVM UI数据管理框架，支持与任何UI库集成。

## 特性

- **MVVM架构** - 完整的Model-View-ViewModel数据绑定
- **数据绑定** - 支持单向、双向、一次性绑定
- **UI管理** - 完整的UI生命周期管理
- **装饰器支持** - 简化开发，减少样板代码
- **命令模式** - 解耦UI操作和业务逻辑
- **值转换器** - 灵活的数据格式化
- **高性能** - 优化的观察者模式和缓存机制

## 快速开始

### 安装

```bash
npm install @esengine/ui-framework
```

### 基础使用

```typescript
import { ViewModel, observable, computed, command, viewModel } from '@esengine/ui-framework';

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
import { DataBinding, BindingType, BindingMode } from '@esengine/ui-framework';

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

    @computed(['lives'])
    public get isGameOver(): boolean {
        return this.lives <= 0;
    }

    @command('canRestart')
    public restartGame(): void {
        this.score = 0;
        this.lives = 3;
    }

    public canRestart(): boolean {
        return this.isGameOver;
    }
}
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
@command('canSave')
public saveGame(): void {
    // 保存游戏逻辑
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
import { UIManager, UIConfig, UILayer } from '@esengine/ui-framework';

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
import { IUILoader, UIConfig } from '@esengine/ui-framework';

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
import { IUILoader, UIConfig } from '@esengine/ui-framework';

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

## API参考

详细的API文档请参考：

- [ViewModel API](./docs/ViewModel.md)
- [DataBinding API](./docs/DataBinding.md)
- [UIManager API](./docs/UIManager.md)
- [装饰器 API](./docs/Decorators.md)

## 示例项目

- [基础示例](./src/examples/BasicExample.ts)
- [装饰器示例](./src/examples/DecoratorExample.ts)

## 许可证

MIT License 