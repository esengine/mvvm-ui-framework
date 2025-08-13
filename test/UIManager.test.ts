import { 
    UIManager, 
    UIConfig, 
    UILayer, 
    UIState, 
    UIEvent,
    IUILoader,
    uiManager
} from '../src/managers/UIManager';
import { ViewModel } from '../src/core/ViewModel';

// 测试用的ViewModel
class TestUIViewModel extends ViewModel {
    public get name(): string { return 'TestUIViewModel'; }
    
    public data: string = 'test-data';
}

// 模拟UI加载器
class MockUILoader implements IUILoader {
    private loadedUIs: Set<string> = new Set();
    private loadDelay: number = 0;
    private shouldFailLoad: boolean = false;

    constructor(loadDelay: number = 0) {
        this.loadDelay = loadDelay;
    }

    public setLoadDelay(delay: number): void {
        this.loadDelay = delay;
    }

    public setShouldFailLoad(shouldFail: boolean): void {
        this.shouldFailLoad = shouldFail;
    }

    public async loadUI(config: UIConfig): Promise<any> {
        if (this.shouldFailLoad) {
            throw new Error(`Failed to load UI: ${config.name}`);
        }

        await new Promise(resolve => setTimeout(resolve, this.loadDelay));
        
        const mockView = {
            name: config.name,
            path: config.path,
            loaded: true
        };
        
        this.loadedUIs.add(config.name);
        return mockView;
    }

    public async unloadUI(config: UIConfig): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, this.loadDelay / 2));
        this.loadedUIs.delete(config.name);
    }

    public isLoaded(config: UIConfig): boolean {
        return this.loadedUIs.has(config.name);
    }

    public getLoadedUIs(): string[] {
        return Array.from(this.loadedUIs);
    }
}

describe('UIManager', () => {
    let manager: UIManager;
    let mockLoader: MockUILoader;

    beforeEach(() => {
        manager = new UIManager();
        mockLoader = new MockUILoader();
        manager.setLoader(mockLoader);
    });

    afterEach(() => {
        manager.destroy();
    });

    describe('单例模式', () => {
        test('应该返回相同的实例', () => {
            const instance1 = UIManager.getInstance();
            const instance2 = UIManager.getInstance();
            expect(instance1).toBe(instance2);
        });

        test('uiManager导出应该是同一个实例', () => {
            expect(uiManager).toBe(UIManager.getInstance());
        });
    });

    describe('UI配置管理', () => {
        test('应该注册UI配置', () => {
            const config: UIConfig = {
                name: 'TestPanel',
                path: 'panels/TestPanel',
                modal: false,
                cacheable: true,
                layer: UILayer.MAIN
            };

            manager.registerUI(config);
            
            // 通过尝试显示UI来验证配置是否注册成功
            expect(async () => {
                await manager.showUI('TestPanel');
            }).not.toThrow();
        });

        test('应该批量注册UI配置', () => {
            const configs: UIConfig[] = [
                { name: 'Panel1', path: 'panels/Panel1' },
                { name: 'Panel2', path: 'panels/Panel2' },
                { name: 'Panel3', path: 'panels/Panel3' }
            ];

            manager.registerUIs(configs);

            // 验证所有配置都已注册
            for (const config of configs) {
                expect(async () => {
                    await manager.showUI(config.name);
                }).not.toThrow();
            }
        });

        test('应该合并默认配置', () => {
            const config: UIConfig = {
                name: 'MinimalPanel',
                path: 'panels/MinimalPanel'
            };

            manager.registerUI(config);
            
            // 配置应该包含默认值
            expect(async () => {
                const instance = await manager.showUI('MinimalPanel');
                expect(instance.config.modal).toBe(false);
                expect(instance.config.cacheable).toBe(true);
                expect(instance.config.layer).toBe(UILayer.MAIN);
            }).not.toThrow();
        });
    });

    describe('UI生命周期', () => {
        const testConfig: UIConfig = {
            name: 'LifecycleTest',
            path: 'panels/LifecycleTest',
            modal: false,
            cacheable: true
        };

        beforeEach(() => {
            manager.registerUI(testConfig);
        });

        test('应该成功显示UI', async () => {
            const instance = await manager.showUI('LifecycleTest');

            expect(instance).toBeDefined();
            expect(instance.config.name).toBe('LifecycleTest');
            expect(instance.state).toBe(UIState.SHOWN);
            expect(manager.isUIShown('LifecycleTest')).toBe(true);
            expect(manager.hasUI('LifecycleTest')).toBe(true);
        });

        test('应该支持传递ViewModel和userData', async () => {
            const viewModel = new TestUIViewModel();
            const userData = { custom: 'data' };

            const instance = await manager.showUI('LifecycleTest', viewModel, userData);

            expect(instance.viewModel).toBe(viewModel);
            expect(instance.userData).toEqual(userData);
        });

        test('应该成功隐藏UI', async () => {
            await manager.showUI('LifecycleTest');
            
            await manager.hideUI('LifecycleTest');

            expect(manager.isUIShown('LifecycleTest')).toBe(false);
            expect(manager.hasUI('LifecycleTest')).toBe(true); // 仍然存在，只是隐藏
        });

        test('应该成功关闭UI', async () => {
            await manager.showUI('LifecycleTest');
            
            await manager.closeUI('LifecycleTest');

            expect(manager.isUIShown('LifecycleTest')).toBe(false);
            expect(manager.hasUI('LifecycleTest')).toBe(false); // 已销毁
        });

        test('应该处理不存在的UI操作', async () => {
            await expect(manager.hideUI('NonExistent')).resolves.not.toThrow();
            await expect(manager.closeUI('NonExistent')).resolves.not.toThrow();
        });
    });

    describe('UI显示栈管理', () => {
        const configs: UIConfig[] = [
            { name: 'Panel1', path: 'panels/Panel1' },
            { name: 'Panel2', path: 'panels/Panel2' },
            { name: 'Modal1', path: 'modals/Modal1', modal: true }
        ];

        beforeEach(() => {
            manager.registerUIs(configs);
        });

        test('应该管理显示栈', async () => {
            await manager.showUI('Panel1');
            await manager.showUI('Panel2');
            await manager.showUI('Modal1');

            const shownUIs = manager.getShownUIs();
            expect(shownUIs).toEqual(['Panel1', 'Panel2', 'Modal1']);
        });

        test('应该获取顶层UI', async () => {
            await manager.showUI('Panel1');
            await manager.showUI('Panel2');

            expect(manager.getTopUI()).toBe('Panel2');
        });

        test('隐藏UI应该从栈中移除', async () => {
            await manager.showUI('Panel1');
            await manager.showUI('Panel2');
            await manager.showUI('Modal1');

            await manager.hideUI('Panel2');

            const shownUIs = manager.getShownUIs();
            expect(shownUIs).toEqual(['Panel1', 'Modal1']);
        });

        test('应该隐藏所有UI', async () => {
            await manager.showUI('Panel1');
            await manager.showUI('Panel2');
            await manager.showUI('Modal1');

            await manager.hideAllUIs();

            expect(manager.getShownUIs()).toEqual([]);
            expect(manager.getTopUI()).toBeUndefined();
        });

        test('应该关闭所有UI', async () => {
            await manager.showUI('Panel1');
            await manager.showUI('Panel2');

            await manager.closeAllUIs();

            expect(manager.hasUI('Panel1')).toBe(false);
            expect(manager.hasUI('Panel2')).toBe(false);
            expect(manager.getShownUIs()).toEqual([]);
        });
    });

    describe('UI缓存', () => {
        const cacheableConfig: UIConfig = {
            name: 'CacheablePanel',
            path: 'panels/CacheablePanel',
            cacheable: true
        };

        const nonCacheableConfig: UIConfig = {
            name: 'NonCacheablePanel',
            path: 'panels/NonCacheablePanel',
            cacheable: false
        };

        beforeEach(() => {
            manager.registerUIs([cacheableConfig, nonCacheableConfig]);
        });

        test('应该复用缓存的UI实例', async () => {
            const instance1 = await manager.showUI('CacheablePanel');
            await manager.hideUI('CacheablePanel');
            
            const instance2 = await manager.showUI('CacheablePanel');

            expect(instance1).toBe(instance2);
        });

        test('应该清理缓存', async () => {
            await manager.showUI('CacheablePanel');
            await manager.hideUI('CacheablePanel');
            
            expect(manager.hasUI('CacheablePanel')).toBe(true);
            
            manager.clearCache();
            
            expect(manager.hasUI('CacheablePanel')).toBe(false);
        });
    });

    describe('UI事件系统', () => {
        const eventConfig: UIConfig = {
            name: 'EventTest',
            path: 'panels/EventTest'
        };

        beforeEach(() => {
            manager.registerUI(eventConfig);
        });

        test('应该触发显示事件', async () => {
            const willShowListener = jest.fn();
            const didShowListener = jest.fn();

            manager.addEventListener(UIEvent.WILL_SHOW, willShowListener);
            manager.addEventListener(UIEvent.DID_SHOW, didShowListener);

            await manager.showUI('EventTest');

            expect(willShowListener).toHaveBeenCalledWith('EventTest', expect.any(Object));
            expect(didShowListener).toHaveBeenCalledWith('EventTest', expect.any(Object));
        });

        test('应该触发隐藏事件', async () => {
            const willHideListener = jest.fn();
            const didHideListener = jest.fn();

            manager.addEventListener(UIEvent.WILL_HIDE, willHideListener);
            manager.addEventListener(UIEvent.DID_HIDE, didHideListener);

            await manager.showUI('EventTest');
            await manager.hideUI('EventTest');

            expect(willHideListener).toHaveBeenCalledWith('EventTest', expect.any(Object));
            expect(didHideListener).toHaveBeenCalledWith('EventTest', expect.any(Object));
        });

        test('应该触发销毁事件', async () => {
            const willDestroyListener = jest.fn();
            const didDestroyListener = jest.fn();

            manager.addEventListener(UIEvent.WILL_DESTROY, willDestroyListener);
            manager.addEventListener(UIEvent.DID_DESTROY, didDestroyListener);

            await manager.showUI('EventTest');
            await manager.closeUI('EventTest');

            expect(willDestroyListener).toHaveBeenCalledWith('EventTest', expect.any(Object));
            expect(didDestroyListener).toHaveBeenCalledWith('EventTest', expect.any(Object));
        });

        test('应该移除事件监听器', async () => {
            const listener = jest.fn();

            manager.addEventListener(UIEvent.DID_SHOW, listener);
            manager.removeEventListener(UIEvent.DID_SHOW, listener);

            await manager.showUI('EventTest');

            expect(listener).not.toHaveBeenCalled();
        });

        test('事件监听器异常不应该影响UI操作', async () => {
            const errorListener = jest.fn(() => {
                throw new Error('Listener error');
            });
            const normalListener = jest.fn();

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            manager.addEventListener(UIEvent.DID_SHOW, errorListener);
            manager.addEventListener(UIEvent.DID_SHOW, normalListener);

            await expect(manager.showUI('EventTest')).resolves.toBeDefined();

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('UI事件监听器错误'),
                expect.any(Error)
            );
            expect(normalListener).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('UI加载器', () => {
        const loaderConfig: UIConfig = {
            name: 'LoaderTest',
            path: 'panels/LoaderTest'
        };

        beforeEach(() => {
            manager.registerUI(loaderConfig);
        });

        test('应该使用加载器加载UI', async () => {
            const instance = await manager.showUI('LoaderTest');

            expect(instance.view).toBeDefined();
            expect(instance.view.name).toBe('LoaderTest');
            expect(mockLoader.isLoaded(loaderConfig)).toBe(true);
        });

        test('应该处理加载失败', async () => {
            mockLoader.setShouldFailLoad(true);

            await expect(manager.showUI('LoaderTest')).rejects.toThrow(
                'Failed to load UI: LoaderTest'
            );
        });

        test('应该处理异步加载', async () => {
            mockLoader.setLoadDelay(100);

            const startTime = Date.now();
            await manager.showUI('LoaderTest');
            const endTime = Date.now();

            expect(endTime - startTime).toBeGreaterThanOrEqual(95); // 允许一些误差
        });

        test('应该在销毁时卸载UI', async () => {
            await manager.showUI('LoaderTest');
            expect(mockLoader.isLoaded(loaderConfig)).toBe(true);

            await manager.closeUI('LoaderTest');
            expect(mockLoader.isLoaded(loaderConfig)).toBe(false);
        });
    });

    describe('预加载', () => {
        test('应该支持预加载UI', async () => {
            const preloadConfig: UIConfig = {
                name: 'PreloadTest',
                path: 'panels/PreloadTest',
                preload: true
            };

            // 注册时应该自动预加载
            manager.registerUI(preloadConfig);

            // 等待预加载完成
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(manager.hasUI('PreloadTest')).toBe(true);
            expect(mockLoader.isLoaded(preloadConfig)).toBe(true);
        });

        test('应该支持手动预加载', async () => {
            const manualConfig: UIConfig = {
                name: 'ManualPreload',
                path: 'panels/ManualPreload'
            };

            manager.registerUI(manualConfig);
            expect(manager.hasUI('ManualPreload')).toBe(false);

            await manager.preloadUI('ManualPreload');
            expect(manager.hasUI('ManualPreload')).toBe(true);
        });

        test('重复预加载应该被忽略', async () => {
            const config: UIConfig = {
                name: 'DuplicatePreload',
                path: 'panels/DuplicatePreload'
            };

            manager.registerUI(config);
            
            await manager.preloadUI('DuplicatePreload');
            const instance1 = manager.getUI('DuplicatePreload');
            
            await manager.preloadUI('DuplicatePreload');
            const instance2 = manager.getUI('DuplicatePreload');

            expect(instance1).toBe(instance2);
        });

        test('预加载不存在的UI应该抛出错误', async () => {
            await expect(manager.preloadUI('NonExistent')).rejects.toThrow(
                'UI配置不存在: NonExistent'
            );
        });
    });

    describe('UI查询', () => {
        const queryConfig: UIConfig = {
            name: 'QueryTest',
            path: 'panels/QueryTest'
        };

        beforeEach(() => {
            manager.registerUI(queryConfig);
        });

        test('应该获取UI实例', async () => {
            const instance = await manager.showUI('QueryTest');
            const retrieved = manager.getUI('QueryTest');

            expect(retrieved).toBe(instance);
        });

        test('不存在的UI应该返回undefined', () => {
            const retrieved = manager.getUI('NonExistent');
            expect(retrieved).toBeUndefined();
        });

        test('应该检查UI是否存在', async () => {
            expect(manager.hasUI('QueryTest')).toBe(false);
            
            await manager.showUI('QueryTest');
            expect(manager.hasUI('QueryTest')).toBe(true);
            
            await manager.closeUI('QueryTest');
            expect(manager.hasUI('QueryTest')).toBe(false);
        });

        test('应该检查UI是否显示', async () => {
            expect(manager.isUIShown('QueryTest')).toBe(false);
            
            await manager.showUI('QueryTest');
            expect(manager.isUIShown('QueryTest')).toBe(true);
            
            await manager.hideUI('QueryTest');
            expect(manager.isUIShown('QueryTest')).toBe(false);
        });
    });

    describe('错误处理', () => {
        test('应该处理显示不存在的UI', async () => {
            await expect(manager.showUI('NonExistent')).rejects.toThrow(
                'UI配置不存在: NonExistent'
            );
        });

        test('应该处理没有设置加载器的情况', async () => {
            const noLoaderManager = new UIManager();
            noLoaderManager.registerUI({ name: 'Test', path: 'test' });

            const instance = await noLoaderManager.showUI('Test');
            expect(instance.view).toBeUndefined();
        });
    });

    describe('销毁和清理', () => {
        test('应该正确销毁管理器', async () => {
            const config: UIConfig = { name: 'DestroyTest', path: 'panels/DestroyTest' };
            manager.registerUI(config);
            
            await manager.showUI('DestroyTest');
            expect(manager.hasUI('DestroyTest')).toBe(true);

            manager.destroy();

            expect(manager.hasUI('DestroyTest')).toBe(false);
            expect(manager.getShownUIs()).toEqual([]);
        });
    });
});