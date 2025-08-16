# UIManager

UIManager提供了基于装饰器的UI管理系统，支持类型安全的UI操作和可扩展的层级管理。

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

## 完整示例

### ViewModel定义
```typescript
import { ViewModel, observable, command, ui, UIOperations, DEFAULT_UI_LAYERS } from '@esengine/mvvm-ui-framework';

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
        // 保存逻辑
        console.log('保存用户数据');
        UIOperations.closeUI(this);
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
- `showUI<T>(viewModel: T, userData?: any): Promise<UIInstance<T>>`
- `closeUI<T>(instance: T): void`
- `hideUI<T>(instance: T): void`
- `isUIShown<T>(instance: T): boolean`
- `getConfig<T>(instance: T): UIConfig<T> | undefined`

### UILayerRegistry静态方法
- `registerLayer(name: string, value: number): void`
- `getLayer(name: string): number | undefined`
- `resolveLayer(layer: UILayerValue): number`
- `getAllLayers(): Record<string, number>`
- `reset(): void`

### UIManager实例方法
- `setLoader(loader: IUILoader): void`
- `setUIRoot(root: any): void`
- `registerUI(config: UIConfig): void`
- `showUI(name: string, viewModel?: ViewModel, userData?: any): Promise<UIInstance>`
- `hideUI(name: string): Promise<void>`
- `closeUI(name: string): Promise<void>`
- `isUIShown(name: string): boolean`