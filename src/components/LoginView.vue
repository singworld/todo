<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { Lock } from 'lucide-vue-next';

const { login } = useAuth();
const password = ref('');
const error = ref('');
const isLoading = ref(false);

const handleSubmit = async () => {
  if (!password.value) {
    error.value = '请输入密码';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    const success = await login(password.value);
    if (!success) {
      error.value = '密码错误';
    }
  } catch (e) {
    error.value = '登录出错，请重试';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
      <div class="p-8">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <Lock class="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            访问控制
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            请输入密码以访问应用
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              密码
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="请输入密码"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 transition-colors"
              :class="{ 'border-red-500 focus:ring-red-500': error }"
              autofocus
            />
            <p v-if="error" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ error }}
            </p>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="isLoading">验证中...</span>
            <span v-else>进入应用</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
