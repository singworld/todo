import { ref, watch, onMounted } from 'vue'
import type { Theme } from '@/types/task'

const THEME_STORAGE_KEY = 'todolist_theme'

export function useTheme() {
  const theme = ref<Theme>('light')

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement

    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  }

  const loadTheme = () => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null

    if (saved === 'light' || saved === 'dark') {
      theme.value = saved
    } else {
      // 检测系统偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      theme.value = prefersDark ? 'dark' : 'light'
    }

    applyTheme(theme.value)
  }

  watch(theme, (newTheme) => {
    applyTheme(newTheme)
  })

  onMounted(() => {
    loadTheme()
  })

  return {
    theme,
    toggleTheme,
  }
}
