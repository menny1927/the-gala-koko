export async function safeInit(name, fn) {
  try {
    return await fn();
  } catch (err) {
    console.error(`[${name}] init failed:`, err);
    return undefined;
  }
}
