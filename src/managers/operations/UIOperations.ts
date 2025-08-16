import { ViewModel } from '../../core/ViewModel';
import { UIInstance, UIConfig } from '../types/UITypes';
import { getUIConfig, getUIComponentConfig } from '../decorators/UIDecorators';
import { UIManager } from '../UIManager';

/**
 * UI操作工具类
 * 为ViewModel提供类型安全的UI操作方法
 */
export class UIOperations {
    /**
     * 关闭指定实例的UI
     */
    public static closeUI<T extends ViewModel>(instance: T): void {
        const config = getUIConfig(instance);
        if (config) {
            UIManager.getInstance().closeUI(config.name).catch(error => {
                console.error(`关闭UI失败 [${config.name}]:`, error);
            });
        } else {
            console.warn('未找到UI配置，无法关闭UI');
        }
    }

    /**
     * 隐藏指定实例的UI
     */
    public static hideUI<T extends ViewModel>(instance: T): void {
        const config = getUIConfig(instance);
        if (config) {
            UIManager.getInstance().hideUI(config.name).catch(error => {
                console.error(`隐藏UI失败 [${config.name}]:`, error);
            });
        } else {
            console.warn('未找到UI配置，无法隐藏UI');
        }
    }

    /**
     * 检查指定实例的UI是否显示
     */
    public static isUIShown<T extends ViewModel>(instance: T): boolean {
        const config = getUIConfig(instance);
        return config ? UIManager.getInstance().isUIShown(config.name) : false;
    }

    /**
     * 显示UI
     */
    public static async showUI<T extends ViewModel>(
        viewModel: T, 
        userData?: any
    ): Promise<UIInstance<T, unknown>> {
        const config = getUIConfig(viewModel);
        if (config) {
            return UIManager.getInstance().showUI(config.name, viewModel, userData) as Promise<UIInstance<T, unknown>>;
        } else {
            throw new Error('未找到UI配置，无法显示UI');
        }
    }

    /**
     * 获取指定实例的UI配置
     */
    public static getConfig<T extends ViewModel>(instance: T): UIConfig<T> | undefined {
        return getUIConfig(instance) as UIConfig<T> | undefined;
    }
}

/**
 * 通过UI名称获取对应的ViewModel实例
 */
export function getViewModelByUIName<T extends ViewModel = ViewModel>(uiName: string): T | undefined {
    const manager = UIManager.getInstance();
    const instance = manager.getUI(uiName);
    return instance?.viewModel as T | undefined;
}

/**
 * 获取当前UI组件对应的ViewModel实例
 */
export function getCurrentViewModel<T extends ViewModel = ViewModel>(component: any): T | undefined {
    const config = getUIComponentConfig(component);
    if (!config) {
        return undefined;
    }
    
    return getViewModelByUIName<T>(config.uiName!);
}