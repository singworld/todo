<script setup lang="ts">
import { computed } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import TaskItem from './TaskItem.vue'
import EmptyState from './EmptyState.vue'
import draggable from 'vuedraggable'

const emit = defineEmits<{
  editTask: [id: string]
}>()

const taskStore = useTaskStore()

const isDraggable = computed(() => taskStore.sortMode === 'manual')

const handleDragEnd = () => {
  // draggable 已经更新了数组顺序,只需保存
  taskStore.reorderTasksByDrag(taskStore.sortedTasks)
}

const handleToggleComplete = (id: string) => {
  taskStore.toggleTaskComplete(id)
}

const handleEdit = (id: string) => {
  emit('editTask', id)
}

const handleDelete = (id: string) => {
  if (confirm('确定要删除这个任务吗?')) {
    taskStore.deleteTask(id)
  }
}
</script>

<template>
  <div>
    <EmptyState v-if="taskStore.sortedTasks.length === 0" />

    <draggable
      v-else
      v-model="taskStore.sortedTasks"
      :disabled="!isDraggable"
      item-key="id"
      class="space-y-3"
      @end="handleDragEnd"
      handle=".drag-handle"
      ghost-class="opacity-50"
    >
      <template #item="{ element: task }">
        <TaskItem
          :task="task"
          :draggable="isDraggable"
          @toggle-complete="handleToggleComplete"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </template>
    </draggable>
  </div>
</template>
