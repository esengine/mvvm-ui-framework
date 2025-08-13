import { DataBinding, BindingType, BindingMode } from '../src/binding/DataBinding';
import { ViewModel } from '../src/core/ViewModel';
import { observable, viewModel } from '../src/core/Decorators';

// 测试用的ViewModel
@viewModel
class TestViewModel extends ViewModel {
    public get name(): string { return 'TestViewModel'; }

    @observable
    public text: string = '';

    @observable
    public number: number = 0;

    @observable
    public isEnabled: boolean = false;
}

// 模拟支持双向绑定的UI组件
class MockInput {
    private _value: string = '';
    private _observers: Map<string, Function[]> = new Map();

    public get value(): string {
        return this._value;
    }

    public set value(newValue: string) {
        const oldValue = this._value;
        this._value = newValue;
        this.notifyObservers('value', newValue, oldValue);
    }

    public addObserver(property: string, observer: Function): void {
        if (!this._observers.has(property)) {
            this._observers.set(property, []);
        }
        this._observers.get(property)!.push(observer);
    }

    public removeObserver(property: string, observer: Function): void {
        const observers = this._observers.get(property);
        if (observers) {
            const index = observers.indexOf(observer);
            if (index !== -1) {
                observers.splice(index, 1);
            }
        }
    }

    private notifyObservers(property: string, newValue: any, oldValue: any): void {
        const observers = this._observers.get(property);
        if (observers) {
            observers.forEach(observer => observer(newValue, oldValue, property));
        }
    }

    // 模拟用户输入
    public simulateInput(value: string): void {
        this.value = value;
    }
}

describe('双向绑定完整性测试', () => {
    let viewModel: TestViewModel;
    let binding: DataBinding;
    let input: MockInput;

    beforeEach(() => {
        viewModel = new TestViewModel();
        binding = DataBinding.getInstance();
        input = new MockInput();
    });

    afterEach(() => {
        viewModel.destroy();
        // 清理所有绑定
        binding['_bindings'].clear();
    });

    describe('基础双向绑定', () => {
        test('应该正确初始化双向绑定', () => {
            viewModel.text = 'initial';
            
            binding.bind(viewModel, input, {
                type: BindingType.TWO_WAY,
                mode: BindingMode.REPLACE,
                source: 'text',
                target: 'value'
            });

            expect(input.value).toBe('initial');
        });

        test('ViewModel更新应该同步到UI', () => {
            binding.bind(viewModel, input, {
                type: BindingType.TWO_WAY,
                mode: BindingMode.REPLACE,
                source: 'text',
                target: 'value'
            });

            viewModel.text = 'updated from viewmodel';
            expect(input.value).toBe('updated from viewmodel');
        });

        test('UI更新应该同步到ViewModel', () => {
            binding.bind(viewModel, input, {
                type: BindingType.TWO_WAY,
                mode: BindingMode.REPLACE,
                source: 'text',
                target: 'value'
            });

            input.simulateInput('updated from ui');
            expect(viewModel.text).toBe('updated from ui');
        });

        test('多次双向更新应该正确同步', () => {
            binding.bind(viewModel, input, {
                type: BindingType.TWO_WAY,
                mode: BindingMode.REPLACE,
                source: 'text',
                target: 'value'
            });

            // ViewModel -> UI
            viewModel.text = 'step1';
            expect(input.value).toBe('step1');

            // UI -> ViewModel
            input.simulateInput('step2');
            expect(viewModel.text).toBe('step2');

            // ViewModel -> UI 再次
            viewModel.text = 'step3';
            expect(input.value).toBe('step3');
        });
    });

    describe('转换器双向绑定', () => {
        test('应该支持带转换器的双向绑定', () => {
            viewModel.isEnabled = true;

            binding.bind(viewModel, input, {
                type: BindingType.TWO_WAY,
                mode: BindingMode.REPLACE,
                source: 'isEnabled',
                target: 'value',
                converter: 'bool'
            });

            // 初始值：boolean -> string
            expect(input.value).toBe('true');

            // ViewModel -> UI
            viewModel.isEnabled = false;
            expect(input.value).toBe('false');

            // UI -> ViewModel (string -> boolean)
            input.simulateInput('true');
            expect(viewModel.isEnabled).toBe(true);
        });

        test('数字转换器双向绑定', () => {
            viewModel.number = 42;

            binding.bind(viewModel, input, {
                type: BindingType.TWO_WAY,
                mode: BindingMode.REPLACE,
                source: 'number',
                target: 'value',
                converter: 'number'
            });

            // 初始值：number -> string
            expect(input.value).toBe('42');

            // ViewModel -> UI
            viewModel.number = 100;
            expect(input.value).toBe('100');

            // UI -> ViewModel (string -> number)
            input.simulateInput('255');
            expect(viewModel.number).toBe(255);
        });
    });

    describe('边界情况', () => {
        test('空值处理', () => {
            binding.bind(viewModel, input, {
                type: BindingType.TWO_WAY,
                mode: BindingMode.REPLACE,
                source: 'text',
                target: 'value'
            });

            // 设置为null/undefined应该转换为空字符串
            viewModel.text = null as any;
            expect(input.value).toBe('');

            // 从UI设置空字符串
            input.simulateInput('');
            expect(viewModel.text).toBe('');
        });

        test('解除绑定后不应该同步', () => {
            const bindingId = binding.bind(viewModel, input, {
                type: BindingType.TWO_WAY,
                mode: BindingMode.REPLACE,
                source: 'text',
                target: 'value'
            });

            viewModel.text = 'before unbind';
            expect(input.value).toBe('before unbind');

            binding.unbind(bindingId);

            viewModel.text = 'after unbind';
            expect(input.value).toBe('before unbind'); // 不应该更新

            input.simulateInput('ui after unbind');
            expect(viewModel.text).toBe('after unbind'); // 不应该更新
        });
    });

    describe('性能和循环引用', () => {
        test('不会出现无限循环', () => {
            // 简单的循环检测：如果存在无限循环，这个测试会超时
            binding.bind(viewModel, input, {
                type: BindingType.TWO_WAY,
                mode: BindingMode.REPLACE,
                source: 'text',
                target: 'value'
            });

            // 多次快速更新不应该造成无限循环
            for (let i = 0; i < 10; i++) {
                viewModel.text = `test${i}`;
                expect(input.value).toBe(`test${i}`);
                
                input.simulateInput(`input${i}`);
                expect(viewModel.text).toBe(`input${i}`);
            }
            
            // 如果代码能执行到这里，说明没有无限循环
            expect(true).toBe(true);
        });
    });
});