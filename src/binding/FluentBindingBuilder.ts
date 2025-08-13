/**
 * Fluent API 绑定构建器
 * 提供链式调用的流畅API体验
 */

import { IObservable } from '../core/IObservable';
import { DataBinding, BindingType, BindingMode } from './DataBinding';
import {
    ObservableKeys,
    WritableKeys,
    ConverterName,
    SafeBindingConfig,
    BindingOptions,
    SafeBindingResult,
    ITypeSafeBindingBuilder,
    IPropertyBindingBuilder,
    ITargetBindingBuilder,
    IConverterBindingBuilder
} from './TypeSafeBinding';

/**
 * 类型安全的绑定构建器
 */
export class TypeSafeBindingBuilder<TSource extends object>
    implements ITypeSafeBindingBuilder<TSource> {
    
    constructor(
        private dataBinding: DataBinding,
        private source: TSource & IObservable
    ) {}

    /**
     * 选择源属性
     */
    public property<TKey extends ObservableKeys<TSource>>(
        key: TKey
    ): IPropertyBindingBuilder<TSource, TKey> {
        return new PropertyBindingBuilder(this.dataBinding, this.source, key);
    }
}

/**
 * 属性绑定构建器
 */
export class PropertyBindingBuilder<
    TSource extends object,
    TSourceKey extends ObservableKeys<TSource>
> implements IPropertyBindingBuilder<TSource, TSourceKey> {
    
    constructor(
        private dataBinding: DataBinding,
        private source: TSource & IObservable,
        private sourceKey: TSourceKey
    ) {}

    /**
     * 指定目标对象和属性
     */
    public to<TTarget extends object, TTargetKey extends WritableKeys<TTarget>>(
        target: TTarget,
        targetKey: TTargetKey
    ): ITargetBindingBuilder<TSource, TTarget, TSourceKey, TTargetKey> {
        return new TargetBindingBuilder(
            this.dataBinding,
            this.source,
            this.sourceKey,
            target,
            targetKey
        );
    }
}

/**
 * 目标绑定构建器
 */
export class TargetBindingBuilder<
    TSource extends object,
    TTarget extends object,
    TSourceKey extends ObservableKeys<TSource>,
    TTargetKey extends WritableKeys<TTarget>
> implements ITargetBindingBuilder<TSource, TTarget, TSourceKey, TTargetKey> {
    
    constructor(
        private dataBinding: DataBinding,
        private source: TSource & IObservable,
        private sourceKey: TSourceKey,
        private target: TTarget,
        private targetKey: TTargetKey
    ) {}

    /**
     * 使用转换器
     */
    public withConverter<TConverter extends ConverterName>(
        converter: TConverter
    ): IConverterBindingBuilder<TSource, TTarget, TSourceKey, TTargetKey, TConverter> {
        return new ConverterBindingBuilder(
            this.dataBinding,
            this.source,
            this.sourceKey,
            this.target,
            this.targetKey,
            converter
        );
    }

    /**
     * 直接绑定（无转换器）
     */
    public bind(options: BindingOptions): SafeBindingResult {
        try {
            // 类型检查在编译时完成，这里直接调用绑定
            const config = {
                ...options,
                source: this.sourceKey as string,
                target: this.targetKey as string
            };

            const bindingId = this.dataBinding.bind(this.source, this.target, config);
            
            return {
                id: bindingId,
                success: true
            };
        } catch (error) {
            return {
                id: '',
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}

/**
 * 转换器绑定构建器
 */
export class ConverterBindingBuilder<
    TSource extends object,
    TTarget extends object,
    TSourceKey extends ObservableKeys<TSource>,
    TTargetKey extends WritableKeys<TTarget>,
    TConverter extends ConverterName
> implements IConverterBindingBuilder<TSource, TTarget, TSourceKey, TTargetKey, TConverter> {
    
    constructor(
        private dataBinding: DataBinding,
        private source: TSource & IObservable,
        private sourceKey: TSourceKey,
        private target: TTarget,
        private targetKey: TTargetKey,
        private converter: TConverter
    ) {}

    /**
     * 完成绑定
     */
    public bind(options: Omit<BindingOptions, 'converter'>): SafeBindingResult {
        try {
            const config = {
                ...options,
                source: this.sourceKey as string,
                target: this.targetKey as string,
                converter: this.converter
            };

            const bindingId = this.dataBinding.bind(this.source, this.target, config);
            
            return {
                id: bindingId,
                success: true
            };
        } catch (error) {
            return {
                id: '',
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}

/**
 * 绑定构建器工厂
 */
export class BindingBuilderFactory {
    constructor(private dataBinding: DataBinding) {}

    /**
     * 创建类型安全的绑定构建器
     */
    public from<TSource extends object>(
        source: TSource & IObservable
    ): TypeSafeBindingBuilder<TSource> {
        return new TypeSafeBindingBuilder(this.dataBinding, source);
    }
}

/**
 * 快捷绑定函数集合
 */
export class QuickBinding {
    constructor(private dataBinding: DataBinding) {}

    /**
     * 快速创建单向绑定
     */
    public oneWay<
        TSource extends object,
        TTarget extends object,
        TSourceKey extends ObservableKeys<TSource>,
        TTargetKey extends WritableKeys<TTarget>
    >(
        source: TSource & IObservable,
        sourceKey: TSourceKey,
        target: TTarget,
        targetKey: TTargetKey,
        converter?: ConverterName
    ): SafeBindingResult {
        const builder = new TypeSafeBindingBuilder(this.dataBinding, source)
            .property(sourceKey)
            .to(target, targetKey);

        if (converter) {
            return (builder as any).withConverter(converter).bind({
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE
            });
        } else {
            return builder.bind({
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE
            });
        }
    }

    /**
     * 快速创建双向绑定
     */
    public twoWay<
        TSource extends object,
        TTarget extends object,
        TSourceKey extends ObservableKeys<TSource>,
        TTargetKey extends WritableKeys<TTarget>
    >(
        source: TSource & IObservable,
        sourceKey: TSourceKey,
        target: TTarget,
        targetKey: TTargetKey,
        converter?: ConverterName
    ): SafeBindingResult {
        const builder = new TypeSafeBindingBuilder(this.dataBinding, source)
            .property(sourceKey)
            .to(target, targetKey);

        if (converter) {
            return (builder as any).withConverter(converter).bind({
                type: BindingType.TWO_WAY,
                mode: BindingMode.REPLACE
            });
        } else {
            return builder.bind({
                type: BindingType.TWO_WAY,
                mode: BindingMode.REPLACE
            });
        }
    }

    /**
     * 快速创建一次性绑定
     */
    public oneTime<
        TSource extends object,
        TTarget extends object,
        TSourceKey extends ObservableKeys<TSource>,
        TTargetKey extends WritableKeys<TTarget>
    >(
        source: TSource & IObservable,
        sourceKey: TSourceKey,
        target: TTarget,
        targetKey: TTargetKey,
        converter?: ConverterName
    ): SafeBindingResult {
        const builder = new TypeSafeBindingBuilder(this.dataBinding, source)
            .property(sourceKey)
            .to(target, targetKey);

        if (converter) {
            return (builder as any).withConverter(converter).bind({
                type: BindingType.ONE_TIME,
                mode: BindingMode.REPLACE
            });
        } else {
            return builder.bind({
                type: BindingType.ONE_TIME,
                mode: BindingMode.REPLACE
            });
        }
    }

    /**
     * 快速创建格式化绑定
     */
    public format<
        TSource extends object,
        TTarget extends object,
        TSourceKey extends ObservableKeys<TSource>,
        TTargetKey extends WritableKeys<TTarget>
    >(
        source: TSource & IObservable,
        sourceKey: TSourceKey,
        target: TTarget,
        targetKey: TTargetKey,
        formatString: string,
        converter?: ConverterName
    ): SafeBindingResult {
        const builder = new TypeSafeBindingBuilder(this.dataBinding, source)
            .property(sourceKey)
            .to(target, targetKey);

        const options = {
            type: BindingType.ONE_WAY,
            mode: BindingMode.FORMAT,
            format: formatString
        };

        if (converter) {
            return (builder as any).withConverter(converter).bind(options);
        } else {
            return builder.bind(options);
        }
    }
}

/**
 * 批量绑定管理器
 */
export class BatchBindingManager {
    private bindings: SafeBindingResult[] = [];
    
    constructor(private dataBinding: DataBinding) {}

    /**
     * 添加绑定到批处理
     */
    public add(binding: SafeBindingResult): this {
        this.bindings.push(binding);
        return this;
    }

    /**
     * 执行批量绑定
     */
    public execute(): SafeBindingResult[] {
        return this.bindings;
    }

    /**
     * 取消所有绑定
     */
    public unbindAll(): void {
        this.bindings.forEach(binding => {
            if (binding.success) {
                this.dataBinding.unbind(binding.id);
            }
        });
        this.bindings = [];
    }

    /**
     * 获取成功的绑定数量
     */
    public getSuccessCount(): number {
        return this.bindings.filter(b => b.success).length;
    }

    /**
     * 获取失败的绑定数量
     */
    public getFailureCount(): number {
        return this.bindings.filter(b => !b.success).length;
    }

    /**
     * 获取所有错误信息
     */
    public getErrors(): string[] {
        return this.bindings
            .filter(b => !b.success && b.error)
            .map(b => b.error!);
    }
}

/**
 * 扩展DataBinding类以支持Fluent API
 */
export interface FluentDataBindingExtension {
    /**
     * 创建绑定构建器工厂
     */
    createBuilderFactory(): BindingBuilderFactory;
    
    /**
     * 创建快捷绑定工具
     */
    createQuickBinding(): QuickBinding;
    
    /**
     * 创建批量绑定管理器
     */
    createBatchManager(): BatchBindingManager;
}