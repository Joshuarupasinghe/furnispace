-- Supabase Database Schema for Products and Categories
-- Run this in your Supabase SQL Editor

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DECIMAL NOT NULL,
  dimensions JSONB NOT NULL,
  colors TEXT[] DEFAULT '{}',
  image_url TEXT,
  image_urls TEXT[] DEFAULT '{}',
  model_url TEXT,
  obj_url TEXT,
  mtl_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on category for faster queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your needs)
-- Allow public read access to active products
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (status = 'active');

-- Allow authenticated users to manage products (for admin)
CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  USING (auth.role() = 'authenticated');

-- Allow public read access to categories
CREATE POLICY "Public can view categories"
  ON categories FOR SELECT
  USING (true);

-- Allow authenticated users to manage categories (for admin)
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create textures table for floor and wall textures
CREATE TABLE IF NOT EXISTS textures (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('floor', 'wall')),
  category TEXT,
  file_url TEXT NOT NULL,
  preview_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on texture type for faster queries
CREATE INDEX IF NOT EXISTS idx_textures_type ON textures(type);

-- Enable Row Level Security (RLS)
ALTER TABLE textures ENABLE ROW LEVEL SECURITY;

-- Allow public read access to textures
CREATE POLICY "Public can view textures"
  ON textures FOR SELECT
  USING (true);

-- Allow authenticated users to manage textures (for admin)
CREATE POLICY "Admins can manage textures"
  ON textures FOR ALL
  USING (auth.role() = 'authenticated');

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_textures_updated_at
  BEFORE UPDATE ON textures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create designs table for admin studio saved projects
CREATE TABLE IF NOT EXISTS designs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  design_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for sorting/filtering saved projects
CREATE INDEX IF NOT EXISTS idx_designs_updated_at ON designs(updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage designs (for admin)
CREATE POLICY "Admins can manage designs"
  ON designs FOR ALL
  USING (auth.role() = 'authenticated');

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_designs_updated_at
  BEFORE UPDATE ON designs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
