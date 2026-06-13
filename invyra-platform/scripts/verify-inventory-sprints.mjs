import { spawnSync } from "node:child_process";

const sprints = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
for (const sprint of sprints) {
  const result = spawnSync(process.execPath, [`scripts/verify-inventory-sprint${sprint}.mjs`], { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    console.error(`Inventory Sprint ${sprint} verification failed.`);
    process.exit(result.status ?? 1);
  }
}
console.log("Inventory Sprint 1–10 verification passed. Coverage is structurally present for RC1 preparation.");
