import cluster, { Worker } from "cluster";
import os from "os";
import { performance } from "perf_hooks";

export const runCluster = async (fn: (...args: any[]) => any, args: any[]) => {
  const taskQueue = [...args];
  const numCPUs = os.cpus().length;
  const workers: Worker[] = [];

  if (cluster.isPrimary) {
    console.log(`Master ${process.pid} running with ${numCPUs} workers`);

    for (let i = 0; i < numCPUs; i++) {
      const worker = cluster.fork();
      workers.push(worker);

      // Quand un worker demande une tâche
      worker.on("message", async (msg: any) => {
        if (msg === "request-task") {
          const nextArg = taskQueue.shift();

          if (nextArg) {
            worker.send({ execute: true, arg: nextArg });
          } else {
            worker.send({ done: true });
          }
        }
      });

      // Si un worker meurt, on peut en recréer un (optionnel)
      worker.on("exit", (code, signal) => {
        console.log(`Worker ${worker.process.pid} exited`);
      });
    }
  } else {
    // Partie worker
    process.on(
      "message",
      async (msg: { execute?: boolean; done?: boolean; arg: any }) => {
        if (msg.execute) {
          const start = performance.now();
          try {
            await fn(msg.arg);
          } finally {
            const end = performance.now();
            const duration = (end - start).toFixed(2);

            // console.log(`Worker ${process.pid} processed in ${duration} ms`);
          }
          // await collect(...msg.args); // Traitement de l’IP
          process.send?.("request-task"); // Redemande une tâche après
        } else if (msg.done) {
          //   console.log(`Worker ${process.pid} has no more tasks.`);
          process.exit(0);
        }
      }
    );

    // Première demande de tâche
    process.send?.("request-task");
  }
};
