# RhetoCoach MVP

RhetoCoach ist eine mobile Expo React Native App fuer deutschsprachiges KI-Gespraechstraining mit Supabase Auth, Postgres und Edge Functions.

## Setup

1. Dependencies installieren:
   ```bash
   npm install
   ```

2. `.env` anlegen:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Supabase Secrets fuer Edge Functions setzen:
   ```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set OPENAI_MODEL=gpt-4o-mini
supabase secrets set OPENAI_REALTIME_MODEL=gpt-realtime
supabase secrets set OPENAI_REALTIME_VOICE=marin
   ```

4. Migration ausfuehren:
   ```bash
   supabase db push
   ```

5. Edge Functions deployen:
   ```bash
   supabase functions deploy generate-reply
   supabase functions deploy analyze-session
supabase functions deploy create-realtime-session
supabase functions deploy record-voice-usage
   ```

6. App lokal starten:
   ```bash
   npm run start
   ```

## Vercel Deployment

Diese App ist eine Expo React Native App. Vercel kann die Web-Version hosten, nicht die native iOS/Android-App.

1. Repository mit Vercel verbinden.
2. In Vercel unter Project Settings -> Environment Variables setzen:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Build Command:
   ```bash
   npm run build:web
   ```
4. Output Directory:
   ```bash
   dist
   ```

Die Datei `vercel.json` setzt diese Werte bereits fuer das Projekt.

## Realtime Voice im Browser testen

Live Voice ist im MVP zuerst fuer Expo Web / Vercel aktiviert. Der Web-Flow nutzt Browser APIs:

- `navigator.mediaDevices.getUserMedia`
- `RTCPeerConnection`
- `RTCDataChannel`
- `HTMLAudioElement`

Lokal im Browser testen:

```bash
npm run web
```

Dann eine Session starten und im Session-Screen den Voice-Button antippen. Der Browser fragt nach Mikrofonzugriff. Native iOS/Android bleibt vorbereitet, nutzt aber noch keinen produktiven `react-native-webrtc` Flow.

## Supabase verbinden

1. Neues Supabase-Projekt erstellen.
2. `EXPO_PUBLIC_SUPABASE_URL` und `EXPO_PUBLIC_SUPABASE_ANON_KEY` aus Project Settings -> API kopieren.
3. Lokal in `.env` eintragen.
4. Migration ausfuehren:
   ```bash
   supabase db push
   ```
5. Edge Function Secrets setzen:
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-...
   supabase secrets set OPENAI_MODEL=gpt-4o-mini
   supabase secrets set OPENAI_REALTIME_MODEL=gpt-realtime
   supabase secrets set OPENAI_REALTIME_VOICE=marin
   ```
6. Functions deployen:
   ```bash
   supabase functions deploy generate-reply
   supabase functions deploy analyze-session
   supabase functions deploy create-realtime-session
   supabase functions deploy record-voice-usage
   ```

## Supabase Auth Redirects

Damit E-Mail-Bestaetigungslinks zur Vercel-App zurueckfuehren:

1. Supabase Dashboard -> Authentication -> URL Configuration.
2. Site URL setzen:
   ```bash
   https://rhetorio.vercel.app
   ```
3. Redirect URLs hinzufuegen:
   ```bash
   https://rhetorio.vercel.app/**
   ```

## MVP-Fokus

- Textbasiertes KI-Roleplay
- Szenario-Auswahl
- Session- und Message-Speicherung
- Analyse nach Session
- Verlauf
- Supabase Auth
- Dummy Premium Status und Limits
- Realtime Voice vorbereitet, aber bewusst noch Stub
