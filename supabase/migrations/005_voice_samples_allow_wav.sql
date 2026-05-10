-- Allow WAV files in the voice-samples bucket since the Gemini-powered
-- voice-sample Edge Function uploads PCM-wrapped-as-WAV instead of MP3.

update storage.buckets
set allowed_mime_types = array['audio/mpeg', 'audio/wav']
where id = 'voice-samples';
