import { UILayerValue } from '../types/UITypes';

/**
 * 默认UI层级定义
 */
export const DEFAULT_UI_LAYERS = {
    /** 背景层 */
    BACKGROUND: 0,
    /** 主界面层 */
    MAIN: 100,
    /** 弹窗层 */
    POPUP: 200,
    /** 提示层 */
    TIPS: 300,
    /** 顶层 */
    TOP: 400
} as const;

/**
 * UI层级注册管理器
 */
export class UILayerRegistry {
    private static layers = new Map<string, number>(
        Object.entries(DEFAULT_UI_LAYERS)
    );

    /**
     * 注册自定义层级
     */
    public static registerLayer(name: string, value: number): void {
        this.layers.set(name, value);
    }

    /**
     * 获取层级值
     */
    public static getLayer(name: string): number | undefined {
        return this.layers.get(name);
    }

    /**
     * 解析层级值
     */
    public static resolveLayer(layer: UILayerValue): number {
        if (typeof layer === 'number') {
            return layer;
        }
        const resolvedValue = this.getLayer(layer);
        if (resolvedValue === undefined) {
            console.warn(`未找到层级 '${layer}'，使用默认值 ${DEFAULT_UI_LAYERS.MAIN}`);
            return DEFAULT_UI_LAYERS.MAIN;
        }
        return resolvedValue;
    }

    /**
     * 获取所有已注册的层级
     */
    public static getAllLayers(): Record<string, number> {
        return Object.fromEntries(this.layers);
    }

    /**
     * 清除所有自定义层级（保留默认层级）
     */
    public static reset(): void {
        this.layers.clear();
        Object.entries(DEFAULT_UI_LAYERS).forEach(([name, value]) => {
            this.layers.set(name, value);
        });
    }
}