/**
 * 类型安全绑定边界情况测试
 * 专注于错误处理、边界值和异常场景
 */
import { 
    ViewModel, 
    observable, 
    computed, 
    viewModel, 
    DataBinding, 
    BindingType, 
    BindingMode 
} from '../src/index';

@viewModel
class EdgeCaseViewModel extends ViewModel {
    public get name(): string { return 'EdgeCaseViewModel'; }

    @observable
    public nullValue: string | null = null;

    @observable
    public undefinedValue: string | undefined = undefined;

    @observable
    public emptyString: string = '';

    @observable
    public zeroNumber: number = 0;

    @observable
    public falseBoolean: boolean = false;

    @observable
    public emptyArray: any[] = [];

    @observable
    public emptyObject: object = {};

    @observable
    public circularRef: any = null;

    @observable
    public specialNumbers: {
        nan: number;
        infinity: number;
        negativeInfinity: number;
        maxSafeInteger: number;
        minSafeInteger: number;
    } = {
        nan: NaN,
        infinity: Infinity,
        negativeInfinity: -Infinity,
        maxSafeInteger: Number.MAX_SAFE_INTEGER,
        minSafeInteger: Number.MIN_SAFE_INTEGER
    };

    @observable
    public specialStrings: {
        empty: string;
        whitespace: string;
        newlines: string;
        unicode: string;
        html: string;
        json: string;
    } = {
        empty: '',
        whitespace: '   ',
        newlines: '\n\r\t',
        unicode: '🚀 测试 Unicode 字符串',
        html: '<div>HTML &amp; entities</div>',
        json: '{"key": "value", "nested": {"array": [1, 2, 3]}}'
    };

    @observable
    public deepNested: {
        level1: {
            level2: {
                level3: {
                    value: string;
                } | null;
            } | null;
        } | null;
    } | null = {
        level1: {
            level2: {
                level3: {
                    value: 'deep value'
                }
            }
        }
    };

    constructor() {
        super();
        
        // 创建循环引用
        this.circularRef = { self: null };
        this.circularRef.self = this.circularRef;
    }

    @computed(['nullValue', 'undefinedValue'])
    public get computedFromNullish(): string {
        return `${this.nullValue ?? 'NULL'} - ${this.undefinedValue ?? 'UNDEFINED'}`;
    }

    @computed(['emptyArray'])
    public get arrayLength(): number {
        return this.emptyArray.length;
    }
}

interface TestUIElement {
    textContent: string;
    innerHTML: string;
    value: string;
    className: string;
    title: string;
    dataset: Record<string, string>;
    style: Record<string, string>;
    customData: any;
}

function createTestElement(): TestUIElement {
    return {
        textContent: '',
        innerHTML: '',
        value: '',
        className: '',
        title: '',
        dataset: {},
        style: {},
        customData: null
    };
}

describe('类型安全绑定边界情况测试', () => {
    let viewModel: EdgeCaseViewModel;
    let dataBinding: DataBinding;

    beforeEach(() => {
        viewModel = new EdgeCaseViewModel();
        dataBinding = DataBinding.getInstance();
        dataBinding.unbindAll();
    });

    afterEach(() => {
        viewModel.destroy();
        dataBinding.unbindAll();
    });

    describe('空值和特殊值处理', () => {
        test('应该正确处理 null 值', () => {
            const element = createTestElement();

            dataBinding.bindSafe(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'nullValue',
                target: 'textContent',
                converter: 'string'
            });

            expect(element.textContent).toBe('null');

            viewModel.nullValue = 'not null';
            expect(element.textContent).toBe('not null');

            viewModel.nullValue = null;
            expect(element.textContent).toBe('null');
        });

        test('应该正确处理 undefined 值', () => {
            const element = createTestElement();

            dataBinding.bindSafe(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'undefinedValue',
                target: 'textContent',
                converter: 'string'
            });

            expect(element.textContent).toBe('undefined');

            viewModel.undefinedValue = 'defined';
            expect(element.textContent).toBe('defined');

            viewModel.undefinedValue = undefined;
            expect(element.textContent).toBe('undefined');
        });

        test('应该正确处理空字符串', () => {
            const element = createTestElement();

            dataBinding.bindSafe(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'emptyString',
                target: 'textContent'
            });

            expect(element.textContent).toBe('');

            viewModel.emptyString = 'not empty';
            expect(element.textContent).toBe('not empty');

            viewModel.emptyString = '';
            expect(element.textContent).toBe('');
        });

        test('应该正确处理 falsy 值', () => {
            const elements = {
                zero: createTestElement(),
                false: createTestElement(),
                empty: createTestElement()
            };

            dataBinding.bindSafe(viewModel, elements.zero, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'zeroNumber',
                target: 'textContent',
                converter: 'string'
            });

            dataBinding.bindSafe(viewModel, elements.false, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'falseBoolean',
                target: 'textContent',
                converter: 'string'
            });

            dataBinding.bindSafe(viewModel, elements.empty, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'emptyString',
                target: 'textContent'
            });

            expect(elements.zero.textContent).toBe('0');
            expect(elements.false.textContent).toBe('false');
            expect(elements.empty.textContent).toBe('');
        });
    });

    describe('特殊数字处理', () => {
        test('应该正确处理 NaN', () => {
            const element = createTestElement();

            dataBinding.bind(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'specialNumbers.nan',
                target: 'textContent',
                converter: 'string'
            });

            // 测试 NaN 的处理
            viewModel.specialNumbers = { ...viewModel.specialNumbers, nan: NaN };
            expect(element.textContent).toBe('NaN');
        });

        test('应该正确处理 Infinity', () => {
            const element = createTestElement();

            dataBinding.bind(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'specialNumbers.infinity',
                target: 'textContent',
                converter: 'string'
            });

            expect(element.textContent).toBe('Infinity');
        });

        test('应该正确处理大数值', () => {
            const element = createTestElement();

            dataBinding.bind(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'specialNumbers.maxSafeInteger',
                target: 'textContent',
                converter: 'string'
            });

            expect(element.textContent).toBe(Number.MAX_SAFE_INTEGER.toString());
        });
    });

    describe('特殊字符串处理', () => {
        test('应该正确处理包含HTML的字符串', () => {
            const textElement = createTestElement();
            const htmlElement = createTestElement();

            // 作为文本内容
            dataBinding.bind(viewModel, textElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'specialStrings.html',
                target: 'textContent'
            });

            // 作为HTML内容
            dataBinding.bind(viewModel, htmlElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'specialStrings.html',
                target: 'innerHTML'
            });

            expect(textElement.textContent).toBe('<div>HTML &amp; entities</div>');
            expect(htmlElement.innerHTML).toBe('<div>HTML &amp; entities</div>');
        });

        test('应该正确处理Unicode字符', () => {
            const element = createTestElement();

            dataBinding.bind(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'specialStrings.unicode',
                target: 'textContent'
            });

            expect(element.textContent).toBe('🚀 测试 Unicode 字符串');
        });

        test('应该正确处理换行符和空白字符', () => {
            const element = createTestElement();

            dataBinding.bind(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'specialStrings.newlines',
                target: 'textContent'
            });

            expect(element.textContent).toBe('\n\r\t');
        });
    });

    describe('深层嵌套对象处理', () => {
        test('应该正确处理深层嵌套属性', () => {
            const element = createTestElement();

            dataBinding.bind(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'deepNested.level1.level2.level3.value',
                target: 'textContent'
            });

            expect(element.textContent).toBe('deep value');

            // 修改深层值
            if (viewModel.deepNested?.level1?.level2?.level3) {
                viewModel.deepNested = {
                    level1: {
                        level2: {
                            level3: {
                                value: 'modified deep value'
                            }
                        }
                    }
                };
            }

            expect(element.textContent).toBe('modified deep value');
        });

        test('应该正确处理中间层为null的情况', () => {
            const element = createTestElement();

            dataBinding.bind(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'deepNested.level1.level2.level3.value',
                target: 'textContent'
            });

            // 将中间层设为null
            viewModel.deepNested = {
                level1: {
                    level2: null
                }
            };

            expect(element.textContent).toBe('');
        });
    });

    describe('计算属性边界情况', () => {
        test('应该正确处理依赖null值的计算属性', () => {
            const element = createTestElement();

            dataBinding.bindSafe(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'computedFromNullish',
                target: 'textContent'
            });

            expect(element.textContent).toBe('NULL - UNDEFINED');

            viewModel.nullValue = 'not null';
            viewModel.undefinedValue = 'not undefined';

            expect(element.textContent).toBe('not null - not undefined');
        });

        test('应该正确处理数组长度计算属性', () => {
            const element = createTestElement();

            dataBinding.bindSafe(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'arrayLength',
                target: 'textContent',
                converter: 'string'
            });

            expect(element.textContent).toBe('0');

            viewModel.emptyArray = [1, 2, 3];
            expect(element.textContent).toBe('3');

            viewModel.emptyArray = [];
            expect(element.textContent).toBe('0');
        });
    });

    describe('转换器边界情况', () => {
        test('应该正确处理转换器异常', () => {
            const element = createTestElement();

            // 注册可能抛异常的转换器
            dataBinding.registerTypeSafeConverter('mayThrow', {
                convert: (value: any) => {
                    if (value === 'throw') {
                        throw new Error('Converter error');
                    }
                    return String(value);
                }
            });

            dataBinding.bind(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'emptyString',
                target: 'textContent',
                converter: 'mayThrow'
            });

            // 正常情况
            viewModel.emptyString = 'normal';
            expect(element.textContent).toBe('normal');

            // 不应该因为转换器异常导致程序崩溃
            expect(() => {
                viewModel.emptyString = 'throw';
            }).not.toThrow();
        });

        test('应该正确处理循环引用对象', () => {
            const element = createTestElement();

            // 注册安全的JSON转换器
            dataBinding.registerTypeSafeConverter('safeJson', {
                convert: (value: any) => {
                    try {
                        return JSON.stringify(value);
                    } catch (error) {
                        return '[Circular Reference]';
                    }
                }
            });

            dataBinding.bind(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'circularRef',
                target: 'textContent',
                converter: 'safeJson'
            });

            expect(element.textContent).toBe('[Circular Reference]');
        });

        test('应该处理转换器返回null或undefined', () => {
            const element = createTestElement();

            dataBinding.registerTypeSafeConverter('nullReturner', {
                convert: (value: any) => {
                    if (value === 'null') return null;
                    if (value === 'undefined') return undefined;
                    return String(value);
                }
            });

            dataBinding.bind(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'emptyString',
                target: 'textContent',
                converter: 'nullReturner'
            });

            viewModel.emptyString = 'null';
            expect(element.textContent).toBe(''); // null被转换为空字符串

            viewModel.emptyString = 'undefined';
            expect(element.textContent).toBe(''); // undefined被转换为空字符串
        });
    });

    describe('Fluent API 边界情况', () => {
        test('应该正确处理绑定到不存在的目标', () => {
            const result = dataBinding
                .from(viewModel)
                .property('emptyString')
                .to(null as any, 'textContent' as any)
                .bind({
                    type: BindingType.ONE_WAY,
                    mode: BindingMode.REPLACE
                });

            expect(result.success).toBe(false);
            expect(result.error).toBeTruthy();
        });

        test('应该处理快捷绑定的异常情况', () => {
            const result = dataBinding.quick.oneWay(
                viewModel,
                'emptyString',
                null as any,
                'textContent' as any
            );

            expect(result.success).toBe(false);
            expect(result.error).toBeTruthy();
        });
    });

    describe('批量操作边界情况', () => {
        test('应该正确处理空的批量管理器', () => {
            const batchManager = dataBinding.createBatchManager();

            expect(batchManager.getSuccessCount()).toBe(0);
            expect(batchManager.getFailureCount()).toBe(0);
            expect(batchManager.getErrors()).toEqual([]);

            // 调用清理不应该出错
            expect(() => batchManager.unbindAll()).not.toThrow();
        });

        test('应该正确统计混合结果', () => {
            const batchManager = dataBinding.createBatchManager();
            const element = createTestElement();

            // 添加成功的绑定
            const successResult = dataBinding.quick.oneWay(
                viewModel,
                'emptyString',
                element,
                'textContent'
            );

            // 添加失败的绑定结果
            const failureResult = {
                id: '',
                success: false,
                error: 'Test error'
            };

            const anotherFailureResult = {
                id: '',
                success: false,
                error: 'Another test error'
            };

            batchManager
                .add(successResult)
                .add(failureResult)
                .add(anotherFailureResult);

            expect(batchManager.getSuccessCount()).toBe(1);
            expect(batchManager.getFailureCount()).toBe(2);
            expect(batchManager.getErrors()).toEqual(['Test error', 'Another test error']);
        });
    });

    describe('内存泄漏预防', () => {
        test('应该正确清理已销毁ViewModel的引用', () => {
            const element = createTestElement();
            const tempViewModel = new EdgeCaseViewModel();

            const bindingId = dataBinding.bindSafe(tempViewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'emptyString',
                target: 'textContent'
            });

            expect(dataBinding.getBinding(bindingId)).toBeTruthy();

            // 销毁ViewModel
            tempViewModel.destroy();

            // 绑定仍然存在但应该不再响应变化
            expect(dataBinding.getBinding(bindingId)).toBeTruthy();

            // 手动清理绑定
            dataBinding.unbind(bindingId);
            expect(dataBinding.getBinding(bindingId)).toBeUndefined();
        });

        test('应该正确处理大量绑定创建和销毁', () => {
            const bindings: string[] = [];
            const elements: TestUIElement[] = [];

            // 创建大量绑定
            for (let i = 0; i < 500; i++) {
                const element = createTestElement();
                elements.push(element);

                const bindingId = dataBinding.bindSafe(viewModel, element, {
                    type: BindingType.ONE_WAY,
                    mode: BindingMode.REPLACE,
                    source: 'emptyString',
                    target: 'textContent'
                });
                bindings.push(bindingId);
            }

            expect(dataBinding.getAllBindings()).toHaveLength(500);

            // 随机销毁一半绑定
            const toDestroy = bindings.filter((_, index) => index % 2 === 0);
            toDestroy.forEach(id => dataBinding.unbind(id));

            expect(dataBinding.getAllBindings()).toHaveLength(250);

            // 清理剩余绑定
            dataBinding.unbindAll();
            expect(dataBinding.getAllBindings()).toHaveLength(0);
        });
    });

    describe('类型转换边界情况', () => {
        test('应该正确处理不同类型间的转换', () => {
            const elements = {
                numberToString: createTestElement(),
                booleanToString: createTestElement(),
                objectToString: createTestElement()
            };

            // 数字到字符串
            dataBinding.bindSafe(viewModel, elements.numberToString, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'zeroNumber',
                target: 'textContent',
                converter: 'string'
            });

            // 布尔到字符串
            dataBinding.bindSafe(viewModel, elements.booleanToString, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'falseBoolean',
                target: 'textContent',
                converter: 'string'
            });

            // 对象到字符串
            dataBinding.bindSafe(viewModel, elements.objectToString, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'emptyObject',
                target: 'textContent',
                converter: 'string'
            });

            expect(elements.numberToString.textContent).toBe('0');
            expect(elements.booleanToString.textContent).toBe('false');
            expect(elements.objectToString.textContent).toBe('[object Object]');
        });
    });
});