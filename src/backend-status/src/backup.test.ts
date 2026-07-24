import { test } from "node:test";
import assert from "node:assert/strict";
import { validateBackupFilename, selectForPruning, runRestore } from "./backup";

test("validateBackupFilename accepts a well-formed name", () => {
  assert.equal(
    validateBackupFilename("chessguard_20260724_030000.sql.gz"),
    "chessguard_20260724_030000.sql.gz",
  );
});

test("validateBackupFilename strips directory components to the basename", () => {
  assert.equal(
    validateBackupFilename("/backups/chessguard_20260724_030000.sql.gz"),
    "chessguard_20260724_030000.sql.gz",
  );
});

test("validateBackupFilename rejects path traversal", () => {
  assert.throws(() => validateBackupFilename("../etc/passwd"));
  assert.throws(() => validateBackupFilename("chessguard_20260724_030000.sql.gz/../x"));
});

test("validateBackupFilename rejects wrong patterns", () => {
  assert.throws(() => validateBackupFilename("chessguard.sql.gz"));
  assert.throws(() => validateBackupFilename("dump_20260724_030000.sql.gz"));
  assert.throws(() => validateBackupFilename("chessguard_20260724_030000.sql"));
});

test("selectForPruning returns the oldest files beyond the limit", () => {
  const files = [
    "chessguard_20260101_030000.sql.gz",
    "chessguard_20260102_030000.sql.gz",
    "chessguard_20260103_030000.sql.gz",
    "backup-status.json",
  ];
  assert.deepEqual(selectForPruning(files, 2), [
    "chessguard_20260101_030000.sql.gz",
  ]);
});

test("selectForPruning returns nothing when under the limit", () => {
  assert.deepEqual(
    selectForPruning(["chessguard_20260101_030000.sql.gz"], 7),
    [],
  );
});

test("runRestore rejects a traversal filename before any DB action", () => {
  assert.throws(() => runRestore("../../etc/passwd"), /Invalid backup filename/);
});
