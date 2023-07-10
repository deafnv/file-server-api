/*
  Warnings:

  - You are about to drop the column `event_log` on the `Log` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Log" (
    "log_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT,
    "ip_address" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_path" TEXT,
    "event_old" TEXT,
    "event_new" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Log_username_fkey" FOREIGN KEY ("username") REFERENCES "User" ("username") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Log" ("created_at", "event_new", "event_old", "event_path", "event_type", "ip_address", "log_id", "username") SELECT "created_at", "event_new", "event_old", "event_path", "event_type", "ip_address", "log_id", "username" FROM "Log";
DROP TABLE "Log";
ALTER TABLE "new_Log" RENAME TO "Log";
CREATE UNIQUE INDEX "Log_log_id_key" ON "Log"("log_id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
