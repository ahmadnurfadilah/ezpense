-- Create storage bucket for receipt images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'receipt-images',
    'receipt-images',
    false, -- Private bucket for security
    10485760, -- 10MB file size limit
    ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
);

-- Create storage policies for receipt images
-- Users can upload their own receipt images
CREATE POLICY "Users can upload their own receipt images" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'receipt-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can view their own receipt images
CREATE POLICY "Users can view their own receipt images" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'receipt-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can update their own receipt images
CREATE POLICY "Users can update their own receipt images" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'receipt-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
        bucket_id = 'receipt-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own receipt images
CREATE POLICY "Users can delete their own receipt images" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'receipt-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Function to generate secure file path for receipts
CREATE OR REPLACE FUNCTION generate_receipt_path(user_id UUID, file_name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN user_id::text || '/' || extract(epoch from now())::bigint || '_' || file_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get signed URL for receipt image
CREATE OR REPLACE FUNCTION get_receipt_signed_url(file_path TEXT, expires_in INTEGER DEFAULT 3600)
RETURNS TEXT AS $$
DECLARE
    signed_url TEXT;
BEGIN
    -- This function would typically call the Supabase storage API
    -- For now, we'll return the file path - the actual signed URL generation
    -- should be handled in the application layer
    RETURN file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
