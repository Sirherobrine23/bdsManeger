import download from "./download";
import start from "./start";
const functionToRun: Array<(done: (done?: Error) => any) => Promise<void>> = [download, start];
(async () => {
  for (const done of functionToRun) {
    await new Promise((resolve, reject) => {
      const Run = done((error) => {
        if (error) return reject(error);
        resolve("");
      });
      return Run.catch(reject);
    });
  }
})().then(() => process.exit(0)).catch((error) => {
  console.error("Error: %s", String(error));
  process.exit(1);
});