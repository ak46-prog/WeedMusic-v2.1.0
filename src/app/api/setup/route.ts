import { NextRequest, NextResponse } from 'next/server';

/**
 * Supabase Database Initialization Endpoint
 * Call this once after deployment to set up all tables.
 * Usage: GET /api/setup?key=weedmusic-setup-2025
 */
export async function GET(request: NextRequest) {
  const setupKey = request.nextUrl.searchParams.get('key');
  const expectedKey = process.env.SETUP_KEY || 'weedmusic-setup-2025';

  if (setupKey !== expectedKey) {
    return NextResponse.json({ error: 'Invalid setup key' }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    return NextResponse.json({ error: 'SUPABASE_URL not configured' }, { status: 500 });
  }

  const projectRef = supabaseUrl.split('//')[1].split('.')[0];
  const results: { step: string; status: string; error?: string }[] = [];

  const schemaSQL = `
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
      email TEXT NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    DO $$ BEGIN
      CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
      CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
      CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO profiles (id, email, display_name, avatar_url)
      VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users FOR EACH ROW
      EXECUTE FUNCTION handle_new_user();
    CREATE TABLE IF NOT EXISTS favorites (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT,
      thumbnail TEXT,
      duration INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, video_id)
    );
    ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
    DO $$ BEGIN
      CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can insert own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
    CREATE TABLE IF NOT EXISTS playlists (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      cover_url TEXT,
      is_public BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
    DO $$ BEGIN
      CREATE POLICY "Users can view own playlists" ON playlists FOR SELECT USING (auth.uid() = user_id OR is_public = true);
      CREATE POLICY "Users can insert own playlists" ON playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update own playlists" ON playlists FOR UPDATE USING (auth.uid() = user_id);
      CREATE POLICY "Users can delete own playlists" ON playlists FOR DELETE USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    CREATE TABLE IF NOT EXISTS playlist_tracks (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE NOT NULL,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT,
      thumbnail TEXT,
      duration INTEGER DEFAULT 0,
      position INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
    DO $$ BEGIN
      CREATE POLICY "Users can view playlist tracks" ON playlist_tracks FOR SELECT USING (
        EXISTS (SELECT 1 FROM playlists WHERE playlists.id = playlist_id AND (playlists.user_id = auth.uid() OR playlists.is_public = true))
      );
      CREATE POLICY "Users can insert playlist tracks" ON playlist_tracks FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM playlists WHERE playlists.id = playlist_id AND playlists.user_id = auth.uid())
      );
      CREATE POLICY "Users can delete playlist tracks" ON playlist_tracks FOR DELETE USING (
        EXISTS (SELECT 1 FROM playlists WHERE playlists.id = playlist_id AND playlists.user_id = auth.uid())
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    CREATE TABLE IF NOT EXISTS history (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT,
      thumbnail TEXT,
      duration INTEGER DEFAULT 0,
      played_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE history ENABLE ROW LEVEL SECURITY;
    DO $$ BEGIN
      CREATE POLICY "Users can view own history" ON history FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can insert own history" ON history FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can delete own history" ON history FOR DELETE USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id);
    CREATE INDEX IF NOT EXISTS idx_history_played ON history(played_at DESC);
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
      theme TEXT DEFAULT 'system',
      quality TEXT DEFAULT 'auto',
      auto_play BOOLEAN DEFAULT true,
      child_mode BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
    DO $$ BEGIN
      CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;

  // Approach: Use Supabase REST API with service role key to execute SQL via rpc
  // We need to first create an RPC function, but since tables don't exist, we use direct PG
  const postgresUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (postgresUrl && !postgresUrl.includes('placeholder') && !postgresUrl.includes('file:')) {
    try {
      const pg = await import('pg');
      const client = new pg.Client({
        connectionString: postgresUrl,
        ssl: postgresUrl.includes('supabase') ? {
          rejectUnauthorized: false,
        } : undefined,
      });
      await client.connect();
      await client.query(schemaSQL);
      await client.end();
      results.push({ step: 'direct_pg', status: 'success' });
    } catch (err: any) {
      results.push({ step: 'direct_pg', status: 'error', error: err.message?.substring(0, 300) });
      
      // Try with NODE_TLS_REJECT_UNAUTHORIZED workaround for serverless
      try {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        const pg2 = await import('pg');
        const client2 = new pg2.Client({
          connectionString: postgresUrl,
          ssl: { rejectUnauthorized: false },
        });
        await client2.connect();
        await client2.query(schemaSQL);
        await client2.end();
        results.push({ step: 'direct_pg_no_ssl_verify', status: 'success' });
      } catch (err2: any) {
        results.push({ step: 'direct_pg_no_ssl_verify', status: 'error', error: err2.message?.substring(0, 300) });
      }
    }
  } else {
    results.push({ step: 'direct_pg', status: 'skipped', error: 'No valid PostgreSQL URL' });
  }

  // Verify tables
  try {
    const apiKey = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*&limit=0`, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    if (verifyResponse.ok) {
      results.push({ step: 'verify', status: 'success' });
    } else {
      results.push({ step: 'verify', status: 'not_found' });
    }
  } catch (err: any) {
    results.push({ step: 'verify', status: 'error', error: err.message });
  }

  const anySuccess = results.some(r => r.status === 'success');
  return NextResponse.json({
    success: anySuccess,
    message: anySuccess
      ? 'Database schema initialized successfully!'
      : 'Automatic setup failed. Please run schema.sql manually in Supabase Dashboard > SQL Editor.',
    results,
    tables: ['profiles', 'favorites', 'playlists', 'playlist_tracks', 'history', 'user_settings'],
    supabase_dashboard: `https://supabase.com/dashboard/project/${projectRef}/sql`,
    project_ref: projectRef,
    manual_steps: [
      `1. Open https://supabase.com/dashboard/project/${projectRef}/sql`,
      '2. Click "New Query"',
      '3. Copy & paste the contents of supabase/schema.sql',
      '4. Click "Run" to execute',
      '5. Tables will be created with RLS policies',
    ],
  });
}
