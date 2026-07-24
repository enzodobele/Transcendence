import { runBackup, runRestore } from "./backup";

const [cmd, arg] = process.argv.slice(2);

try {
  if (cmd === "backup") {
    const { file } = runBackup();
    console.log(`[cli] Backup created: ${file}`);
  } else if (cmd === "restore") {
    if (!arg) {
      console.error("Usage: cli restore <file>");
      process.exit(1);
    }
    runRestore(arg);
    console.log(`[cli] Restore completed: ${arg}`);
  } else {
    console.error("Usage: cli <backup | restore <file>>");
    process.exit(1);
  }
} catch (err: any) {
  console.error(`[cli] Error: ${err.message}`);
  process.exit(1);
}
