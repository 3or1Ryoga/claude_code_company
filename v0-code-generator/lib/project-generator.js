import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateNextProject(options) {
  const {
    name,
    type,
    features = [],
    outputDir = path.join(__dirname, '..', 'generated_projects')
  } = options;

  // Create output directory if it doesn't exist
  await fs.mkdir(outputDir, { recursive: true });

  // Generate unique project folder name with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const projectDirName = `${name}-${timestamp}`;
  const projectPath = path.join(outputDir, projectDirName);

  try {
    // Create Next.js project using create-next-app
    console.log(`Creating Next.js project: ${projectDirName}`);
    execSync(
      `npx create-next-app@latest ${projectDirName} --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"`,
      {
        cwd: outputDir,
        stdio: 'inherit'
      }
    );

    // Add type-specific configurations
    await addTypeSpecificFeatures(projectPath, type, features);

    // Add Supabase integration if requested
    if (features.includes('supabase')) {
      await addSupabaseIntegration(projectPath);
    }

    // Add authentication if requested
    if (features.includes('auth')) {
      await addAuthentication(projectPath);
    }

    // Add database schema if needed
    if (features.includes('database')) {
      await addDatabaseSchema(projectPath);
    }

    console.log(`Project generated successfully at: ${projectPath}`);
    return projectPath;
  } catch (error) {
    console.error(`Error generating project: ${error.message}`);
    throw error;
  }
}

async function addTypeSpecificFeatures(projectPath, type, features) {
  const appDir = path.join(projectPath, 'app');
  
  switch (type) {
    case 'portfolio':
      await createPortfolioTemplate(appDir);
      break;
    case 'ecommerce':
      await createEcommerceTemplate(appDir);
      break;
    case 'blog':
      await createBlogTemplate(appDir);
      break;
    case 'dashboard':
      await createDashboardTemplate(appDir);
      break;
    case 'landing-page':
      await createLandingPageTemplate(appDir);
      break;
    default:
      console.log('Using default Next.js template');
  }
}

async function createPortfolioTemplate(appDir) {
  const pageContent = `export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <section className="container mx-auto px-6 py-20">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Welcome to My Portfolio
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Showcasing my work and experience
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Projects</h3>
            <p className="text-gray-600">View my latest work</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Skills</h3>
            <p className="text-gray-600">Technologies I work with</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Contact</h3>
            <p className="text-gray-600">Get in touch</p>
          </div>
        </div>
      </section>
    </main>
  );
}`;

  await fs.writeFile(path.join(appDir, 'page.tsx'), pageContent);
}

async function createEcommerceTemplate(appDir) {
  const pageContent = `export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">E-Commerce Store</h1>
        </div>
      </header>
      
      <section className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">Product {i}</h3>
                <p className="text-gray-600 mb-2">Product description</p>
                <p className="text-xl font-bold">$99.99</p>
                <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}`;

  await fs.writeFile(path.join(appDir, 'page.tsx'), pageContent);
}

async function createBlogTemplate(appDir) {
  const pageContent = `export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-gray-900">My Blog</h1>
          <p className="text-gray-600 mt-2">Thoughts and writings</p>
        </div>
      </header>
      
      <section className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {[1, 2, 3].map(i => (
            <article key={i} className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Blog Post Title {i}
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                Published on {new Date().toLocaleDateString()}
              </p>
              <p className="text-gray-700 mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
              <a href="#" className="text-blue-600 hover:underline">
                Read more →
              </a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}`;

  await fs.writeFile(path.join(appDir, 'page.tsx'), pageContent);
}

async function createDashboardTemplate(appDir) {
  const pageContent = `export default function Home() {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <nav className="mt-6">
          <a href="#" className="block px-6 py-3 hover:bg-gray-800">Overview</a>
          <a href="#" className="block px-6 py-3 hover:bg-gray-800">Analytics</a>
          <a href="#" className="block px-6 py-3 hover:bg-gray-800">Reports</a>
          <a href="#" className="block px-6 py-3 hover:bg-gray-800">Settings</a>
        </nav>
      </aside>
      
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {['Users', 'Revenue', 'Orders', 'Growth'].map(metric => (
            <div key={metric} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm mb-2">{metric}</h3>
              <p className="text-3xl font-bold text-gray-900">1,234</p>
              <p className="text-green-600 text-sm mt-2">+12.5%</p>
            </div>
          ))}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-700">Activity item {i}</span>
                <span className="text-gray-500 text-sm">2 hours ago</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}`;

  await fs.writeFile(path.join(appDir, 'page.tsx'), pageContent);
}

async function createLandingPageTemplate(appDir) {
  const pageContent = `export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">
              Build Something Amazing
            </h1>
            <p className="text-xl mb-8 opacity-90">
              The perfect starting point for your next project. 
              Fast, modern, and ready to scale.
            </p>
            <div className="flex gap-4">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
                Get Started
              </button>
              <button className="border border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {['Fast', 'Secure', 'Scalable'].map(feature => (
              <div key={feature} className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold mb-2">{feature}</h3>
                <p className="text-gray-600">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}`;

  await fs.writeFile(path.join(appDir, 'page.tsx'), pageContent);
}

async function addSupabaseIntegration(projectPath) {
  // Install Supabase
  execSync('npm install @supabase/supabase-js @supabase/auth-helpers-nextjs', {
    cwd: projectPath,
    stdio: 'inherit'
  });

  // Create Supabase client
  const supabaseClientContent = `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)`;

  await fs.mkdir(path.join(projectPath, 'lib'), { recursive: true });
  await fs.writeFile(path.join(projectPath, 'lib', 'supabase.ts'), supabaseClientContent);

  // Add environment variables template
  const envContent = `# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`;

  await fs.writeFile(path.join(projectPath, '.env.local.example'), envContent);
}

async function addAuthentication(projectPath) {
  // Create auth context
  const authContextContent = `'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}`;

  await fs.mkdir(path.join(projectPath, 'contexts'), { recursive: true });
  await fs.writeFile(path.join(projectPath, 'contexts', 'auth.tsx'), authContextContent);
}

async function addDatabaseSchema(projectPath) {
  // Create database schema SQL
  const schemaContent = `-- Example database schema for Supabase

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`;

  await fs.mkdir(path.join(projectPath, 'supabase'), { recursive: true });
  await fs.writeFile(path.join(projectPath, 'supabase', 'schema.sql'), schemaContent);
}

export default {
  generateNextProject
};