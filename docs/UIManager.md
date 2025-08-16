# UIManager

UIManager提供了基于装饰器的UI管理系统，支持类型安全的UI操作、可扩展的层级管理，以及UI组件与ViewModel的自动关联。

## 核心概念

### UI装饰器
使用`@ui`装饰器声明ViewModel对应的UI配置：

```typescript
import { ViewModel, ui, DEFAULT_UI_LAYERS } from '@esengine/mvvm-ui-framework';

@ui({
    name: 'ChatUI',
    path: 'prefabs/ui/chat/Chat',
    modal: false,
    cacheable: true,
    layer: DEFAULT_UI_LAYERS.MAIN
})
export class ChatViewModel extends ViewModel {
    // ViewModel实现
}
```

### UI组件装饰器
使用`@uiComponent`装饰器让UI组件自动关联对应的ViewModel：

```typescript
import { Component, _decorator } from 'cc';
import { uiComponent, getCurrentViewModel } from '@esengine/mvvm-ui-framework';
import { ChatViewModel } from '../viewmodels/ChatViewModel';

const { ccclass } = _decorator;

@ccclass('ChatUI')
@uiComponent(ChatViewModel)
export class ChatUI extends Component {
    private _viewModel: ChatViewModel | null = null;

    protected onLoad(): void {
        this._viewModel = getCurrentViewModel<ChatViewModel>(this);
    }
}
```

### UI操作工具
使用`UIOperations`进行类型安全的UI操作：

```typescript
import { UIOperations } from '@esengine/mvvm-ui-framework';

// 显示UI
const instance = await UIOperations.showUI(viewModel);

// 关闭UI
UIOperations.closeUI(viewModel);

// 隐藏UI
UIOperations.hideUI(viewModel);

// 检查UI状态
const isShown = UIOperations.isUIShown(viewModel);
```

## 层级管理

### 默认层级
```typescript
import { DEFAULT_UI_LAYERS } from '@esengine/mvvm-ui-framework';

// 可用的默认层级
DEFAULT_UI_LAYERS.BACKGROUND  // 0
DEFAULT_UI_LAYERS.MAIN       // 100
DEFAULT_UI_LAYERS.POPUP      // 200
DEFAULT_UI_LAYERS.TIPS       // 300
DEFAULT_UI_LAYERS.TOP        // 400
```

### 自定义层级
使用`UILayerRegistry`注册自定义层级：

```typescript
import { UILayerRegistry } from '@esengine/mvvm-ui-framework';

// 注册自定义层级
UILayerRegistry.registerLayer('GAME_HUD', 150);
UILayerRegistry.registerLayer('NOTIFICATION', 350);

// 在装饰器中使用
@ui({
    name: 'GameHUD',
    path: 'prefabs/ui/hud/GameHUD',
    layer: 'GAME_HUD'  // 使用自定义层级名称
})
export class GameHUDViewModel extends ViewModel {}

// 或直接使用数字
@ui({
    name: 'LoadingDialog',
    path: 'prefabs/ui/loading/LoadingDialog',
    layer: 999  // 直接指定数字层级
})
export class LoadingDialogViewModel extends ViewModel {}
```

## 配置选项

### UIConfig接口
```typescript
interface UIConfig {
    name: string;           // UI名称
    path: string;          // 预制体路径
    modal?: boolean;       // 是否为模态窗口
    cacheable?: boolean;   // 是否可缓存
    layer?: number | string; // 层级（数字或层级名称）
    animation?: UIAnimationConfig; // 动画配置
    preload?: boolean;     // 是否预加载
}
```

### 动画配置
```typescript
interface UIAnimationConfig {
    showAnimation?: string;  // 显示动画
    hideAnimation?: string;  // 隐藏动画
    duration?: number;       // 动画持续时间
    easing?: string;         // 缓动函数
}
```

## 初始化设置

### 设置UI加载器
```typescript
import { uiManager, IUILoader } from '@esengine/mvvm-ui-framework';

const loader: IUILoader = {
    loadUI: async (config) => {
        // 加载UI资源逻辑
        return uiNode;
    },
    unloadUI: async (config) => {
        // 卸载UI资源逻辑
    },
    isLoaded: (config) => {
        // 检查是否已加载
        return boolean;
    }
};

uiManager.setLoader(loader);
```

### 设置UI根节点
```typescript
import { uiManager } from '@esengine/mvvm-ui-framework';

// 设置UI容器
const canvas = find('Canvas');
uiManager.setUIRoot(canvas);
```

## UI组件与ViewModel自动关联

### 关联方式

框架提供了多种方式来建立UI组件与ViewModel的关联：

#### 方式1：使用@uiComponent装饰器（推荐）
```typescript
import { Component, _decorator, Button } from 'cc';
import { uiComponent, getCurrentViewModel } from '@esengine/mvvm-ui-framework';
import { ChatViewModel } from '../viewmodels/ChatViewModel';

const { ccclass, property } = _decorator;

@ccclass('ChatUI')
@uiComponent(ChatViewModel)  // 自动关联ChatViewModel
export class ChatUI extends Component {
    @property({ type: Button })
    public closeButton: Button | null = null;

    private _viewModel: ChatViewModel | null = null;

    protected onLoad(): void {
        // 自动获取对应的ViewModel实例
        this._viewModel = getCurrentViewModel<ChatViewModel>(this);
        this._bindEvents();
    }

    private _bindEvents(): void {
        if (this.closeButton) {
            this.closeButton.node.on(Button.EventType.CLICK, () => {
                this._viewModel?.executeCommand('close');
            }, this);
        }
    }
}
```

#### 方式2：手动指定UI名称
```typescript
@ccclass('CustomChatUI')
@uiComponent(ChatViewModel, 'ChatUI')  // 手动指定UI名称
export class CustomChatUI extends Component {
    // ...
}
```

#### 方式3：直接使用函数获取
```typescript
import { getViewModelByUIName } from '@esengine/mvvm-ui-framework';

export class ChatUI extends Component {
    protected onLoad(): void {
        const viewModel = getViewModelByUIName<ChatViewModel>('ChatUI');
        // ...
    }
}
```

### 自动关联原理

1. **@uiComponent装饰器**会自动从ViewModel的@ui装饰器中获取UI名称
2. **getCurrentViewModel函数**根据组件的装饰器配置查找对应的ViewModel实例
3. **无需硬编码**UI名称，修改时只需要在一个地方更新

## 完整示例

### ViewModel定义
```typescript
import { ViewModel, observable, command, viewModel, ui, UIOperations, DEFAULT_UI_LAYERS } from '@esengine/mvvm-ui-framework';

@viewModel
@ui({
    name: 'UserPanel',
    path: 'prefabs/ui/user/UserPanel',
    modal: true,
    cacheable: true,
    layer: DEFAULT_UI_LAYERS.POPUP,
    animation: {
        showAnimation: 'fadeIn',
        hideAnimation: 'fadeOut',
        duration: 300
    }
})
export class UserPanelViewModel extends ViewModel {
    public get name(): string {
        return 'UserPanelViewModel';
    }

    @observable
    public username: string = '';

    @observable
    public level: number = 1;

    @command()
    public close(): void {
        UIOperations.closeUI(this);
    }

    @command()
    public save(): void {
        console.log('保存用户数据');
        UIOperations.closeUI(this);
    }
}
```

### UI组件定义
```typescript
import { Component, _decorator, Button, Label } from 'cc';
import { uiComponent, getCurrentViewModel } from '@esengine/mvvm-ui-framework';
import { UserPanelViewModel } from '../viewmodels/UserPanelViewModel';

const { ccclass, property } = _decorator;

@ccclass('UserPanelUI')
@uiComponent(UserPanelViewModel)
export class UserPanelUI extends Component {
    @property({ type: Button })
    public closeButton: Button | null = null;

    @property({ type: Button })
    public saveButton: Button | null = null;

    @property({ type: Label })
    public usernameLabel: Label | null = null;

    private _viewModel: UserPanelViewModel | null = null;

    protected onLoad(): void {
        this._viewModel = getCurrentViewModel<UserPanelViewModel>(this);
        this._bindUI();
    }

    protected onDestroy(): void {
        this._unbindUI();
    }

    private _bindUI(): void {
        if (this.closeButton) {
            this.closeButton.node.on(Button.EventType.CLICK, () => {
                this._viewModel?.executeCommand('close');
            }, this);
        }

        if (this.saveButton) {
            this.saveButton.node.on(Button.EventType.CLICK, () => {
                this._viewModel?.executeCommand('save');
            }, this);
        }

        // 绑定数据显示
        if (this._viewModel && this.usernameLabel) {
            this.usernameLabel.string = this._viewModel.username;
        }
    }

    private _unbindUI(): void {
        if (this.closeButton) {
            this.closeButton.node.off(Button.EventType.CLICK);
        }
        if (this.saveButton) {
            this.saveButton.node.off(Button.EventType.CLICK);
        }
    }
}
```

### UI管理器使用
```typescript
import { UIOperations } from '@esengine/mvvm-ui-framework';

export class GameManager {
    private userPanelViewModel = new UserPanelViewModel();

    public async showUserPanel(): Promise<void> {
        try {
            const instance = await UIOperations.showUI(this.userPanelViewModel);
            console.log('用户面板已打开', instance);
        } catch (error) {
            console.error('打开用户面板失败', error);
        }
    }

    public closeUserPanel(): void {
        UIOperations.closeUI(this.userPanelViewModel);
    }

    public isUserPanelOpen(): boolean {
        return UIOperations.isUIShown(this.userPanelViewModel);
    }
}
```

## API参考

### UIOperations静态方法
- `showUI<T>(viewModel: T, userData?: any): Promise<UIInstance<T>>` - 显示UI
- `closeUI<T>(instance: T): void` - 关闭UI
- `hideUI<T>(instance: T): void` - 隐藏UI
- `isUIShown<T>(instance: T): boolean` - 检查UI是否显示
- `getConfig<T>(instance: T): UIConfig<T> | undefined` - 获取UI配置

### UI组件关联函数
- `uiComponent<TViewModel>(viewModelClass, uiName?): ClassDecorator` - UI组件装饰器
- `getCurrentViewModel<T>(component): T | undefined` - 获取当前组件的ViewModel
- `getViewModelByUIName<T>(uiName): T | undefined` - 通过UI名称获取ViewModel
- `getUIComponentConfig(target): UIComponentConfig | undefined` - 获取UI组件配置

### UILayerRegistry静态方法
- `registerLayer(name: string, value: number): void` - 注册自定义层级
- `getLayer(name: string): number | undefined` - 获取层级值
- `resolveLayer(layer: UILayerValue): number` - 解析层级值
- `getAllLayers(): Record<string, number>` - 获取所有层级
- `reset(): void` - 重置层级注册表

### UIManager实例方法
- `setLoader(loader: IUILoader): void` - 设置UI加载器
- `setUIRoot(root: any): void` - 设置UI根节点
- `registerUI(config: UIConfig): void` - 注册UI配置
- `showUI(name: string, viewModel?: ViewModel, userData?: any): Promise<UIInstance>` - 显示UI
- `hideUI(name: string): Promise<void>` - 隐藏UI
- `closeUI(name: string): Promise<void>` - 关闭UI
- `isUIShown(name: string): boolean` - 检查UI是否显示

### 装饰器
- `@ui(config: UIConfig)` - ViewModel UI配置装饰器
- `@uiComponent(viewModelClass, uiName?)` - UI组件关联装饰器

### 接口类型
- `UIConfig` - UI配置接口
- `UIComponentConfig` - UI组件配置接口
- `UIInstance` - UI实例接口
- `IUILoader` - UI加载器接口