/**
 * This is a simple in-memory state manager (a "lock" or "mutex").
 * It prevents multiple fetch processes from running at the same time.
 * Because Node.js modules are singletons, this state is shared
 * across the entire application.
 */

let isCurrentlyFetching = false;

/**
 * Checks if a fetch process is currently active.
 * @returns {boolean} True if fetching, false otherwise.
 */
const isFetching = () => {
  return isCurrentlyFetching;
};

/**
 * Sets the fetch state to 'true' (locked).
 */
const startFetch = () => {
  isCurrentlyFetching = true;
  console.log('Fetch lock acquired. Process starting...');
};

/**
 * Sets the fetch state to 'false' (unlocked).
 */
const endFetch = () => {
  isCurrentlyFetching = false;
  console.log('Fetch lock released. Ready for next run.');
};

module.exports = {
  isFetching,
  startFetch,
  endFetch
};