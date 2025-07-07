import { IObservable, Observer } from './IObservable';

/**
 * 可观察对象基础类
 * 提供属性变化通知功能
 */
export class Observable implements IObservable {
    private _observers: Map<string | null, Set<Observer>> = new Map();
    private _isNotifying: boolean = false;

    /**
     * 添加观察者
     */
    public addObserver(property: string | null, observer: Observer): void {
        if (!this._observers.has(property)) {
            this._observers.set(property, new Set());
        }
        this._observers.get(property)!.add(observer);
    }

    /**
     * 移除观察者
     */
    public removeObserver(property: string | null, observer: Observer): void {
        const observers = this._observers.get(property);
        if (observers) {
            observers.delete(observer);
            if (observers.size === 0) {
                this._observers.delete(property);
            }
        }
    }

    /**
     * 移除所有观察者
     */
    public removeAllObservers(): void {
        this._observers.clear();
    }

    /**
     * 通知观察者
     */
    public notifyObservers(property: string, newValue: any, oldValue: any): void {
        if (this._isNotifying) {
            return; // 防止循环通知
        }

        this._isNotifying = true;

        try {
            // 通知特定属性的观察者
            const propertyObservers = this._observers.get(property);
            if (propertyObservers) {
                for (const observer of propertyObservers) {
                    observer(newValue, oldValue, property);
                }
            }

            // 通知全局观察者
            const globalObservers = this._observers.get(null);
            if (globalObservers) {
                for (const observer of globalObservers) {
                    observer(newValue, oldValue, property);
                }
            }
        } finally {
            this._isNotifying = false;
        }
    }

    /**
     * 设置属性值并通知观察者
     */
    protected setProperty<T>(property: string, value: T): void {
        const oldValue = (this as any)[property];
        if (oldValue !== value) {
            (this as any)[property] = value;
            this.notifyObservers(property, value, oldValue);
        }
    }

    /**
     * 获取属性值
     */
    protected getProperty<T>(property: string): T {
        return (this as any)[property];
    }

    /**
     * 批量设置属性（减少通知次数）
     */
    public batchUpdate(updates: Record<string, any>): void {
        const oldIsNotifying = this._isNotifying;
        this._isNotifying = true;

        const changes: Array<{ property: string; newValue: any; oldValue: any }> = [];

        try {
            for (const [property, value] of Object.entries(updates)) {
                const oldValue = (this as any)[property];
                if (oldValue !== value) {
                    (this as any)[property] = value;
                    changes.push({ property, newValue: value, oldValue });
                }
            }
        } finally {
            this._isNotifying = oldIsNotifying;
        }

        // 批量通知
        for (const change of changes) {
            this.notifyObservers(change.property, change.newValue, change.oldValue);
        }
    }

    /**
     * 销毁对象
     */
    public destroy(): void {
        this.removeAllObservers();
    }
}

/**
 * 创建可观察对象的工厂函数
 */
export function createObservable<T extends object>(target: T): T & IObservable {
    const observable = new Observable();
    
    // 创建代理对象
    return new Proxy(target, {
        get(obj: any, prop: string | symbol) {
            if (typeof prop === 'string' && prop in observable) {
                return (observable as any)[prop].bind(observable);
            }
            return obj[prop];
        },
        
        set(obj: any, prop: string | symbol, value: any) {
            if (typeof prop === 'string') {
                const oldValue = obj[prop];
                obj[prop] = value;
                if (oldValue !== value) {
                    observable.notifyObservers(prop, value, oldValue);
                }
            } else {
                obj[prop] = value;
            }
            return true;
        }
    }) as T & IObservable;
} 