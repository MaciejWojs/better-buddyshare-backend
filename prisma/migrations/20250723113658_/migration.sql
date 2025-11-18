-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "email" CITEXT NOT NULL,
    "username" CITEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatar" TEXT NOT NULL DEFAULT '',
    "profile_banner" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT 'Default description',
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "ban_reason" TEXT,
    "ban_expires_at" TIMESTAMP(3),
    "stream_token" TEXT DEFAULT '',

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "roles" (
    "role_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "streamer_id" INTEGER,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "permission_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "streams" (
    "stream_id" SERIAL NOT NULL,
    "streamer_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled Stream',
    "description" TEXT NOT NULL DEFAULT 'No description provided',
    "thumbnail" TEXT NOT NULL DEFAULT '',
    "is_live" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "path" TEXT,

    CONSTRAINT "streams_pkey" PRIMARY KEY ("stream_id")
);

-- CreateTable
CREATE TABLE "subscribers" (
    "subscription_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "streamer_id" INTEGER NOT NULL,
    "subscribed_since" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("subscription_id")
);

-- CreateTable
CREATE TABLE "banned_users_per_streamer" (
    "ban_id" SERIAL NOT NULL,
    "streamer_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'Unknown reason',
    "banned_by" INTEGER NOT NULL,
    "banned_since" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "banned_until" TIMESTAMP(3),
    "is_permanent" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "banned_users_per_streamer_pkey" PRIMARY KEY ("ban_id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "token_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "session_id" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "replaced_by_id" TEXT,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("token_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "session_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_info" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "message_id" SERIAL NOT NULL,
    "stream_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "stream_statistics_types" (
    "stream_statistic_type_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "stream_statistics_types_pkey" PRIMARY KEY ("stream_statistic_type_id")
);

-- CreateTable
CREATE TABLE "stream_statistics_in_time" (
    "statistic_in_time_id" SERIAL NOT NULL,
    "stream_id" INTEGER NOT NULL,
    "stream_statistic_type_id" INTEGER NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "timepoint" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stream_statistics_in_time_pkey" PRIMARY KEY ("statistic_in_time_id")
);

-- CreateTable
CREATE TABLE "chat_message_edit_histories" (
    "edit_id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "old_content" TEXT NOT NULL,
    "edited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_message_edit_histories_pkey" PRIMARY KEY ("edit_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_user_id_key" ON "users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_streamer_id_key" ON "user_roles"("user_id", "role_id", "streamer_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "streams_streamer_id_idx" ON "streams"("streamer_id");

-- CreateIndex
CREATE INDEX "streams_is_live_started_at_idx" ON "streams"("is_live", "started_at");

-- CreateIndex
CREATE INDEX "subscribers_user_id_idx" ON "subscribers"("user_id");

-- CreateIndex
CREATE INDEX "subscribers_streamer_id_idx" ON "subscribers"("streamer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_user_id_streamer_id_key" ON "subscribers"("user_id", "streamer_id");

-- CreateIndex
CREATE INDEX "banned_users_per_streamer_banned_by_idx" ON "banned_users_per_streamer"("banned_by");

-- CreateIndex
CREATE INDEX "banned_users_per_streamer_banned_until_idx" ON "banned_users_per_streamer"("banned_until");

-- CreateIndex
CREATE UNIQUE INDEX "banned_users_per_streamer_streamer_id_user_id_key" ON "banned_users_per_streamer"("streamer_id", "user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_session_id_idx" ON "refresh_tokens"("session_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_issued_at_idx" ON "refresh_tokens"("issued_at");

-- CreateIndex
CREATE INDEX "sessions_user_id_is_active_idx" ON "sessions"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "chat_messages_stream_id_sent_at_idx" ON "chat_messages"("stream_id", "sent_at");

-- CreateIndex
CREATE INDEX "chat_messages_user_id_idx" ON "chat_messages"("user_id");

-- CreateIndex
CREATE INDEX "chat_messages_is_deleted_idx" ON "chat_messages"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "stream_statistics_types_name_key" ON "stream_statistics_types"("name");

-- CreateIndex
CREATE INDEX "stream_statistics_in_time_stream_id_timepoint_idx" ON "stream_statistics_in_time"("stream_id", "timepoint");

-- CreateIndex
CREATE INDEX "stream_statistics_in_time_stream_statistic_type_id_idx" ON "stream_statistics_in_time"("stream_statistic_type_id");

-- CreateIndex
CREATE INDEX "chat_message_edit_histories_message_id_idx" ON "chat_message_edit_histories"("message_id");

-- CreateIndex
CREATE INDEX "chat_message_edit_histories_edited_at_idx" ON "chat_message_edit_histories"("edited_at");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_streamer_id_fkey" FOREIGN KEY ("streamer_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("permission_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streams" ADD CONSTRAINT "streams_streamer_id_fkey" FOREIGN KEY ("streamer_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_streamer_id_fkey" FOREIGN KEY ("streamer_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banned_users_per_streamer" ADD CONSTRAINT "banned_users_per_streamer_streamer_id_fkey" FOREIGN KEY ("streamer_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banned_users_per_streamer" ADD CONSTRAINT "banned_users_per_streamer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banned_users_per_streamer" ADD CONSTRAINT "banned_users_per_streamer_banned_by_fkey" FOREIGN KEY ("banned_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_replaced_by_id_fkey" FOREIGN KEY ("replaced_by_id") REFERENCES "refresh_tokens"("token_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "streams"("stream_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stream_statistics_in_time" ADD CONSTRAINT "stream_statistics_in_time_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "streams"("stream_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stream_statistics_in_time" ADD CONSTRAINT "stream_statistics_in_time_stream_statistic_type_id_fkey" FOREIGN KEY ("stream_statistic_type_id") REFERENCES "stream_statistics_types"("stream_statistic_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message_edit_histories" ADD CONSTRAINT "chat_message_edit_histories_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("message_id") ON DELETE RESTRICT ON UPDATE CASCADE;
