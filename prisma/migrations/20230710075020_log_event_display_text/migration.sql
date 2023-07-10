-- CreateTable
CREATE TABLE "LogEvents" (
    "event_type" TEXT NOT NULL PRIMARY KEY,
    "event_display_text" TEXT NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Log" (
    "log_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT,
    "display_name" TEXT,
    "ip_address" TEXT NOT NULL,
    "file_id" TEXT,
    "event_type" TEXT NOT NULL,
    "event_path" TEXT,
    "event_old" TEXT,
    "event_new" TEXT,
    "event_data" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Log_username_fkey" FOREIGN KEY ("username") REFERENCES "User" ("username") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Log_event_type_fkey" FOREIGN KEY ("event_type") REFERENCES "LogEvents" ("event_type") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Log" ("created_at", "display_name", "event_data", "event_new", "event_old", "event_path", "event_type", "file_id", "ip_address", "log_id", "username") SELECT "created_at", "display_name", "event_data", "event_new", "event_old", "event_path", "event_type", "file_id", "ip_address", "log_id", "username" FROM "Log";
DROP TABLE "Log";
ALTER TABLE "new_Log" RENAME TO "Log";
CREATE UNIQUE INDEX "Log_log_id_key" ON "Log"("log_id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
