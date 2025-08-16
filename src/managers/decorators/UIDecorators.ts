import 'reflect-metadata';
import { ViewModel } from '../../core/ViewModel';
import { UIConfig, ViewModelConstraint } from '../types/UITypes';
import { UILayerRegistry, DEFAULT_UI_LAYERS } from '../layers/UILayerRegistry';
import { UIManager } from '../UIManager';

/**
 * UI元数据键
 */
const UI_CONFIG_KEY = Symbol('ui:config');

/**
 * UI组件元数据键
 */
const UI_COMPONENT_KEY = Symbol('ui:component');

/**
 * UI组件配置
 */
export interface UIComponentConfig {
    /** 关联的ViewModel类型 */
    viewModelType: ViewModelConstraint;
    /** UI名称（可选，默认从ViewModel的@ui装饰器获取） */
    uiName?: string;
}

/**
 * UI装饰器
 * 用于装饰ViewModel类，声明对应的UI配置
 */
export function ui<TViewModel extends ViewModel, TView = unknown>(config: UIConfig<TViewModel, TView>) {
    return function <T extends new (...args: any[]) => TViewModel>(constructor: T) {
        // 处理层级值
        const processedConfig = {
            ...config,
            layer: config.layer !== undefined ? UILayerRegistry.resolveLayer(config.layer) : DEFAULT_UI_LAYERS.MAIN
        };
        
        // 保存UI配置到元数据
        Reflect.defineMetadata(UI_CONFIG_KEY, processedConfig, constructor);
        
        // 自动注册UI到管理器
        UIManager.getInstance().registerUI(processedConfig);
        
        return constructor;
    };
}

/**
 * 获取ViewModel类的UI配置
 */
export function getUIConfig<T extends ViewModel>(target: T): UIConfig<T> | undefined;
export function getUIConfig(target: any): UIConfig | undefined;
export function getUIConfig(target: any): UIConfig | undefined {
    return Reflect.getMetadata(UI_CONFIG_KEY, target.constructor);
}

/**
 * UI组件装饰器
 * 自动关联ViewModel和UI组件
 */
export function uiComponent<TViewModel extends ViewModel>(
    viewModelClass: new (...args: any[]) => TViewModel,
    uiName?: string
) {
    return function <T extends new (...args: any[]) => any>(constructor: T) {
        // 获取ViewModel的UI配置
        const viewModelConfig = Reflect.getMetadata(UI_CONFIG_KEY, viewModelClass);
        const resolvedUIName = uiName || viewModelConfig?.name;
        
        if (!resolvedUIName) {
            throw new Error(`无法确定UI名称，请在ViewModel上使用@ui装饰器或在@uiComponent中指定uiName`);
        }
        
        const config: UIComponentConfig = {
            viewModelType: viewModelClass,
            uiName: resolvedUIName
        };
        
        // 保存配置到元数据
        Reflect.defineMetadata(UI_COMPONENT_KEY, config, constructor);
        
        return constructor;
    };
}

/**
 * 获取UI组件的配置
 */
export function getUIComponentConfig(target: any): UIComponentConfig | undefined {
    return Reflect.getMetadata(UI_COMPONENT_KEY, target.constructor);
}