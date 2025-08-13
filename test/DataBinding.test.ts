import { 
    DataBinding, 
    BindingType, 
    BindingMode, 
    IValueConverter,
    dataBinding
} from '../src/binding/DataBinding';
import { ViewModel } from '../src/core/ViewModel';
import { observable, computed, viewModel } from '../src/core/Decorators';

@viewModel
class TestDataBindingViewModel extends ViewModel {
    public get name(): string { return 'TestDataBindingViewModel'; }

    @observable
    public firstName: string = 'John';

    @observable
    public lastName: string = 'Doe';

    @observable
    public age: number = 25;

    @observable
    public isActive: boolean = true;

    @observable
    public createdAt: Date = new Date('2023-01-01');

    @computed(['firstName', 'lastName'])
    public get fullName(): string {
        return `${this.firstName} ${this.lastName}`.trim();
    }
}

// 模拟UI元素
class MockUIElement {
    public textContent: string = '';
    public value: string = '';
    public visible: string = 'visible';
    public innerHTML: string = '';
    public className: string = '';

    // 模拟事件系统
    private _observers: Map<string, Function[]> = new Map();

    public addEventListener(event: string, handler: Function): void {
        if (!this._observers.has(event)) {
            this._observers.set(event, []);
        }
        this._observers.get(event)!.push(handler);
    }

    public removeEventListener(event: string, handler: Function): void {
        const handlers = this._observers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }

    public triggerEvent(event: string, data?: any): void {
        const handlers = this._observers.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
    }
}

// 模拟可观察的UI元素（支持双向绑定）
class MockObservableUIElement {
    public textContent: string = '';
    public innerHTML: string = '';
    public className: string = '';
    private _eventObservers: Map<string, Function[]> = new Map();
    private _propertyObservers: Map<string | null, Function[]> = new Map();
    private _value: string = '';

    public get value(): string {
        return this._value;
    }

    public set value(newValue: string) {
        const oldValue = this._value;
        this._value = newValue;
        this.notifyObservers('value', newValue, oldValue);
    }

    // 事件系统
    public addEventListener(event: string, handler: Function): void {
        if (!this._eventObservers.has(event)) {
            this._eventObservers.set(event, []);
        }
        this._eventObservers.get(event)!.push(handler);
    }

    public removeEventListener(event: string, handler: Function): void {
        const handlers = this._eventObservers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }

    public triggerEvent(event: string, data?: any): void {
        const handlers = this._eventObservers.get(event);
        handlers?.forEach(handler => handler(data));
    }

    // 属性观察系统
    public addObserver(property: string | null, observer: Function): void {
        if (!this._propertyObservers.has(property)) {
            this._propertyObservers.set(property, []);
        }
        this._propertyObservers.get(property)!.push(observer);
    }

    public removeObserver(property: string | null, observer: Function): void {
        const observers = this._propertyObservers.get(property);
        if (observers) {
            const index = observers.indexOf(observer);
            if (index !== -1) {
                observers.splice(index, 1);
            }
        }
    }

    private notifyObservers(property: string, newValue: any, oldValue: any): void {
        const propertyObservers = this._propertyObservers.get(property);
        if (propertyObservers) {
            propertyObservers.forEach(observer => observer(newValue, oldValue, property));
        }
        
        const globalObservers = this._propertyObservers.get(null);
        if (globalObservers) {
            globalObservers.forEach(observer => observer(newValue, oldValue, property));
        }
    }
}

describe('DataBinding', () => {
    let binding: DataBinding;
    let viewModel: TestDataBindingViewModel;
    let uiElement: MockUIElement;

    beforeEach(() => {
        binding = DataBinding.getInstance();
        viewModel = new TestDataBindingViewModel();
        uiElement = new MockUIElement();
    });

    afterEach(() => {
        binding.unbindAll();
        viewModel.destroy();
    });

    describe('单例模式', () => {
        test('应该返回相同的实例', () => {
            const instance1 = DataBinding.getInstance();
            const instance2 = DataBinding.getInstance();
            expect(instance1).toBe(instance2);
        });

        test('dataBinding导出应该是同一个实例', () => {
            expect(dataBinding).toBe(DataBinding.getInstance());
        });
    });

    describe('单向绑定', () => {
        test('应该初始化绑定值', () => {
            binding.bind(viewModel, uiElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'firstName',
                target: 'textContent'
            });

            expect(uiElement.textContent).toBe('John');
        });

        test('应该响应源值变化', () => {
            binding.bind(viewModel, uiElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'firstName',
                target: 'textContent'
            });

            viewModel.firstName = 'Alice';
            expect(uiElement.textContent).toBe('Alice');
        });

        test('应该支持计算属性绑定', () => {
            binding.bind(viewModel, uiElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'fullName',
                target: 'textContent'
            });

            expect(uiElement.textContent).toBe('John Doe');
            
            viewModel.firstName = 'Jane';
            expect(uiElement.textContent).toBe('Jane Doe');
        });
    });

    describe('双向绑定', () => {
        test('应该支持双向数据同步', () => {
            const observableElement = new MockObservableUIElement();
            
            binding.bind(viewModel, observableElement, {
                type: BindingType.TWO_WAY,
                mode: BindingMode.REPLACE,
                source: 'firstName',
                target: 'value'
            });

            // 初始值
            expect(observableElement.value).toBe('John');

            // ViewModel -> UI
            viewModel.firstName = 'Bob';
            expect(observableElement.value).toBe('Bob');

            // UI -> ViewModel（模拟用户输入）
            observableElement.value = 'Charlie';
            expect(viewModel.firstName).toBe('Charlie');
        });
    });

    describe('一次性绑定', () => {
        test('应该只绑定初始值', () => {
            binding.bind(viewModel, uiElement, {
                type: BindingType.ONE_TIME,
                mode: BindingMode.REPLACE,
                source: 'firstName',
                target: 'textContent'
            });

            expect(uiElement.textContent).toBe('John');
            
            // 改变源值不应该更新目标
            viewModel.firstName = 'Alice';
            expect(uiElement.textContent).toBe('John');
        });
    });

    describe('绑定模式', () => {
        test('REPLACE模式应该替换值', () => {
            uiElement.textContent = 'original';
            
            binding.bind(viewModel, uiElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'firstName',
                target: 'textContent'
            });

            expect(uiElement.textContent).toBe('John');
        });

        test('APPEND模式应该追加值', () => {
            uiElement.textContent = 'Hello, ';
            
            binding.bind(viewModel, uiElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.APPEND,
                source: 'firstName',
                target: 'textContent'
            });

            expect(uiElement.textContent).toBe('Hello, John');
        });

        test('FORMAT模式应该格式化值', () => {
            binding.bind(viewModel, uiElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.FORMAT,
                source: 'firstName',
                target: 'textContent',
                format: 'Name: {0}'
            });

            expect(uiElement.textContent).toBe('Name: John');
        });
    });

    describe('值转换器', () => {
        test('应该使用内置布尔转换器', () => {
            binding.bind(viewModel, uiElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'isActive',
                target: 'textContent',
                converter: 'bool'
            });

            expect(uiElement.textContent).toBe('true');
            
            viewModel.isActive = false;
            expect(uiElement.textContent).toBe('false');
        });

        test('应该使用内置数字转换器', () => {
            binding.bind(viewModel, uiElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'age',
                target: 'textContent',
                converter: 'number'
            });

            expect(uiElement.textContent).toBe('25');
        });

        test('应该使用内置字符串转换器', () => {
            binding.bind(viewModel, uiElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'age',
                target: 'textContent',
                converter: 'string'
            });

            expect(uiElement.textContent).toBe('25');
        });

        test('应该使用内置日期转换器', () => {
            binding.bind(viewModel, uiElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'createdAt',
                target: 'textContent',
                converter: 'date',
                converterParams: ['yyyy-MM-dd']
            });

            expect(uiElement.textContent).toBe('2023-01-01');
        });

        test('应该使用可见性转换器', () => {
            binding.bind(viewModel, uiElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'isActive',
                target: 'visible',
                converter: 'visibility'
            });

            expect(uiElement.visible).toBe('visible');
            
            viewModel.isActive = false;
            expect(uiElement.visible).toBe('hidden');
        });

        test('应该使用反转转换器', () => {
            binding.bind(viewModel, uiElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'isActive',
                target: 'textContent',
                converter: 'not'
            });

            expect(uiElement.textContent).toBe('false');
            
            viewModel.isActive = false;
            expect(uiElement.textContent).toBe('true');
        });
    });

    describe('自定义转换器', () => {
        test('应该注册和使用自定义转换器', () => {
            const upperCaseConverter: IValueConverter = {
                convert: (value: any) => String(value).toUpperCase(),
                convertBack: (value: any) => String(value).toLowerCase()
            };

            binding.registerConverter('uppercase', upperCaseConverter);

            binding.bind(viewModel, uiElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'firstName',
                target: 'textContent',
                converter: 'uppercase'
            });

            expect(uiElement.textContent).toBe('JOHN');
        });

        test('应该获取注册的转换器', () => {
            const testConverter: IValueConverter = {
                convert: (value: any) => value
            };

            binding.registerConverter('test', testConverter);
            const retrieved = binding.getConverter('test');

            expect(retrieved).toBe(testConverter);
        });
    });

    describe('表达式解析', () => {
        test('应该解析属性路径', () => {
            // 创建嵌套对象测试
            const nestedViewModel = {
                user: {
                    profile: {
                        name: 'Nested Name'
                    }
                },
                addObserver: jest.fn(),
                removeObserver: jest.fn(),
                notifyObservers: jest.fn(),
                removeAllObservers: jest.fn()
            };

            binding.bind(nestedViewModel as any, uiElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'user.profile.name',
                target: 'textContent'
            });

            expect(uiElement.textContent).toBe('Nested Name');
        });

        test('应该处理undefined的嵌套属性', () => {
            const incompleteViewModel = {
                user: null,
                addObserver: jest.fn(),
                removeObserver: jest.fn(),
                notifyObservers: jest.fn(),
                removeAllObservers: jest.fn()
            };

            binding.bind(incompleteViewModel as any, uiElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'user.profile.name',
                target: 'textContent'
            });

            expect(uiElement.textContent).toBe('');
        });
    });

    describe('绑定管理', () => {
        test('应该返回绑定ID', () => {
            const bindingId = binding.bind(viewModel, uiElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'firstName',
                target: 'textContent'
            });

            expect(typeof bindingId).toBe('string');
            expect(bindingId).toMatch(/^binding_\d+$/);
        });

        test('应该获取绑定实例', () => {
            const bindingId = binding.bind(viewModel, uiElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'firstName',
                target: 'textContent'
            });

            const bindingInstance = binding.getBinding(bindingId);
            expect(bindingInstance).toBeDefined();
            expect(bindingInstance!.config.source).toBe('firstName');
            expect(bindingInstance!.config.target).toBe('textContent');
        });

        test('应该解除单个绑定', () => {
            const bindingId = binding.bind(viewModel, uiElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'firstName',
                target: 'textContent'
            });

            binding.unbind(bindingId);
            
            viewModel.firstName = 'Changed';
            expect(uiElement.textContent).toBe('John'); // 应该保持原值
        });

        test('应该获取所有绑定', () => {
            const bindingId1 = binding.bind(viewModel, uiElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'firstName',
                target: 'textContent'
            });

            const element2 = new MockUIElement();
            const bindingId2 = binding.bind(viewModel, element2, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'lastName',
                target: 'textContent'
            });

            const allBindings = binding.getAllBindings();
            expect(allBindings).toHaveLength(2);
        });

        test('应该启用和禁用绑定', () => {
            const bindingId = binding.bind(viewModel, uiElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'firstName',
                target: 'textContent'
            });

            // 禁用绑定
            binding.setBindingEnabled(bindingId, false);
            viewModel.firstName = 'Disabled';
            expect(uiElement.textContent).toBe('John');

            // 启用绑定
            binding.setBindingEnabled(bindingId, true);
            viewModel.firstName = 'Enabled';
            expect(uiElement.textContent).toBe('Enabled');
        });

        test('应该手动更新绑定', () => {
            const bindingId = binding.bind(viewModel, uiElement, {
                type: BindingType.ONE_TIME,
                mode: BindingMode.REPLACE,
                source: 'firstName',
                target: 'textContent'
            });

            viewModel.firstName = 'Manual';
            expect(uiElement.textContent).toBe('John'); // 一次性绑定不会自动更新

            // 手动更新
            binding.updateBinding(bindingId, viewModel);
            expect(uiElement.textContent).toBe('Manual');
        });
    });

    describe('错误处理', () => {
        test('应该处理绑定错误', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            // 创建一个会抛出错误的UI元素
            const errorElement = {
                get textContent() { throw new Error('Property error'); },
                set textContent(value) { throw new Error('Property error'); }
            };

            binding.bind(viewModel, errorElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'firstName',
                target: 'textContent'
            });

            expect(consoleSpy).toHaveBeenCalledWith(
                '绑定更新目标值失败:',
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });

        test('应该处理不存在的绑定操作', () => {
            expect(() => {
                binding.unbind('nonexistent');
                binding.setBindingEnabled('nonexistent', false);
                binding.updateBinding('nonexistent', viewModel);
            }).not.toThrow();
        });
    });
});