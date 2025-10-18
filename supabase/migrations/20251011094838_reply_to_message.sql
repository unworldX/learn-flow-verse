ALTER TABLE "public"."direct_messages" ADD COLUMN "reply_to_message_id" UUID;
ALTER TABLE "public"."group_messages" ADD COLUMN "reply_to_message_id" UUID;

ALTER TABLE "public"."direct_messages" ADD CONSTRAINT "direct_messages_reply_to_message_id_fkey" FOREIGN KEY (reply_to_message_id) REFERENCES direct_messages(id) ON DELETE SET NULL;
ALTER TABLE "public"."group_messages" ADD CONSTRAINT "group_messages_reply_to_message_id_fkey" FOREIGN KEY (reply_to_message_id) REFERENCES group_messages(id) ON DELETE SET NULL;
