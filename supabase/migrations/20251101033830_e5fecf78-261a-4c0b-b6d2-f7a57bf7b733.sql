-- Make chat-media bucket public for easy media sharing
UPDATE storage.buckets 
SET public = true 
WHERE id = 'chat-media';