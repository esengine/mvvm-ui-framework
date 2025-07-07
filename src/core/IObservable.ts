/**
 * 观察者回调函数类型
 */
export type Observer<T = any> = (newValue: T, oldValue: T, property: string) => void;

/**
 * 可观察对象接口
 */
export interface IObservable {
    /**
     * 添加观察者
     * @param property 属性名，为空则监听所有属性
     * @param observer 观察者回调
     */
    addObserver(property: string | null, observer: Observer): void;

    /**
     * 移除观察者
     * @param property 属性名
     * @param observer 观察者回调
     */
    removeObserver(property: string | null, observer: Observer): void;

    /**
     * 移除所有观察者
     */
    removeAllObservers(): void;

    /**
     * 通知观察者
     * @param property 属性名
     * @param newValue 新值
     * @param oldValue 旧值
     */
    notifyObservers(property: string, newValue: any, oldValue: any): void;
}

/**
 * 可观察数组接口
 */
export interface IObservableArray<T> extends Array<T>, IObservable {
    /**
     * 添加数组变化观察者
     * @param observer 观察者回调
     */
    addArrayObserver(observer: ArrayObserver<T>): void;

    /**
     * 移除数组变化观察者
     * @param observer 观察者回调
     */
    removeArrayObserver(observer: ArrayObserver<T>): void;
}

/**
 * 数组变化观察者类型
 */
export type ArrayObserver<T> = (
    action: ArrayAction,
    items: T[],
    index: number,
    deleteCount?: number
) => void;

/**
 * 数组操作类型
 */
export enum ArrayAction {
    ADD = 'add',
    REMOVE = 'remove',
    REPLACE = 'replace',
    CLEAR = 'clear',
    SORT = 'sort',
    REVERSE = 'reverse'
} 