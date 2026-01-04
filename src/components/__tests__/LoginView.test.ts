import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import LoginView from '../LoginView.vue';

// Mock useAuth
const loginMock = vi.fn();
vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    login: loginMock
  })
}));

describe('LoginView', () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  it('renders correctly', () => {
    const wrapper = mount(LoginView);
    expect(wrapper.find('h2').text()).toBe('访问控制');
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('shows error when submitting empty password', async () => {
    const wrapper = mount(LoginView);
    await wrapper.find('form').trigger('submit');
    expect(wrapper.text()).toContain('请输入密码');
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('calls login with password on submit', async () => {
    const wrapper = mount(LoginView);
    const passwordInput = wrapper.find('input[type="password"]');
    await passwordInput.setValue('secret123');
    
    loginMock.mockResolvedValue(true);
    await wrapper.find('form').trigger('submit');

    expect(loginMock).toHaveBeenCalledWith('secret123');
  });

  it('shows error message on failed login', async () => {
    const wrapper = mount(LoginView);
    const passwordInput = wrapper.find('input[type="password"]');
    await passwordInput.setValue('wrongpass');
    
    loginMock.mockResolvedValue(false);
    await wrapper.find('form').trigger('submit');

    // Wait for async operation
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 0)); 

    expect(wrapper.text()).toContain('密码错误');
  });

  it('shows generic error message on login exception', async () => {
    const wrapper = mount(LoginView);
    const passwordInput = wrapper.find('input[type="password"]');
    await passwordInput.setValue('crash');
    
    loginMock.mockRejectedValue(new Error('Network error'));
    await wrapper.find('form').trigger('submit');

    // Wait for async operation
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(wrapper.text()).toContain('登录出错，请重试');
  });

  it('shows loading state during submission', async () => {
    const wrapper = mount(LoginView);
    const passwordInput = wrapper.find('input[type="password"]');
    await passwordInput.setValue('wait');
    
    let resolveLogin: (value: boolean) => void;
    loginMock.mockReturnValue(new Promise(resolve => {
      resolveLogin = resolve;
    }));

    await wrapper.find('form').trigger('submit');
    expect(wrapper.text()).toContain('验证中...');
    expect(wrapper.find('button').element.disabled).toBe(true);

    // Finish
    // @ts-ignore
    resolveLogin(true);
    await wrapper.vm.$nextTick();
  });
});
