-- CreateTable
CREATE TABLE "Log" (
    "log_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT,
    "ip_address" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_log" TEXT NOT NULL,
    "event_path" TEXT,
    "event_old" TEXT,
    "event_new" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Log_username_fkey" FOREIGN KEY ("username") REFERENCES "User" ("username") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Log_log_id_key" ON "Log"("log_id");
