alter table public.burner_share_links
add column if not exists owner_share_token_ciphertext text;
