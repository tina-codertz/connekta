-- Per-place control for showing markers on the map (separate from notifications).

ALTER TABLE places
ADD COLUMN IF NOT EXISTS visible_on_map BOOLEAN NOT NULL DEFAULT true;
