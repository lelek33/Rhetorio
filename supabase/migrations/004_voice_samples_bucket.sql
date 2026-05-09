-- Public storage bucket for cached voice samples (one MP3 per voice id).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('voice-samples', 'voice-samples', true, 1048576, array['audio/mpeg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read voice samples" on storage.objects;

create policy "Public read voice samples"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'voice-samples');
