-- Add order_index to resources table for sorting
ALTER TABLE resources
ADD COLUMN order_index BIGINT DEFAULT EXTRACT(EPOCH FROM NOW());