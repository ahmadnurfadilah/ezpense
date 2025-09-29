-- Enable Row Level Security on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Categories policies (read-only for all authenticated users, including anonymous)
CREATE POLICY "Categories are viewable by all authenticated users" ON categories
    FOR SELECT TO authenticated
    USING (true);

-- Expenses policies
CREATE POLICY "Users can view their own expenses" ON expenses
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses" ON expenses
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" ON expenses
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" ON expenses
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Receipts policies
CREATE POLICY "Users can view their own receipts" ON receipts
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own receipts" ON receipts
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipts" ON receipts
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipts" ON receipts
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Function to check if user is anonymous
CREATE OR REPLACE FUNCTION is_anonymous_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create user preferences for anonymous users
CREATE OR REPLACE FUNCTION get_or_create_user_preferences()
RETURNS user_preferences AS $$
DECLARE
    user_prefs user_preferences;
BEGIN
    -- Try to get existing preferences
    SELECT * INTO user_prefs FROM user_preferences WHERE user_id = auth.uid();

    -- If no preferences exist, create default ones
    IF user_prefs IS NULL THEN
        INSERT INTO user_preferences (user_id) VALUES (auth.uid())
        RETURNING * INTO user_prefs;
    END IF;

    RETURN user_prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's expense summary
CREATE OR REPLACE FUNCTION get_user_expense_summary()
RETURNS TABLE (
    total_expenses DECIMAL(10,2),
    total_budget DECIMAL(10,2),
    pending_count INTEGER,
    confirmed_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(e.amount), 0) as total_expenses,
        COALESCE(SUM(c.budget), 0) as total_budget,
        COUNT(CASE WHEN e.status = 'pending' THEN 1 END)::INTEGER as pending_count,
        COUNT(CASE WHEN e.status = 'confirmed' THEN 1 END)::INTEGER as confirmed_count
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
