/**
 * 高级类型安全绑定功能测试
 * 涵盖复杂场景、边界情况和性能测试
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

// 复杂的测试 ViewModel
@viewModel
class ComplexViewModel extends ViewModel {
    public get name(): string { return 'ComplexViewModel'; }

    @observable
    public user: {
        name: string;
        profile: {
            age: number;
            email: string;
        };
        preferences: {
            theme: 'light' | 'dark';
            notifications: boolean;
        };
    } = {
        name: 'John',
        profile: {
            age: 25,
            email: 'john@example.com'
        },
        preferences: {
            theme: 'light',
            notifications: true
        }
    };

    @observable
    public items: Array<{ id: number; title: string; completed: boolean }> = [];

    @observable
    public selectedItemId: number | null = null;

    @observable
    public loading: boolean = false;

    @observable
    public error: Error | null = null;

    @computed(['items', 'selectedItemId'])
    public get selectedItem() {
        return this.items.find(item => item.id === this.selectedItemId) || null;
    }

    @computed(['items'])
    public get completedCount(): number {
        return this.items.filter(item => item.completed).length;
    }

    @computed(['items'])
    public get pendingItems() {
        return this.items.filter(item => !item.completed);
    }

    public addItem(title: string): void {
        const newItem = {
            id: Date.now() + Math.random(), // 确保ID唯一
            title,
            completed: false
        };
        this.items = [...this.items, newItem];
    }

    public toggleItem(id: number): void {
        this.items = this.items.map(item => 
            item.id === id ? { ...item, completed: !item.completed } : item
        );
    }

    public selectItem(id: number): void {
        this.selectedItemId = id;
    }

    public async loadData(): Promise<void> {
        this.loading = true;
        this.error = null;
        
        try {
            // 模拟异步加载
            await new Promise(resolve => setTimeout(resolve, 100));
            
            this.items = [
                { id: 1, title: 'Task 1', completed: false },
                { id: 2, title: 'Task 2', completed: true },
                { id: 3, title: 'Task 3', completed: false }
            ];
        } catch (error) {
            this.error = error as Error;
        } finally {
            this.loading = false;
        }
    }
}

// 复杂的UI元素模拟
interface ComplexUIElement {
    // 文本相关
    textContent: string;
    innerHTML: string;
    value: string;
    placeholder: string;
    title: string;
    
    // 样式相关
    className: string;
    style: {
        display: string;
        visibility: string;
        opacity: string;
        backgroundColor: string;
        color: string;
    };
    
    // 属性相关
    disabled: boolean;
    readonly: boolean;
    checked: boolean;
    selected: boolean;
    
    // 数据属性
    dataset: Record<string, string>;
    
    // 自定义属性
    customData: any;
}

function createComplexUIElement(): ComplexUIElement {
    return {
        textContent: '',
        innerHTML: '',
        value: '',
        placeholder: '',
        title: '',
        className: '',
        style: {
            display: 'block',
            visibility: 'visible',
            opacity: '1',
            backgroundColor: '#ffffff',
            color: '#000000'
        },
        disabled: false,
        readonly: false,
        checked: false,
        selected: false,
        dataset: {},
        customData: null
    };
}

describe('高级类型安全绑定测试', () => {
    let viewModel: ComplexViewModel;
    let dataBinding: DataBinding;

    beforeEach(() => {
        viewModel = new ComplexViewModel();
        dataBinding = DataBinding.getInstance();
        dataBinding.unbindAll();
    });

    afterEach(() => {
        viewModel.destroy();
        dataBinding.unbindAll();
    });

    describe('复杂对象绑定', () => {
        test('应该支持绑定到嵌套对象属性', () => {
            const nameElement = createComplexUIElement();
            const ageElement = createComplexUIElement();

            // 绑定到嵌套属性
            dataBinding.bindSafe(viewModel, nameElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'user',
                target: 'customData'
            });

            dataBinding.bind(viewModel, ageElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'user.profile.age',
                target: 'textContent',
                converter: 'string'
            });

            // 测试绑定
            viewModel.user = {
                ...viewModel.user,
                profile: { ...viewModel.user.profile, age: 30 }
            };

            expect(nameElement.customData).toBe(viewModel.user);
            expect(ageElement.textContent).toBe('30');
        });

        test('应该支持数组属性绑定', () => {
            const countElement = createComplexUIElement();
            const itemsElement = createComplexUIElement();

            dataBinding.bindSafe(viewModel, countElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'completedCount',
                target: 'textContent',
                converter: 'string'
            });

            dataBinding.bindSafe(viewModel, itemsElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'items',
                target: 'customData'
            });

            // 测试数组变化
            viewModel.addItem('New Task');
            viewModel.toggleItem(viewModel.items[0].id);

            expect(countElement.textContent).toBe('1');
            expect(itemsElement.customData).toBe(viewModel.items);
        });
    });

    describe('计算属性绑定', () => {
        test('应该正确绑定到计算属性', () => {
            const selectedElement = createComplexUIElement();
            const pendingElement = createComplexUIElement();

            dataBinding.bindSafe(viewModel, selectedElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'selectedItem',
                target: 'customData'
            });

            dataBinding.bindSafe(viewModel, pendingElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'pendingItems',
                target: 'customData'
            });

            // 添加一些项目
            viewModel.addItem('Task A');
            viewModel.addItem('Task B');
            viewModel.selectItem(viewModel.items[0].id);

            expect(selectedElement.customData).toBe(viewModel.selectedItem);
            expect(pendingElement.customData).toBe(viewModel.pendingItems);
        });

        test('计算属性应该在依赖变化时自动更新绑定', () => {
            const countElement = createComplexUIElement();

            dataBinding.bindSafe(viewModel, countElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.FORMAT,
                source: 'completedCount',
                target: 'textContent',
                format: 'Completed: {0}',
                converter: 'string'
            });

            // 初始状态
            expect(countElement.textContent).toBe('Completed: 0');

            // 添加项目并标记完成
            viewModel.addItem('Task 1');
            const firstId = viewModel.items[0].id;
            viewModel.toggleItem(firstId);

            expect(countElement.textContent).toBe('Completed: 1');

            // 添加第二个项目并标记完成
            viewModel.addItem('Task 2');
            const secondId = viewModel.items[1].id;
            viewModel.toggleItem(secondId);
            
            expect(countElement.textContent).toBe('Completed: 2');
        });
    });

    describe('多元素绑定', () => {
        test('应该支持一个属性绑定到多个UI元素', () => {
            const elements = Array.from({ length: 5 }, () => createComplexUIElement());
            const bindings: string[] = [];

            // 将同一个属性绑定到多个元素
            elements.forEach((element, index) => {
                const bindingId = dataBinding.bindSafe(viewModel, element, {
                    type: BindingType.ONE_WAY,
                    mode: BindingMode.FORMAT,
                    source: 'completedCount',
                    target: 'textContent',
                    format: `Element ${index}: {0}`,
                    converter: 'string'
                });
                bindings.push(bindingId);
            });

            // 测试更新
            viewModel.addItem('Task 1');
            viewModel.toggleItem(viewModel.items[0].id);

            elements.forEach((element, index) => {
                expect(element.textContent).toBe(`Element ${index}: 1`);
            });

            // 清理
            bindings.forEach(id => dataBinding.unbind(id));
        });

        test('应该支持多个属性绑定到同一个UI元素的不同属性', () => {
            const element = createComplexUIElement();

            // 多个绑定到同一个元素
            const bindings = [
                dataBinding.bindSafe(viewModel, element, {
                    type: BindingType.ONE_WAY,
                    mode: BindingMode.REPLACE,
                    source: 'loading',
                    target: 'disabled'
                }),
                dataBinding.bindSafe(viewModel, element, {
                    type: BindingType.ONE_WAY,
                    mode: BindingMode.REPLACE,
                    source: 'completedCount',
                    target: 'textContent',
                    converter: 'string'
                }),
                dataBinding.bindSafe(viewModel, element, {
                    type: BindingType.ONE_WAY,
                    mode: BindingMode.REPLACE,
                    source: 'error',
                    target: 'title',
                    converter: 'string'
                })
            ];

            // 测试初始状态
            expect(element.disabled).toBe(false);
            expect(element.textContent).toBe('0');
            expect(element.title).toBe('null');

            // 更新状态
            viewModel.loading = true;
            viewModel.addItem('Test');
            viewModel.toggleItem(viewModel.items[0].id);
            viewModel.error = new Error('Test error');

            expect(element.disabled).toBe(true);
            expect(element.textContent).toBe('1');
            expect(element.title).toContain('Test error');
        });
    });

    describe('Fluent API 高级用法', () => {
        test('应该支持链式创建多个绑定', () => {
            const titleElement = createComplexUIElement();
            const statusElement = createComplexUIElement();
            const counterElement = createComplexUIElement();

            // 创建绑定
            const titleBinding = dataBinding.bind(viewModel, titleElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.FORMAT,
                source: 'selectedItem.title',
                target: 'textContent',
                format: 'Selected: {0}'
            });
            
            const statusResult = dataBinding
                .from(viewModel)
                .property('loading')
                .to(statusElement, 'className')
                .bind({
                    type: BindingType.ONE_WAY,
                    mode: BindingMode.FORMAT,
                    format: 'status {0}'
                });
            
            const counterResult = dataBinding
                .from(viewModel)
                .property('completedCount')
                .to(counterElement, 'textContent')
                .withConverter('string')
                .bind({
                    type: BindingType.ONE_WAY,
                    mode: BindingMode.REPLACE
                });

            // 验证绑定成功
            expect(titleBinding).toBeTruthy();
            expect(statusResult.success).toBe(true);
            expect(counterResult.success).toBe(true);

            // 测试绑定功能
            viewModel.addItem('Test Item');
            viewModel.selectItem(viewModel.items[0].id);
            viewModel.toggleItem(viewModel.items[0].id);
            viewModel.loading = true;

            expect(titleElement.textContent).toContain('Test Item');
            expect(statusElement.className).toBe('status true');
            expect(counterElement.textContent).toBe('1');
        });

        test('应该支持快捷绑定的批量操作', () => {
            const elements = Array.from({ length: 3 }, () => createComplexUIElement());

            // 批量快捷绑定
            const results = [
                dataBinding.quick.oneWay(viewModel, 'loading', elements[0], 'disabled'),
                dataBinding.quick.format(viewModel, 'completedCount', elements[1], 'textContent', 'Count: {0}', 'string'),
                dataBinding.quick.oneTime(viewModel, 'user', elements[2], 'customData')
            ];

            // 验证绑定
            results.forEach(result => expect(result.success).toBe(true));

            // 测试功能
            viewModel.loading = true;
            viewModel.addItem('Test');
            viewModel.toggleItem(viewModel.items[0].id);

            expect(elements[0].disabled).toBe(true);
            expect(elements[1].textContent).toBe('Count: 1');
            expect(elements[2].customData).toBe(viewModel.user);
        });
    });

    describe('自定义转换器', () => {
        test('应该支持复杂的自定义转换器', () => {
            const element = createComplexUIElement();

            // 注册复杂的自定义转换器
            dataBinding.registerTypeSafeConverter('jsonPretty', {
                convert: (value: any) => {
                    try {
                        return JSON.stringify(value, null, 2);
                    } catch {
                        return String(value);
                    }
                },
                convertBack: (value: string) => {
                    try {
                        return JSON.parse(value);
                    } catch {
                        return value;
                    }
                }
            }, 'JSON美化转换器');

            // 注册主题转换器
            dataBinding.registerTypeSafeConverter('themeClass', {
                convert: (theme: 'light' | 'dark') => `theme-${theme}`,
                convertBack: (className: string) => className.replace('theme-', '') as 'light' | 'dark'
            }, '主题类名转换器');

            // 使用自定义转换器
            const jsonBinding = dataBinding.bind(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'selectedItem',
                target: 'innerHTML',
                converter: 'jsonPretty'
            });

            const themeElement = createComplexUIElement();
            const themeBinding = dataBinding.bind(viewModel, themeElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'user.preferences.theme',
                target: 'className',
                converter: 'themeClass'
            });

            expect(jsonBinding).toBeTruthy();
            expect(themeBinding).toBeTruthy();

            // 测试转换器
            viewModel.addItem('Test Item');
            viewModel.selectItem(viewModel.items[0].id);
            viewModel.user = {
                ...viewModel.user,
                preferences: { ...viewModel.user.preferences, theme: 'dark' }
            };

            expect(element.innerHTML).toContain('"title": "Test Item"');
            expect(themeElement.className).toBe('theme-dark');
        });
    });

    describe('异步数据绑定', () => {
        test('应该正确处理异步数据加载的绑定', async () => {
            const loadingElement = createComplexUIElement();
            const itemsElement = createComplexUIElement();
            const errorElement = createComplexUIElement();

            // 绑定异步状态
            dataBinding.bindSafe(viewModel, loadingElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'loading',
                target: 'disabled'
            });

            dataBinding.bindSafe(viewModel, itemsElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'items',
                target: 'customData'
            });

            dataBinding.bindSafe(viewModel, errorElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'error',
                target: 'textContent',
                converter: 'string'
            });

            // 初始状态
            expect(loadingElement.disabled).toBe(false);
            expect(itemsElement.customData).toEqual([]);
            expect(errorElement.textContent).toBe('null');

            // 开始异步加载
            const loadPromise = viewModel.loadData();
            
            // 加载中状态
            expect(loadingElement.disabled).toBe(true);

            // 等待加载完成
            await loadPromise;

            // 加载完成状态
            expect(loadingElement.disabled).toBe(false);
            expect(itemsElement.customData).toHaveLength(3);
            expect(errorElement.textContent).toBe('null');
        });
    });

    describe('边界情况处理', () => {
        test('应该正确处理null和undefined值', () => {
            const element = createComplexUIElement();

            dataBinding.bindSafe(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'selectedItemId',
                target: 'textContent',
                converter: 'string'
            });

            // null值
            viewModel.selectedItemId = null;
            expect(element.textContent).toBe('null');

            // 数字值
            viewModel.selectedItemId = 42;
            expect(element.textContent).toBe('42');

            // 回到null
            viewModel.selectedItemId = null;
            expect(element.textContent).toBe('null');
        });

        test('应该正确处理空数组和空对象', () => {
            const arrayElement = createComplexUIElement();
            const objectElement = createComplexUIElement();

            dataBinding.bindSafe(viewModel, arrayElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'items',
                target: 'textContent',
                converter: 'string'
            });

            dataBinding.bindSafe(viewModel, objectElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'selectedItem',
                target: 'textContent',
                converter: 'string'
            });

            // 空数组
            viewModel.items = [];
            expect(arrayElement.textContent).toBe('');

            // 空对象（null）
            viewModel.selectedItemId = null;
            expect(objectElement.textContent).toBe('null');
        });
    });

    describe('内存管理和性能', () => {
        test('应该高效处理大量绑定的创建和销毁', () => {
            const startTime = Date.now();
            const bindings: string[] = [];
            const elements: ComplexUIElement[] = [];

            // 创建大量绑定
            for (let i = 0; i < 1000; i++) {
                const element = createComplexUIElement();
                elements.push(element);
                
                const bindingId = dataBinding.bindSafe(viewModel, element, {
                    type: BindingType.ONE_WAY,
                    mode: BindingMode.REPLACE,
                    source: 'completedCount',
                    target: 'textContent',
                    converter: 'string'
                });
                bindings.push(bindingId);
            }

            const creationTime = Date.now() - startTime;
            expect(creationTime).toBeLessThan(500); // 500ms内创建1000个绑定

            // 测试批量更新性能
            const updateStart = Date.now();
            viewModel.addItem('Performance Test');
            viewModel.toggleItem(viewModel.items[0].id);
            const updateTime = Date.now() - updateStart;

            expect(updateTime).toBeLessThan(100); // 100ms内更新1000个绑定

            // 验证所有元素都被更新
            elements.forEach(element => {
                expect(element.textContent).toBe('1');
            });

            // 测试批量销毁性能
            const destroyStart = Date.now();
            bindings.forEach(id => dataBinding.unbind(id));
            const destroyTime = Date.now() - destroyStart;

            expect(destroyTime).toBeLessThan(200); // 200ms内销毁1000个绑定
            expect(dataBinding.getAllBindings()).toHaveLength(0);
        });

        test('批量绑定管理器应该高效处理大量操作', () => {
            const batchManager = dataBinding.createBatchManager();
            const elements = Array.from({ length: 100 }, () => createComplexUIElement());

            const startTime = Date.now();

            // 批量添加绑定
            elements.forEach((element, index) => {
                const result = dataBinding.quick.format(
                    viewModel, 
                    'completedCount', 
                    element, 
                    'textContent', 
                    `Item ${index}: {0}`,
                    'string'
                );
                batchManager.add(result);
            });

            const batchTime = Date.now() - startTime;
            expect(batchTime).toBeLessThan(100);

            expect(batchManager.getSuccessCount()).toBe(100);
            expect(batchManager.getFailureCount()).toBe(0);

            // 测试批量更新
            const updateStart = Date.now();
            viewModel.addItem('Batch Test');
            viewModel.toggleItem(viewModel.items[0].id);
            const updateTime = Date.now() - updateStart;

            expect(updateTime).toBeLessThan(50);

            // 验证更新
            elements.forEach((element, index) => {
                expect(element.textContent).toBe(`Item ${index}: 1`);
            });

            // 批量清理
            const cleanupStart = Date.now();
            batchManager.unbindAll();
            const cleanupTime = Date.now() - cleanupStart;

            expect(cleanupTime).toBeLessThan(50);
        });
    });
});