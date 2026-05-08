-- Allow user_documents created from images (extracted via OCR).

alter table public.user_documents
  drop constraint if exists user_documents_source_type_check;

alter table public.user_documents
  add constraint user_documents_source_type_check
  check (source_type in ('paste', 'txt', 'md', 'pdf', 'image'));
