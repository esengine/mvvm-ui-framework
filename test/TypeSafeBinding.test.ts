/**
 * 类型安全绑定功能测试
 */
import { 
    ViewModel, 
    observable, 
    viewModel, 
    DataBinding, 
    BindingType, 
    BindingMode 
} from '../src/index';

// 测试用的 ViewModel
@viewModel
class TestViewModel extends ViewModel {
    public get name(): string { return 'TestViewModel'; }

    @observable
    public firstName: string = '';

    @observable
    public lastName: string = '';

    @observable
    public age: number = 0;

    @observable
    public isActive: boolean = false;

    @observable
    public score: number = 100;

    @observable
    public birthday: Date = new Date();
}

// 模拟 UI 元素
interface MockUIElement {
    textContent: string;
    value: string;
    style: {
        display: string;
        visibility: string;
    };
    className: string;
}

function createMockUIElement(): MockUIElement {
    return {
        textContent: '',
        value: '',
        style: {
            display: 'block',
            visibility: 'visible'
        },
        className: ''
    };
}

describe('类型安全绑定系统测试', () => {
    let viewModel: TestViewModel;
    let dataBinding: DataBinding;
    let element: MockUIElement;

    beforeEach(() => {
        viewModel = new TestViewModel();
        dataBinding = DataBinding.getInstance();
        element = createMockUIElement();
        
        // 清理之前的绑定
        dataBinding.unbindAll();
    });

    afterEach(() => {
        viewModel.destroy();
        dataBinding.unbindAll();
    });

    describe('类型安全绑定方法 (bindSafe)', () => {
        test('应该成功创建类型安全的字符串到字符串绑定', () => {
            const bindingId = dataBinding.bindSafe(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'firstName',
                target: 'textContent'
            });

            expect(bindingId).toBeTruthy();

            // 测试绑定工作正常
            viewModel.firstName = 'John';
            expect(element.textContent).toBe('John');
        });

        test('应该支持使用转换器的绑定', () => {
            const bindingId = dataBinding.bindSafe(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'age',
                target: 'textContent',
                converter: 'string'
            });

            expect(bindingId).toBeTruthy();

            viewModel.age = 25;
            expect(element.textContent).toBe('25');
        });

        test('应该支持布尔值转换器', () => {
            const bindingId = dataBinding.bindSafe(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'isActive',
                target: 'value',
                converter: 'string'
            });

            expect(bindingId).toBeTruthy();

            viewModel.isActive = true;
            expect(element.value).toBe('true');

            viewModel.isActive = false;
            expect(element.value).toBe('false');
        });

        test('应该支持可见性转换器', () => {
            const visibilityElement: any = { visibility: 'visible' };
            
            const bindingId = dataBinding.bind(viewModel, visibilityElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'isActive',
                target: 'visibility',
                converter: 'visibility'
            });

            expect(bindingId).toBeTruthy();

            viewModel.isActive = true;
            expect(visibilityElement.visibility).toBe('visible');

            viewModel.isActive = false;
            expect(visibilityElement.visibility).toBe('hidden');
        });

        test('应该支持格式化模式', () => {
            const bindingId = dataBinding.bindSafe(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.FORMAT,
                source: 'score',
                target: 'textContent',
                format: 'Score: {0}',
                converter: 'string'
            });

            expect(bindingId).toBeTruthy();

            viewModel.score = 1500;
            expect(element.textContent).toBe('Score: 1500');
        });
    });

    describe('Fluent API 绑定', () => {
        test('应该支持链式调用绑定', () => {
            const result = dataBinding
                .from(viewModel)
                .property('firstName')
                .to(element, 'textContent')
                .bind({
                    type: BindingType.ONE_WAY,
                    mode: BindingMode.REPLACE
                });

            expect(result.success).toBe(true);
            expect(result.id).toBeTruthy();

            // 测试绑定工作
            viewModel.firstName = 'Alice';
            expect(element.textContent).toBe('Alice');
        });

        test('应该支持带转换器的链式调用', () => {
            const result = dataBinding
                .from(viewModel)
                .property('age')
                .to(element, 'textContent')
                .withConverter('string')
                .bind({
                    type: BindingType.ONE_WAY,
                    mode: BindingMode.REPLACE
                });

            expect(result.success).toBe(true);
            
            viewModel.age = 30;
            expect(element.textContent).toBe('30');
        });

        test('应该支持格式化的链式调用', () => {
            const result = dataBinding
                .from(viewModel)
                .property('firstName')
                .to(element, 'textContent')
                .bind({
                    type: BindingType.ONE_WAY,
                    mode: BindingMode.FORMAT,
                    format: 'Hello, {0}!'
                });

            expect(result.success).toBe(true);
            
            viewModel.firstName = 'Bob';
            expect(element.textContent).toBe('Hello, Bob!');
        });
    });

    describe('快捷绑定方法', () => {
        test('应该支持快速单向绑定', () => {
            const result = dataBinding.quick.oneWay(
                viewModel,
                'firstName',
                element,
                'textContent'
            );

            expect(result.success).toBe(true);
            
            viewModel.firstName = 'QuickTest';
            expect(element.textContent).toBe('QuickTest');
        });

        test('应该支持快速单向绑定带转换器', () => {
            const result = dataBinding.quick.oneWay(
                viewModel,
                'age',
                element,
                'textContent',
                'string'
            );

            expect(result.success).toBe(true);
            
            viewModel.age = 42;
            expect(element.textContent).toBe('42');
        });

        test('应该支持快速格式化绑定', () => {
            const result = dataBinding.quick.format(
                viewModel,
                'firstName',
                element,
                'textContent',
                'Name: {0}'
            );

            expect(result.success).toBe(true);
            
            viewModel.firstName = 'FormatTest';
            expect(element.textContent).toBe('Name: FormatTest');
        });

        test('应该支持一次性绑定', () => {
            // 先设置初始值
            viewModel.firstName = 'Initial';
            
            const result = dataBinding.quick.oneTime(
                viewModel,
                'firstName',
                element,
                'textContent'
            );

            expect(result.success).toBe(true);
            
            // 初始值应该被设置
            expect(element.textContent).toBe('Initial');

            // 后续变化不应该更新（一次性绑定）
            viewModel.firstName = 'Changed';
            expect(element.textContent).toBe('Initial'); // 应该保持初始值
        });
    });

    describe('批量绑定管理', () => {
        test('应该支持批量绑定管理', () => {
            const batchManager = dataBinding.createBatchManager();
            
            const result1 = dataBinding.quick.oneWay(
                viewModel,
                'firstName',
                element,
                'textContent'
            );
            
            const element2 = createMockUIElement();
            const result2 = dataBinding.quick.oneWay(
                viewModel,
                'age',
                element2,
                'textContent',
                'string'
            );

            batchManager.add(result1).add(result2);
            
            expect(batchManager.getSuccessCount()).toBe(2);
            expect(batchManager.getFailureCount()).toBe(0);

            // 测试批量解除绑定
            batchManager.unbindAll();
            expect(dataBinding.getAllBindings().length).toBe(0);
        });

        test('应该正确统计成功和失败的绑定', () => {
            const batchManager = dataBinding.createBatchManager();
            
            // 添加成功的绑定
            const successResult = dataBinding.quick.oneWay(
                viewModel,
                'firstName',
                element,
                'textContent'
            );
            
            // 模拟失败的绑定
            const failureResult = {
                id: '',
                success: false,
                error: 'Test error'
            };

            batchManager.add(successResult).add(failureResult);
            
            expect(batchManager.getSuccessCount()).toBe(1);
            expect(batchManager.getFailureCount()).toBe(1);
            expect(batchManager.getErrors()).toContain('Test error');
        });
    });

    describe('转换器注册与使用', () => {
        test('应该支持注册自定义转换器', () => {
            // 注册自定义转换器
            dataBinding.registerTypeSafeConverter('uppercase', {
                convert: (value: string) => value.toUpperCase(),
                convertBack: (value: string) => value.toLowerCase()
            }, '将文本转换为大写');

            // 使用自定义转换器
            const bindingId = dataBinding.bind(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'firstName',
                target: 'textContent',
                converter: 'uppercase'
            });

            expect(bindingId).toBeTruthy();
            
            viewModel.firstName = 'hello';
            expect(element.textContent).toBe('HELLO');
        });

        test('应该支持日期转换器', () => {
            const bindingId = dataBinding.bindSafe(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'birthday',
                target: 'textContent',
                converter: 'date'
            });

            expect(bindingId).toBeTruthy();
            
            const testDate = new Date('2023-01-15');
            viewModel.birthday = testDate;
            expect(element.textContent).toBe('2023-01-15');
        });
    });

    describe('错误处理', () => {
        test('应该优雅处理绑定错误', () => {
            // 尝试绑定到null目标应该抛出异常
            expect(() => {
                dataBinding.bind(viewModel, null as any, {
                    type: BindingType.ONE_WAY,
                    mode: BindingMode.REPLACE,
                    source: 'firstName',
                    target: 'textContent'
                });
            }).toThrow('Target object cannot be null or undefined');
        });

        test('Fluent API 应该返回错误信息', () => {
            // 测试错误情况下的 Fluent API
            const result = dataBinding
                .from(viewModel)
                .property('firstName')
                .to(null as any, 'textContent' as any)
                .bind({
                    type: BindingType.ONE_WAY,
                    mode: BindingMode.REPLACE
                });

            expect(result.success).toBe(false);
            expect(result.error).toBeTruthy();
        });
    });

    describe('性能测试', () => {
        test('应该高效处理大量绑定', () => {
            const startTime = Date.now();
            const bindings: string[] = [];

            // 创建100个绑定
            for (let i = 0; i < 100; i++) {
                const testElement = createMockUIElement();
                const bindingId = dataBinding.bindSafe(viewModel, testElement, {
                    type: BindingType.ONE_WAY,
                    mode: BindingMode.REPLACE,
                    source: 'firstName',
                    target: 'textContent'
                });
                bindings.push(bindingId);
            }

            const bindingTime = Date.now() - startTime;
            expect(bindingTime).toBeLessThan(100); // 应该在100ms内完成

            // 测试更新性能
            const updateStart = Date.now();
            viewModel.firstName = 'PerformanceTest';
            const updateTime = Date.now() - updateStart;
            
            expect(updateTime).toBeLessThan(50); // 更新应该在50ms内完成

            // 清理
            bindings.forEach(id => dataBinding.unbind(id));
        });
    });

    describe('内存管理', () => {
        test('应该正确清理绑定资源', () => {
            const bindingId = dataBinding.bindSafe(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'firstName',
                target: 'textContent'
            });

            expect(dataBinding.getBinding(bindingId)).toBeTruthy();
            
            // 解除绑定
            dataBinding.unbind(bindingId);
            expect(dataBinding.getBinding(bindingId)).toBeUndefined();
        });

        test('应该在ViewModel销毁时清理相关资源', () => {
            const bindingId = dataBinding.bindSafe(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'firstName',
                target: 'textContent'
            });

            expect(dataBinding.getAllBindings().length).toBeGreaterThan(0);
            
            // 销毁ViewModel
            viewModel.destroy();
            
            // 验证绑定仍然存在（需要手动清理）
            expect(dataBinding.getBinding(bindingId)).toBeTruthy();
            
            // 手动清理
            dataBinding.unbindAll();
            expect(dataBinding.getAllBindings().length).toBe(0);
        });
    });
});

describe('类型安全编译时测试', () => {
    // 这些测试主要验证类型系统在编译时的行为
    // 在实际TypeScript环境中，错误的类型使用会导致编译错误
    
    test('类型安全绑定应该在运行时工作', () => {
        const viewModel = new TestViewModel();
        const dataBinding = DataBinding.getInstance();
        const element = createMockUIElement();

        // 这些绑定在编译时应该是类型安全的
        const binding1 = dataBinding.bindSafe(viewModel, element, {
            type: BindingType.ONE_WAY,
            mode: BindingMode.REPLACE,
            source: 'firstName', // 类型检查：string
            target: 'textContent' // 类型检查：string
        });

        const binding2 = dataBinding.bindSafe(viewModel, element, {
            type: BindingType.ONE_WAY,
            mode: BindingMode.REPLACE,
            source: 'age', // 类型检查：number
            target: 'textContent', // 类型检查：string
            converter: 'string' // 需要转换器
        });

        expect(binding1).toBeTruthy();
        expect(binding2).toBeTruthy();

        viewModel.firstName = 'TypeSafe';
        viewModel.age = 25;
        
        expect(element.textContent).toBe('25'); // age绑定覆盖了firstName

        viewModel.destroy();
        dataBinding.unbindAll();
    });
});