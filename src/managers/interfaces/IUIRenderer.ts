/**
 * UI渲染器接口
 * 负责UI的显示、隐藏、层级管理等具体操作
 */
export interface IUIRenderer<TView = unknown> {
    /**
     * 设置UI根节点
     */
    setUIRoot(root: TView): void;
    
    /**
     * 获取UI根节点
     */
    getUIRoot(): TView | null;
    
    /**
     * 将UI添加到父节点
     */
    addUIToParent(view: TView, parent: TView): void;
    
    /**
     * 从父节点移除UI
     */
    removeUIFromParent(view: TView): void;
    
    /**
     * 设置UI层级
     */
    setUILayer(view: TView, layer: number): void;
    
    /**
     * 设置UI可见性
     */
    setUIVisible(view: TView, visible: boolean): void;
}