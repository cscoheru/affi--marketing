<script setup lang="ts">
// Main App Component
</script>

<template>
  <router-view />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 让页面可以正常滚动 */
#app {
  min-height: 100vh;
}

/* 仪表板页面需要固定高度 */
#app.is-dashboard {
  height: 100vh;
  overflow: hidden;
}
</style>
