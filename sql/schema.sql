CREATE DATABASE IF NOT EXISTS smartsearch;
USE smartsearch;

CREATE TABLE IF NOT EXISTS search_history (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  query_text    VARCHAR(512)    NOT NULL,
  query_hash    CHAR(64)        NOT NULL,
  response_text MEDIUMTEXT      NOT NULL,
  cache_status  ENUM('HIT','MISS') NOT NULL,
  source        VARCHAR(32)     NOT NULL DEFAULT 'GEMINI',
  latency_ms    INT UNSIGNED    NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_query_hash  (query_hash),
  INDEX idx_created_at  (created_at)
);
