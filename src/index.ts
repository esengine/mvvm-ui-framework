// 核心功能
export * from './core/IObservable';
export * from './core/Observable';
export * from './core/ViewModel';
export * from './core/Decorators';
export { DecoratorUtils } from './core/Decorators';

// 管理器
export * from './managers/UIManager';
import { UIManager } from './managers/UIManager';
export { 
    ui, 
    getUIConfig, 
    getViewModelByUIName,
    uiComponent,
    getUIComponentConfig,
    getCurrentViewModel,
    UIOperations, 
    UILayerRegistry, 
    DEFAULT_UI_LAYERS,
    type UILayerValue,
    type ViewModelConstraint,
    type UIComponentConfig
} from './managers/UIManager';

// 数据绑定
export * from './binding/DataBinding';
export * from './binding/TypeSafeBinding';
export * from './binding/ConverterRegistry';
export * from './binding/FluentBindingBuilder';

// 版本信息
export const VERSION = '1.0.0';

// 默认导出
export { UIManager, uiManager } from './managers/UIManager';
export { DataBinding, dataBinding } from './binding/DataBinding';
export { Observable, createObservable } from './core/Observable';
export { ViewModel } from './core/ViewModel';

// 类型安全绑定相关导出
export { 
    BindingBuilderFactory, 
    QuickBinding, 
    BatchBindingManager 
} from './binding/FluentBindingBuilder';
export { 
    converterRegistry, 
    ConverterRegistry, 
    registerConverter,
    getConverter 
} from './binding/ConverterRegistry';

/**
 * UI框架初始化选项
 */
export interface UIFrameworkOptions {
    /** 是否启用调试模式 */
    debug?: boolean;
    /** 默认UI加载器 */
    defaultLoader?: any;
    /** 默认动画配置 */
    defaultAnimation?: any;
}

/**
 * 初始化UI框架
 */
export function initializeUIFramework(options: UIFrameworkOptions = {}): void {
    const { debug = false, defaultLoader } = options;
    
    if (debug) {
        console.log(`UI Framework v${VERSION} 初始化中...`);
    }
    
    // 设置默认加载器
    if (defaultLoader) {
        const manager = UIManager.getInstance();
        manager.setLoader(defaultLoader);
    }
    
    if (debug) {
        console.log('UI Framework 初始化完成');
    }
}

/**
 * 获取UI框架信息
 */
export function getUIFrameworkInfo(): { version: string; features: string[] } {
    return {
        version: VERSION,
        features: [
            'MVVM数据绑定',
            'UI生命周期管理',
            '命令模式支持',
            '可观察对象',
            '值转换器',
            '事件系统',
            '缓存管理',
            '动画支持',
            '装饰器支持'
        ]
    };
} 