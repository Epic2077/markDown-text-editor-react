let pyodide = null;

// 1. Rename your function so it doesn't conflict with the library's loadPyodide
async function initPyodide() {
  self.postMessage({ status: "loading" });

  // This script injects the actual `loadPyodide` function into the global scope
  importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js");

  // 2. Now this correctly calls the library's function
  pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/",
  });

  self.postMessage({ status: "ready" });
}

// 3. Call your renamed function
const ready = initPyodide();

self.onmessage = async ({ data: { code } }) => {
  await ready;
  const start = performance.now();

  try {
    // Redirect stdout/stderr
    pyodide.runPython(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
    `);

    await pyodide.runPythonAsync(code);

    const output = pyodide.runPython("sys.stdout.getvalue()");
    const stderr = pyodide.runPython("sys.stderr.getvalue()");

    self.postMessage({
      output: output || "",
      error: stderr || undefined,
      executionTime: performance.now() - start,
    });
  } catch (e) {
    self.postMessage({
      output: "",
      error: e.message,
      executionTime: performance.now() - start,
    });
  }
};
