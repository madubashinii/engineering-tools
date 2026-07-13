-- ============================================================================
-- Migration 000006: Add newly tracked repositories
-- ============================================================================
-- asset_prefixes values are verified against each repo's actual GitHub release
-- asset names (full release history — both repos are young, so all releases
-- were checked), not guessed. Note BOTH use an UNDERSCORE separator, unlike
-- the hyphenated wso2 product prefixes:
--   - wso2/agent-manager:     amctl_v0.18.0_darwin_amd64.tar.gz  -> "amctl_"
--   - openchoreo/openchoreo:  occ_v1.1.2_darwin_amd64.tar.gz     -> "occ_"
-- Both prefixes correctly exclude checksums.txt. Caveat: "occ_" also matches
-- the occ_*.sigstore.json signature files (prefix matching can't exclude by
-- suffix) — same accepted limitation as wso2is- matching its checksum files.
-- matchesPrefix() in main.bal does an exact startsWith() match with no
-- fallback, so a wrong prefix silently records 0 downloads forever.
-- Idempotent: safe to re-run thanks to ON DUPLICATE KEY UPDATE.
-- ============================================================================

USE `github_statistics`;

INSERT INTO `tracked_repositories` (`org_name`, `repo_name`, `product_name`, `asset_prefixes`)
VALUES
    ('wso2', 'agent-manager', 'Agent Manager', '["amctl_"]'),
    ('openchoreo', 'openchoreo', 'OpenChoreo', '["occ_"]')
ON DUPLICATE KEY UPDATE
    product_name = VALUES(product_name),
    asset_prefixes = VALUES(asset_prefixes);
