// src/services/taskStateService.js

/**
 * A simple in-memory state manager to track running tasks.
 * This prevents concurrent execution of long-running processes
 * like email fetching or Notion syncing.
 */

// We use a Set to store the names of currently running tasks
const runningTasks = new Set();

/**
 * Checks if a specific task is currently active.
 * @param {string} taskName - The unique name of the task (e.g., 'email_fetch').
 * @returns {boolean} True if the task is running, false otherwise.
 */
const isTaskRunning = (taskName) => {
  return runningTasks.has(taskName);
};

/**
 * Sets a task state to 'running' (locked).
 * @param {string} taskName - The unique name of the task.
 */
const startTask = (taskName) => {
  runningTasks.add(taskName);
  console.log(`Task lock acquired: [${taskName}]. Process starting...`);
};

/**
 * Sets a task state to 'finished' (unlocked).
 * @param {string} taskName - The unique name of the task.
 */
const endTask = (taskName) => {
  runningTasks.delete(taskName);
  console.log(`Task lock released: [${taskName}]. Ready for next run.`);
};

module.exports = {
  isTaskRunning,
  startTask,
  endTask
};