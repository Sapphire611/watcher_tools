<template>
  <div class="hello-container">
    <h1>Welcome to Watcher Tools!</h1>
    <h1>Author: Liu Liyi</h1>
    <p>Electron Version: {{ electronVersion }}</p>
    <p>Ping Result: {{ pingResult }}</p>
    <p>Count: {{ counter.count }}</p>

    <div class="button-group">
      <button @click="handlePing">Ping Main Process</button>
      <button @click="handleAsync">Async Operation</button>
      <button @click="counter.increment">Increment</button>
      <button @click="counter.decrement">Decrement</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useCounterStore } from "@/stores/counter";

const counter = useCounterStore();
const electronVersion = ref("");
const pingResult = ref("Click to ping");

onMounted(async () => {
  electronVersion.value = await window.api.getAppVersion();
});

const handlePing = async () => {
  pingResult.value = await window.api.ping();
};

const handleAsync = async () => {
  const result = await window.api.asyncOperation("test data");
  pingResult.value = result;
};
</script>

<style scoped>
.hello-container {
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #42b983;
}

.button-group {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

button {
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #33a06f;
}

p {
  font-size: 16px;
  margin: 10px 0;
}
</style>
