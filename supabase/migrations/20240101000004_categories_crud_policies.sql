-- Categories CRUD policies for authenticated users
-- Note: categories table has no user ownership; these policies allow all authenticated users to manage categories.

-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow inserts by authenticated users
CREATE POLICY "Categories are insertable by authenticated users" ON categories
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Allow updates by authenticated users
CREATE POLICY "Categories are updatable by authenticated users" ON categories
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow deletes by authenticated users
CREATE POLICY "Categories are deletable by authenticated users" ON categories
    FOR DELETE TO authenticated
    USING (true);
