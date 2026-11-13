CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  openid VARCHAR(128) NOT NULL UNIQUE,
  nickname VARCHAR(64) DEFAULT '旅行搭子',
  avatar_url VARCHAR(512) DEFAULT '',
  interest_tags_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bean_accounts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  balance INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bean_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  delta INT NOT NULL,
  reason VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bean_logs ADD COLUMN IF NOT EXISTS claim_id BIGINT NULL;
ALTER TABLE bean_logs ADD COLUMN IF NOT EXISTS metadata_json JSONB NULL;
ALTER TABLE bean_logs ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128) NULL;

CREATE TABLE IF NOT EXISTS mood_profiles (
  user_id BIGINT PRIMARY KEY,
  answers_json JSONB NOT NULL,
  mood_tags_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(128) NOT NULL,
  subtitle VARCHAR(255) NOT NULL,
  detail_json JSONB NOT NULL,
  source_type VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spots (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  lat DECIMAL(10, 6) NOT NULL,
  lng DECIMAL(10, 6) NOT NULL,
  detail_json JSONB NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checkins (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  spot_id BIGINT NOT NULL,
  distance_meter INT NOT NULL,
  photos_json JSONB NOT NULL,
  dry_tags_json JSONB NOT NULL,
  content VARCHAR(500) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  spot_id BIGINT NOT NULL,
  rating INT NOT NULL,
  content VARCHAR(500) NOT NULL,
  images_json JSONB NULL,
  tags_json JSONB NULL,
  mood_tags_json JSONB NULL,
  like_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ADD COLUMN IF NOT EXISTS tags_json JSONB NULL;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS mood_tags_json JSONB NULL;

CREATE TABLE IF NOT EXISTS spot_favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  spot_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, spot_id)
);

CREATE TABLE IF NOT EXISTS share_records (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  share_type VARCHAR(32) NOT NULL,
  target_id BIGINT NOT NULL,
  share_code VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE share_records ADD COLUMN IF NOT EXISTS metadata_json JSONB NULL;
ALTER TABLE share_records ADD COLUMN IF NOT EXISTS checkin_id BIGINT NULL;

CREATE TABLE IF NOT EXISTS bean_reward_claims (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  reward_type VARCHAR(32) NOT NULL,
  target_type VARCHAR(32) NOT NULL DEFAULT 'global',
  target_id BIGINT NOT NULL DEFAULT 0,
  reward_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes VARCHAR(255) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, reward_type, target_type, target_id, reward_date)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_bean_accounts_balance_range'
  ) THEN
    ALTER TABLE bean_accounts
      ADD CONSTRAINT chk_bean_accounts_balance_range CHECK (balance BETWEEN 0 AND 200) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_comments_rating_range'
  ) THEN
    ALTER TABLE comments
      ADD CONSTRAINT chk_comments_rating_range CHECK (rating BETWEEN 1 AND 5) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_comments_like_count_non_negative'
  ) THEN
    ALTER TABLE comments
      ADD CONSTRAINT chk_comments_like_count_non_negative CHECK (like_count >= 0) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_spots_lat_lng_range'
  ) THEN
    ALTER TABLE spots
      ADD CONSTRAINT chk_spots_lat_lng_range CHECK (lat BETWEEN -90 AND 90 AND lng BETWEEN -180 AND 180) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_checkins_distance_meter_non_negative'
  ) THEN
    ALTER TABLE checkins
      ADD CONSTRAINT chk_checkins_distance_meter_non_negative CHECK (distance_meter >= 0) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_routes_source_type_allowed'
  ) THEN
    ALTER TABLE routes
      ADD CONSTRAINT chk_routes_source_type_allowed CHECK (source_type IN ('generate', 'import', 'adopt')) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_share_records_share_type_allowed'
  ) THEN
    ALTER TABLE share_records
      ADD CONSTRAINT chk_share_records_share_type_allowed CHECK (share_type IN ('route', 'spot')) NOT VALID;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS comment_likes (
  id BIGSERIAL PRIMARY KEY,
  comment_id BIGINT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  recipient_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  notification_type VARCHAR(64) NOT NULL,
  title VARCHAR(128) NOT NULL,
  content VARCHAR(500) NOT NULL DEFAULT '',
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS route_generation_runs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  route_id BIGINT NULL REFERENCES routes(id) ON DELETE SET NULL,
  source_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  request_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_json JSONB NULL,
  error_message VARCHAR(500) DEFAULT '',
  idempotency_key VARCHAR(128) NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (source_type IN ('generate', 'import', 'adopt')),
  CHECK (status IN ('pending', 'running', 'succeeded', 'failed', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS route_stops (
  id BIGSERIAL PRIMARY KEY,
  route_id BIGINT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  spot_id BIGINT NULL REFERENCES spots(id) ON DELETE SET NULL,
  stop_order INT NOT NULL,
  title VARCHAR(128) NOT NULL,
  lat DECIMAL(10, 6) NULL,
  lng DECIMAL(10, 6) NULL,
  detail_json JSONB NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (route_id, stop_order),
  CHECK (stop_order >= 0),
  CHECK ((lat IS NULL OR lat BETWEEN -90 AND 90) AND (lng IS NULL OR lng BETWEEN -180 AND 180))
);

CREATE TABLE IF NOT EXISTS route_legs (
  id BIGSERIAL PRIMARY KEY,
  route_id BIGINT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  from_stop_id BIGINT NULL REFERENCES route_stops(id) ON DELETE SET NULL,
  to_stop_id BIGINT NULL REFERENCES route_stops(id) ON DELETE SET NULL,
  leg_order INT NOT NULL,
  distance_meter INT NULL,
  duration_min INT NULL,
  transport_mode VARCHAR(32) DEFAULT '',
  detail_json JSONB NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (route_id, leg_order),
  CHECK (leg_order >= 0),
  CHECK (distance_meter IS NULL OR distance_meter >= 0),
  CHECK (duration_min IS NULL OR duration_min >= 0)
);

CREATE TABLE IF NOT EXISTS official_content_imports (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(64) NOT NULL,
  external_id VARCHAR(128) NOT NULL,
  content_type VARCHAR(64) NOT NULL,
  title VARCHAR(128) NOT NULL DEFAULT '',
  source_url VARCHAR(512) DEFAULT '',
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (provider, external_id, content_type)
);

CREATE TABLE IF NOT EXISTS spot_provider_refs (
  id BIGSERIAL PRIMARY KEY,
  spot_id BIGINT NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  provider VARCHAR(64) NOT NULL,
  external_id VARCHAR(128) NOT NULL,
  source_url VARCHAR(512) DEFAULT '',
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (provider, external_id),
  UNIQUE (spot_id, provider)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_bean_logs_claim_id'
  ) THEN
    ALTER TABLE bean_logs
      ADD CONSTRAINT fk_bean_logs_claim_id FOREIGN KEY (claim_id) REFERENCES bean_reward_claims(id) ON DELETE SET NULL NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_share_records_checkin_id'
  ) THEN
    ALTER TABLE share_records
      ADD CONSTRAINT fk_share_records_checkin_id FOREIGN KEY (checkin_id) REFERENCES checkins(id) ON DELETE SET NULL NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_routes_user_created_at ON routes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bean_logs_user_created_at ON bean_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_user_created_at ON checkins(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_spot_like_created_at ON comments(spot_id, like_count DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read_created_at ON notifications(recipient_user_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_route_stops_route_stop_order ON route_stops(route_id, stop_order);
CREATE INDEX IF NOT EXISTS idx_route_legs_route_leg_order ON route_legs(route_id, leg_order);

CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bean_accounts_updated_at ON bean_accounts;
CREATE TRIGGER trg_bean_accounts_updated_at
BEFORE UPDATE ON bean_accounts
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_mood_profiles_updated_at ON mood_profiles;
CREATE TRIGGER trg_mood_profiles_updated_at
BEFORE UPDATE ON mood_profiles
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_route_generation_runs_updated_at ON route_generation_runs;
CREATE TRIGGER trg_route_generation_runs_updated_at
BEFORE UPDATE ON route_generation_runs
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_spot_provider_refs_updated_at ON spot_provider_refs;
CREATE TRIGGER trg_spot_provider_refs_updated_at
BEFORE UPDATE ON spot_provider_refs
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();
