import { UIConfig } from '../types/UITypes';

/**
 * UI加载器接口
 */
export interface IUILoader<TView = unknown> {
    /**
     * 加载UI资源
     */
    loadUI(config: UIConfig): Promise<TView>;
    
    /**
     * 卸载UI资源
     */
    unloadUI(config: UIConfig): Promise<void>;
    
    /**
     * 检查UI是否已加载
     */
    isLoaded(config: UIConfig): boolean;
}