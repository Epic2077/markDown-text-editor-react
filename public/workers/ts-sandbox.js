// public/ts-sandbox.js

// Import the standalone TypeScript compiler
importScripts(
  "https://cdnjs.cloudflare.com/ajax/libs/typescript/5.3.3/typescript.min.js",
);

self.onmessage = async (event) => {
  const { code, language } = event.data;
  if (!code) return;

  const start = performance.now();
  let outputText = "";
  let errorText = "";

  // 1. Intercept console methods to capture output
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  };

  const captureConsole =
    (type) =>
    (...args) => {
      const msg = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg),
        )
        .join(" ");

      if (type === "error") {
        errorText += msg + "\n";
      } else {
        outputText += msg + "\n";
      }
    };

  console.log = captureConsole("log");
  console.error = captureConsole("error");
  console.warn = captureConsole("warn");
  console.info = captureConsole("info");

  try {
    let jsCode = code;

    // 2. Transpile TS to JS if needed
    if (language === "typescript" || language === "ts") {
      // ts is globally available from the imported script
      jsCode = ts.transpile(code, {
        target: ts.ScriptTarget.ES2022,
      });
    }

    // 3. Execute the code
    // We use AsyncFunction to allow top-level await in the user's code
    const AsyncFunction = Object.getPrototypeOf(
      async function () {},
    ).constructor;
    const execute = new AsyncFunction(jsCode);

    await execute();

    self.postMessage({
      type: "result",
      output: outputText.trim(),
      error: errorText.trim() || undefined,
      executionTime: Math.round(performance.now() - start),
    });
  } catch (e) {
    self.postMessage({
      type: "result",
      output: outputText.trim(),
      error: (errorText + "\n" + e.message).trim(),
      executionTime: Math.round(performance.now() - start),
    });
  } finally {
    // Restore original console
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
  }
};
