// lib/db.js
// Using Supabase as a free and easy-to-setup database solution
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (you'll need to replace these with your own values from Supabase)
// The values below are placeholders and won't work without setting up a Supabase account
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

/*
To set up Supabase:
1. Create a free account at supabase.com
2. Create a new project
3. In the SQL editor, run this SQL to create the participants table:

CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

4. Create an .env.local file in your project root with:
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

5. Install Supabase: npm install @supabase/supabase-js
*/