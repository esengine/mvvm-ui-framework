import { 
    ViewModel,
    observable, 
    computed, 
    command,
    viewModel,
    DataBinding,
    BindingType,
    BindingMode,
    UIManager,
    UILayer,
    createObservable
} from '../src/index';

/**
 * 完整的用户ViewModel - 演示所有功能
 */
@viewModel
class UserProfileViewModel extends ViewModel {
    public get name(): string { return 'UserProfileViewModel'; }

    @observable
    public firstName: string = '';

    @observable
    public lastName: string = '';

    @observable
    public age: number = 0;

    @observable
    public score: number = 0;

    @observable
    public isVip: boolean = false;

    @computed(['firstName', 'lastName'])
    public get fullName(): string {
        return `${this.firstName} ${this.lastName}`.trim();
    }

    @computed(['age'])
    public get isAdult(): boolean {
        return this.age >= 18;
    }

    @command()
    public updateProfile(firstName: string, lastName: string, age: number): void {
        this.firstName = firstName;
        this.lastName = lastName;
        this.age = age;
    }

    @command()
    public addScore(points: number): void {
        this.score += points;
    }

    @command('canPromoteToVip')
    public promoteToVip(): void {
        this.isVip = true;
    }

    public canPromoteToVip(): boolean {
        return this.score >= 1000 && this.isAdult;
    }

    @command({ async: true })
    public async saveProfile(): Promise<void> {
        // 模拟保存操作
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('Profile saved:', this.fullName);
    }
}

// 模拟UI元素
class MockUIElement {
    public textContent: string = '';
    public value: string = '';
    public className: string = '';
    public style: { display?: string; visibility?: string } = {};
    private _observers: Map<string | null, Function[]> = new Map();

    public addObserver(property: string | null, observer: Function): void {
        if (!this._observers.has(property)) {
            this._observers.set(property, []);
        }
        this._observers.get(property)!.push(observer);
    }

    public removeObserver(property: string | null, observer: Function): void {
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

    public updateValue(newValue: string): void {
        const oldValue = this.value;
        this.value = newValue;
        this.notifyObservers('value', newValue, oldValue);
    }
}

// 模拟UI加载器
class MockUILoader {
    public async loadUI(config: any): Promise<any> {
        return {
            name: config.name,
            element: new MockUIElement()
        };
    }

    public async unloadUI(config: any): Promise<void> {
        // 清理逻辑
    }

    public isLoaded(config: any): boolean {
        return true;
    }
}

describe('MVVM框架集成测试', () => {
    let viewModel: UserProfileViewModel;
    let dataBinding: DataBinding;
    let uiManager: UIManager;

    beforeEach(() => {
        viewModel = new UserProfileViewModel();
        dataBinding = DataBinding.getInstance();
        uiManager = UIManager.getInstance();
        uiManager.setLoader(new MockUILoader());
        
        // 清理之前的绑定
        dataBinding.unbindAll();
    });

    afterEach(() => {
        viewModel.destroy();
        dataBinding.unbindAll();
        uiManager.destroy();
    });

    describe('基础功能集成', () => {
        test('ViewModel + Observable + Computed 应该协同工作', () => {
            // 设置初始值
            viewModel.firstName = 'John';
            viewModel.lastName = 'Doe';
            viewModel.age = 25;

            // 验证计算属性
            expect(viewModel.fullName).toBe('John Doe');
            expect(viewModel.isAdult).toBe(true);

            // 修改依赖属性
            viewModel.firstName = 'Jane';
            expect(viewModel.fullName).toBe('Jane Doe');

            viewModel.age = 16;
            expect(viewModel.isAdult).toBe(false);
        });

        test('参数化命令应该正常工作', () => {
            // 使用参数化命令更新用户资料
            viewModel.executeCommand('updateProfile', 'Alice', 'Smith', 30);

            expect(viewModel.firstName).toBe('Alice');
            expect(viewModel.lastName).toBe('Smith');
            expect(viewModel.age).toBe(30);
            expect(viewModel.fullName).toBe('Alice Smith');
            expect(viewModel.isAdult).toBe(true);
        });

        test('带条件的命令应该正确执行', () => {
            // 初始状态不能成为VIP
            expect(viewModel.canExecuteCommand('promoteToVip')).toBe(false);
            viewModel.executeCommand('promoteToVip');
            expect(viewModel.isVip).toBe(false);

            // 满足条件后可以成为VIP
            viewModel.age = 25; // 成人
            viewModel.executeCommand('addScore', 1500); // 足够积分
            expect(viewModel.canExecuteCommand('promoteToVip')).toBe(true);
            viewModel.executeCommand('promoteToVip');
            expect(viewModel.isVip).toBe(true);
        });

        test('异步命令应该正常执行', async () => {
            viewModel.firstName = 'Test';
            viewModel.lastName = 'User';

            // 执行异步命令
            await expect(viewModel.saveProfile()).resolves.not.toThrow();
        });
    });

    describe('数据绑定集成', () => {
        test('单向绑定应该同步数据', () => {
            const nameElement = new MockUIElement();
            const ageElement = new MockUIElement();

            // 创建绑定
            dataBinding.bind(viewModel, nameElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'fullName',
                target: 'textContent'
            });

            dataBinding.bind(viewModel, ageElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.FORMAT,
                source: 'age',
                target: 'textContent',
                format: 'Age: {0}'
            });

            // 更新ViewModel数据
            viewModel.firstName = 'John';
            viewModel.lastName = 'Doe';
            viewModel.age = 25;

            // 验证UI更新
            expect(nameElement.textContent).toBe('John Doe');
            expect(ageElement.textContent).toBe('Age: 25');
        });

        test('值转换器应该正常工作', () => {
            const vipStatusElement = new MockUIElement();
            const scoreElement = new MockUIElement();

            // 布尔值转字符串转换器
            dataBinding.bind(viewModel, vipStatusElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'isVip',
                target: 'textContent',
                converter: 'string'
            });

            // 数字转换器
            dataBinding.bind(viewModel, scoreElement, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'score',
                target: 'textContent',
                converter: 'string'
            });

            viewModel.isVip = true;
            viewModel.score = 1500;

            expect(vipStatusElement.textContent).toBe('true');
            expect(scoreElement.textContent).toBe('1500');
        });

        test('双向绑定应该同步工作', () => {
            const nameInput = new MockUIElement();

            // 双向绑定
            dataBinding.bind(viewModel, nameInput, {
                type: BindingType.TWO_WAY,
                mode: BindingMode.REPLACE,
                source: 'firstName',
                target: 'value'
            });

            // ViewModel -> UI
            viewModel.firstName = 'Initial';
            expect(nameInput.value).toBe('Initial');

            // 模拟UI更新（需要手动触发，因为这是模拟环境）
            nameInput.updateValue('Updated');
            expect(viewModel.firstName).toBe('Updated');
        });
    });

    describe('UI管理器集成', () => {
        test('UI生命周期应该正常管理', async () => {
            const uiConfig = {
                name: 'UserProfile',
                path: 'ui/UserProfile',
                layer: UILayer.MAIN,
                modal: false,
                cacheable: true
            };

            // 注册UI
            uiManager.registerUI(uiConfig);

            // 显示UI
            const instance = await uiManager.showUI('UserProfile', viewModel);
            expect(instance).toBeDefined();
            expect(instance.viewModel).toBe(viewModel);
            expect(uiManager.isUIShown('UserProfile')).toBe(true);

            // 隐藏UI
            await uiManager.hideUI('UserProfile');
            expect(uiManager.isUIShown('UserProfile')).toBe(false);
            expect(uiManager.hasUI('UserProfile')).toBe(true); // 缓存的

            // 显示UI（使用缓存）
            const cachedInstance = await uiManager.showUI('UserProfile');
            expect(cachedInstance).toBe(instance);

            // 关闭UI
            await uiManager.closeUI('UserProfile');
            expect(uiManager.hasUI('UserProfile')).toBe(false);
        });

        test('UI事件应该正常触发', async () => {
            const showEvents: string[] = [];
            const hideEvents: string[] = [];

            uiManager.addEventListener('will_show' as any, (name) => showEvents.push(`will_show:${name}`));
            uiManager.addEventListener('did_show' as any, (name) => showEvents.push(`did_show:${name}`));
            uiManager.addEventListener('will_hide' as any, (name) => hideEvents.push(`will_hide:${name}`));
            uiManager.addEventListener('did_hide' as any, (name) => hideEvents.push(`did_hide:${name}`));

            const config = { name: 'EventTest', path: 'ui/EventTest' };
            uiManager.registerUI(config);

            await uiManager.showUI('EventTest');
            expect(showEvents).toEqual(['will_show:EventTest', 'did_show:EventTest']);

            await uiManager.hideUI('EventTest');
            expect(hideEvents).toEqual(['will_hide:EventTest', 'did_hide:EventTest']);
        });
    });

    describe('完整工作流程', () => {
        test('用户资料编辑完整流程', async () => {
            // 1. 创建UI元素
            const nameDisplay = new MockUIElement();
            const ageDisplay = new MockUIElement();
            const scoreDisplay = new MockUIElement();
            const vipStatus = new MockUIElement();
            const adultStatus = new MockUIElement();

            // 2. 建立数据绑定
            dataBinding.bind(viewModel, nameDisplay, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'fullName',
                target: 'textContent'
            });

            dataBinding.bind(viewModel, ageDisplay, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.FORMAT,
                source: 'age',
                target: 'textContent',
                format: 'Age: {0}'
            });

            dataBinding.bind(viewModel, scoreDisplay, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.FORMAT,
                source: 'score',
                target: 'textContent',
                format: 'Score: {0}'
            });

            dataBinding.bind(viewModel, vipStatus, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'isVip',
                target: 'textContent',
                converter: 'string'
            });

            dataBinding.bind(viewModel, adultStatus, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'isAdult',
                target: 'textContent',
                converter: 'string'
            });

            // 3. 通过命令更新数据
            viewModel.executeCommand('updateProfile', 'Alice', 'Johnson', 28);
            viewModel.executeCommand('addScore', 500);

            // 4. 验证UI自动更新
            expect(nameDisplay.textContent).toBe('Alice Johnson');
            expect(ageDisplay.textContent).toBe('Age: 28');
            expect(scoreDisplay.textContent).toBe('Score: 500');
            expect(vipStatus.textContent).toBe('false');
            expect(adultStatus.textContent).toBe('true');

            // 5. 继续增加积分到VIP门槛
            viewModel.executeCommand('addScore', 600);
            expect(scoreDisplay.textContent).toBe('Score: 1100');

            // 6. 检查VIP升级条件
            expect(viewModel.canExecuteCommand('promoteToVip')).toBe(true);

            // 7. 升级到VIP
            viewModel.executeCommand('promoteToVip');
            expect(vipStatus.textContent).toBe('true');

            // 8. 异步保存
            await expect(viewModel.saveProfile()).resolves.not.toThrow();
        });
    });

    describe('性能和内存管理', () => {
        test('销毁应该正确清理资源', () => {
            const element = new MockUIElement();
            const observer = jest.fn();

            // 建立观察和绑定
            viewModel.addObserver('firstName', observer);
            dataBinding.bind(viewModel, element, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'firstName',
                target: 'textContent'
            });

            // 验证正常工作
            viewModel.firstName = 'Test';
            expect(observer).toHaveBeenCalled();
            expect(element.textContent).toBe('Test');

            // 清理资源
            dataBinding.unbindAll();
            viewModel.destroy();

            // 验证清理后不再响应
            observer.mockClear();
            viewModel.firstName = 'After Destroy';
            expect(observer).not.toHaveBeenCalled();
        });
    });

    describe('错误处理', () => {
        test('应该优雅处理各种错误情况', () => {
            // 执行不存在的命令
            expect(() => {
                viewModel.executeCommand('nonExistentCommand', 'param');
            }).not.toThrow();

            // 绑定到null对象
            expect(() => {
                dataBinding.bind(viewModel, null as any, {
                    type: BindingType.ONE_WAY,
                    mode: BindingMode.REPLACE,
                    source: 'firstName',
                    target: 'textContent'
                });
            }).not.toThrow();

            // 解除不存在的绑定
            expect(() => {
                dataBinding.unbind('non-existent-binding');
            }).not.toThrow();
        });
    });
});

describe('createObservable工厂函数', () => {
    test('应该创建可观察的普通对象', () => {
        const data = { name: 'Test', value: 42 };
        const observable = createObservable(data);
        const observer = jest.fn();

        observable.addObserver('name', observer);
        observable.name = 'Updated';

        expect(observer).toHaveBeenCalledWith('Updated', 'Test', 'name');
        expect(observable.name).toBe('Updated');
    });
});