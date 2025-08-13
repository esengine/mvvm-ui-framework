import { ViewModel } from '../core/ViewModel';
import { IObservable, Observer } from '../core/IObservable';

/**
 * UI界面配置
 */
export interface UIConfig {
    /** 界面名称 */
    name: string;
    /** 界面路径或标识 */
    path: string;
    /** 是否为模态窗口 */
    modal?: boolean;
    /** 是否可以缓存 */
    cacheable?: boolean;
    /** 界面层级 */
    layer?: UILayer;
    /** 动画配置 */
    animation?: UIAnimationConfig;
    /** 预加载 */
    preload?: boolean;
    /** 自定义数据 */
    data?: any;
}

/**
 * UI层级枚举
 */
export enum UILayer {
    /** 背景层 */
    BACKGROUND = 0,
    /** 主界面层 */
    MAIN = 100,
    /** 弹窗层 */
    POPUP = 200,
    /** 提示层 */
    TIPS = 300,
    /** 顶层 */
    TOP = 400
}

/**
 * UI动画配置
 */
export interface UIAnimationConfig {
    /** 显示动画 */
    showAnimation?: string;
    /** 隐藏动画 */
    hideAnimation?: string;
    /** 动画持续时间 */
    duration?: number;
    /** 动画缓动函数 */
    easing?: string;
}

/**
 * UI界面状态
 */
export enum UIState {
    /** 未加载 */
    UNLOADED = 'unloaded',
    /** 加载中 */
    LOADING = 'loading',
    /** 已加载 */
    LOADED = 'loaded',
    /** 显示中 */
    SHOWING = 'showing',
    /** 已显示 */
    SHOWN = 'shown',
    /** 隐藏中 */
    HIDING = 'hiding',
    /** 已隐藏 */
    HIDDEN = 'hidden',
    /** 销毁中 */
    DESTROYING = 'destroying',
    /** 已销毁 */
    DESTROYED = 'destroyed'
}

/**
 * UI界面实例
 */
export interface UIInstance {
    /** 配置 */
    config: UIConfig;
    /** 状态 */
    state: UIState;
    /** 视图模型 */
    viewModel?: ViewModel;
    /** 视图对象（由具体UI框架提供） */
    view?: any;
    /** 创建时间 */
    createTime: number;
    /** 最后访问时间 */
    lastAccessTime: number;
    /** 自定义数据 */
    userData?: any;
}

/**
 * UI事件类型
 */
export enum UIEvent {
    /** 界面即将显示 */
    WILL_SHOW = 'will_show',
    /** 界面已显示 */
    DID_SHOW = 'did_show',
    /** 界面即将隐藏 */
    WILL_HIDE = 'will_hide',
    /** 界面已隐藏 */
    DID_HIDE = 'did_hide',
    /** 界面即将销毁 */
    WILL_DESTROY = 'will_destroy',
    /** 界面已销毁 */
    DID_DESTROY = 'did_destroy'
}

/**
 * UI事件监听器
 */
export type UIEventListener = (uiName: string, instance: UIInstance, ...args: any[]) => void;

/**
 * UI加载器接口
 */
export interface IUILoader {
    /**
     * 加载UI资源
     */
    loadUI(config: UIConfig): Promise<any>;
    
    /**
     * 卸载UI资源
     */
    unloadUI(config: UIConfig): Promise<void>;
    
    /**
     * 检查UI是否已加载
     */
    isLoaded(config: UIConfig): boolean;
}

/**
 * UI管理器
 * 负责管理UI界面的生命周期、导航和状态
 */
export class UIManager {
    private static _instance: UIManager;
    
    /** UI配置映射 */
    private _configs: Map<string, UIConfig> = new Map();
    
    /** UI实例映射 */
    private _instances: Map<string, UIInstance> = new Map();
    
    /** 显示栈 */
    private _showStack: string[] = [];
    
    /** 事件监听器 */
    private _eventListeners: Map<UIEvent, Set<UIEventListener>> = new Map();
    
    /** UI加载器 */
    private _loader: IUILoader | null = null;
    
    /** 默认配置 */
    private _defaultConfig: Partial<UIConfig> = {
        modal: false,
        cacheable: true,
        layer: UILayer.MAIN,
        preload: false
    };

    /**
     * 获取单例实例
     */
    public static getInstance(): UIManager {
        if (!UIManager._instance) {
            UIManager._instance = new UIManager();
        }
        return UIManager._instance;
    }

    private constructor() {
        // 初始化事件监听器映射
        for (const event of Object.values(UIEvent)) {
            this._eventListeners.set(event, new Set());
        }
    }

    /**
     * 设置UI加载器
     */
    public setLoader(loader: IUILoader | null): void {
        this._loader = loader;
    }

    /**
     * 注册UI配置
     */
    public registerUI(config: UIConfig): void {
        // 合并默认配置
        const fullConfig = { ...this._defaultConfig, ...config };
        this._configs.set(config.name, fullConfig);
        
        // 如果需要预加载，立即加载
        if (fullConfig.preload) {
            this.preloadUI(config.name);
        }
    }

    /**
     * 批量注册UI配置
     */
    public registerUIs(configs: UIConfig[]): void {
        for (const config of configs) {
            this.registerUI(config);
        }
    }

    /**
     * 预加载UI
     */
    public async preloadUI(uiName: string): Promise<void> {
        const config = this._configs.get(uiName);
        if (!config) {
            throw new Error(`UI配置不存在: ${uiName}`);
        }

        if (this._instances.has(uiName)) {
            return; // 已存在实例
        }

        const instance = this.createInstance(config);
        await this.loadUIInternal(instance);
    }

    /**
     * 显示UI
     */
    public async showUI(uiName: string, viewModel?: ViewModel, userData?: any): Promise<UIInstance> {
        const config = this._configs.get(uiName);
        if (!config) {
            throw new Error(`UI配置不存在: ${uiName}`);
        }

        let instance = this._instances.get(uiName);
        
        // 如果实例不存在，创建新实例
        if (!instance) {
            instance = this.createInstance(config);
            await this.loadUIInternal(instance);
        }

        // 更新实例数据
        if (viewModel) {
            instance.viewModel = viewModel;
        }
        if (userData !== undefined) {
            instance.userData = userData;
        }

        // 显示UI
        await this.showUIInternal(instance);
        
        return instance;
    }

    /**
     * 隐藏UI
     */
    public async hideUI(uiName: string): Promise<void> {
        const instance = this._instances.get(uiName);
        if (!instance) {
            return;
        }

        await this.hideUIInternal(instance);
    }

    /**
     * 关闭UI（隐藏并销毁）
     */
    public async closeUI(uiName: string): Promise<void> {
        const instance = this._instances.get(uiName);
        if (!instance) {
            return;
        }

        await this.hideUIInternal(instance);
        await this.destroyUIInternal(instance);
    }

    /**
     * 获取UI实例
     */
    public getUI(uiName: string): UIInstance | undefined {
        return this._instances.get(uiName);
    }

    /**
     * 检查UI是否存在
     */
    public hasUI(uiName: string): boolean {
        return this._instances.has(uiName);
    }

    /**
     * 检查UI是否显示
     */
    public isUIShown(uiName: string): boolean {
        const instance = this._instances.get(uiName);
        return instance ? instance.state === UIState.SHOWN : false;
    }

    /**
     * 获取当前显示的UI列表
     */
    public getShownUIs(): string[] {
        return [...this._showStack];
    }

    /**
     * 获取顶层UI
     */
    public getTopUI(): string | undefined {
        return this._showStack[this._showStack.length - 1];
    }

    /**
     * 隐藏所有UI
     */
    public async hideAllUIs(): Promise<void> {
        const promises: Promise<void>[] = [];
        for (const uiName of [...this._showStack]) {
            promises.push(this.hideUI(uiName));
        }
        await Promise.all(promises);
    }

    /**
     * 关闭所有UI
     */
    public async closeAllUIs(): Promise<void> {
        const promises: Promise<void>[] = [];
        for (const uiName of this._instances.keys()) {
            promises.push(this.closeUI(uiName));
        }
        await Promise.all(promises);
    }

    /**
     * 添加事件监听器
     */
    public addEventListener(event: UIEvent, listener: UIEventListener): void {
        const listeners = this._eventListeners.get(event);
        if (listeners) {
            listeners.add(listener);
        }
    }

    /**
     * 移除事件监听器
     */
    public removeEventListener(event: UIEvent, listener: UIEventListener): void {
        const listeners = this._eventListeners.get(event);
        if (listeners) {
            listeners.delete(listener);
        }
    }

    /**
     * 清理缓存
     */
    public async clearCache(): Promise<void> {
        const instancesToDestroy: UIInstance[] = [];
        
        // 收集需要清理的实例
        for (const [uiName, instance] of this._instances) {
            if (instance.state === UIState.HIDDEN && instance.config.cacheable) {
                instancesToDestroy.push(instance);
            }
        }
        
        // 销毁收集到的实例
        const destroyPromises = instancesToDestroy.map(instance => 
            this.destroyUIInternal(instance)
        );
        
        await Promise.all(destroyPromises);
    }

    /**
     * 销毁管理器
     */
    public destroy(): void {
        this.closeAllUIs();
        this._configs.clear();
        this._instances.clear();
        this._showStack.length = 0;
        
        // 重新初始化事件监听器映射
        this._eventListeners.clear();
        for (const event of Object.values(UIEvent)) {
            this._eventListeners.set(event, new Set());
        }
        
        this._loader = null;
    }

    /**
     * 创建UI实例
     */
    private createInstance(config: UIConfig): UIInstance {
        const instance: UIInstance = {
            config,
            state: UIState.UNLOADED,
            createTime: Date.now(),
            lastAccessTime: Date.now()
        };

        this._instances.set(config.name, instance);
        return instance;
    }

    /**
     * 加载UI内部实现
     */
    private async loadUIInternal(instance: UIInstance): Promise<void> {
        if (instance.state !== UIState.UNLOADED) {
            return;
        }

        instance.state = UIState.LOADING;

        try {
            if (this._loader) {
                instance.view = await this._loader.loadUI(instance.config);
            }
            instance.state = UIState.LOADED;
        } catch (error) {
            instance.state = UIState.UNLOADED;
            throw error;
        }
    }

    /**
     * 显示UI内部实现
     */
    private async showUIInternal(instance: UIInstance): Promise<void> {
        if (instance.state === UIState.SHOWN || instance.state === UIState.SHOWING) {
            return;
        }

        instance.state = UIState.SHOWING;
        instance.lastAccessTime = Date.now();

        try {
            // 触发即将显示事件
            this.emitEvent(UIEvent.WILL_SHOW, instance.config.name, instance);

            // 执行显示动画
            await this.playShowAnimation(instance);

            // 添加到显示栈
            if (!this._showStack.includes(instance.config.name)) {
                this._showStack.push(instance.config.name);
            }

            instance.state = UIState.SHOWN;

            // 触发已显示事件
            this.emitEvent(UIEvent.DID_SHOW, instance.config.name, instance);
        } catch (error) {
            instance.state = UIState.LOADED;
            throw error;
        }
    }

    /**
     * 隐藏UI内部实现
     */
    private async hideUIInternal(instance: UIInstance): Promise<void> {
        if (instance.state === UIState.HIDDEN || instance.state === UIState.HIDING) {
            return;
        }

        instance.state = UIState.HIDING;

        try {
            // 触发即将隐藏事件
            this.emitEvent(UIEvent.WILL_HIDE, instance.config.name, instance);

            // 执行隐藏动画
            await this.playHideAnimation(instance);

            // 从显示栈移除
            const index = this._showStack.indexOf(instance.config.name);
            if (index !== -1) {
                this._showStack.splice(index, 1);
            }

            instance.state = UIState.HIDDEN;

            // 触发已隐藏事件
            this.emitEvent(UIEvent.DID_HIDE, instance.config.name, instance);
        } catch (error) {
            instance.state = UIState.SHOWN;
            throw error;
        }
    }

    /**
     * 销毁UI内部实现
     */
    private async destroyUIInternal(instance: UIInstance): Promise<void> {
        if (instance.state === UIState.DESTROYED || instance.state === UIState.DESTROYING) {
            return;
        }

        instance.state = UIState.DESTROYING;

        try {
            // 触发即将销毁事件
            this.emitEvent(UIEvent.WILL_DESTROY, instance.config.name, instance);

            // 销毁ViewModel
            if (instance.viewModel) {
                instance.viewModel.destroy();
                instance.viewModel = undefined;
            }

            // 卸载UI资源
            if (this._loader) {
                await this._loader.unloadUI(instance.config);
            }

            // 清理视图
            instance.view = undefined;
            instance.userData = undefined;

            instance.state = UIState.DESTROYED;

            // 从实例映射中移除
            this._instances.delete(instance.config.name);

            // 触发已销毁事件
            this.emitEvent(UIEvent.DID_DESTROY, instance.config.name, instance);
        } catch (error) {
            instance.state = UIState.HIDDEN;
            throw error;
        }
    }

    /**
     * 播放显示动画
     */
    private async playShowAnimation(instance: UIInstance): Promise<void> {
        // 这里可以集成具体的动画系统
        // 默认实现为空，由具体的UI框架实现
        const animation = instance.config.animation;
        if (animation && animation.showAnimation) {
            // 播放显示动画
            await this.delay(animation.duration || 300);
        }
    }

    /**
     * 播放隐藏动画
     */
    private async playHideAnimation(instance: UIInstance): Promise<void> {
        // 这里可以集成具体的动画系统
        // 默认实现为空，由具体的UI框架实现
        const animation = instance.config.animation;
        if (animation && animation.hideAnimation) {
            // 播放隐藏动画
            await this.delay(animation.duration || 300);
        }
    }

    /**
     * 触发事件
     */
    private emitEvent(event: UIEvent, uiName: string, instance: UIInstance, ...args: any[]): void {
        const listeners = this._eventListeners.get(event);
        if (listeners) {
            for (const listener of listeners) {
                try {
                    listener(uiName, instance, ...args);
                } catch (error) {
                    console.error(`UI事件监听器错误 [${event}]:`, error);
                }
            }
        }
    }

    /**
     * 延迟执行
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * 全局UI管理器实例
 */
export const uiManager = UIManager.getInstance(); 