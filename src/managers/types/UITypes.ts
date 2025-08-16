import { ViewModel } from '../../core/ViewModel';

/**
 * ViewModel约束类型
 */
export type ViewModelConstraint = { new(...args: any[]): ViewModel };

/**
 * UI层级值类型
 */
export type UILayerValue = number | string;

/**
 * UI动画函数类型
 */
export type UIAnimationFunction<TView = unknown> = (view: TView) => Promise<void>;

/**
 * UI动画配置
 */
export interface UIAnimationConfig<TView = unknown> {
    /** 显示动画函数 */
    showAnimation?: UIAnimationFunction<TView>;
    /** 隐藏动画函数 */
    hideAnimation?: UIAnimationFunction<TView>;
}

/**
 * UI界面配置
 */
export interface UIConfig<TViewModel extends ViewModel = ViewModel, TView = unknown> {
    /** 界面名称 */
    name: string;
    /** 界面路径或标识 */
    path: string;
    /** 是否为模态窗口 */
    modal?: boolean;
    /** 是否可以缓存 */
    cacheable?: boolean;
    /** 界面层级（支持数字或层级名称） */
    layer?: UILayerValue;
    /** 动画配置 */
    animation?: UIAnimationConfig<TView>;
    /** 预加载 */
    preload?: boolean;
    /** ViewModel类型（用于类型推断） */
    viewModelType?: ViewModelConstraint;
    /** 自定义数据 */
    data?: any;
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
export interface UIInstance<TViewModel extends ViewModel = ViewModel, TView = unknown> {
    /** 配置 */
    config: UIConfig<TViewModel, TView>;
    /** 状态 */
    state: UIState;
    /** 视图模型 */
    viewModel?: TViewModel;
    /** 视图对象（由具体UI框架提供） */
    view?: TView;
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