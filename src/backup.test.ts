import * as bdsBackup from "./backup";
export const name = "backup";
export const depends = "startServer";

export async function CreateBufferZip() {
  console.log("Creating backup zip");
  const backup = await bdsBackup.CreateBackup();
  console.log("Zip Bytes: %o", backup.length);
}

export async function gitBackup() {
  console.log("Git Backup");
  await bdsBackup.gitBackup({
    branch: "test"
  });
}