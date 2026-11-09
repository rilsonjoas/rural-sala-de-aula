-- RNF02: hash SHA-256 do arquivo no momento do envio. Arquivos anteriores ficam sem hash (NULL).
ALTER TABLE arquivo ADD COLUMN hash_sha256 VARCHAR(64);
