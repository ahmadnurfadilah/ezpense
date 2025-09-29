import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Only JPG, PNG, and PDF files are allowed.'
      }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'File too large. Maximum size is 10MB.'
      }, { status: 400 });
    }

    // Generate unique file path
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload file to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('receipt-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({
        error: 'Failed to upload file'
      }, { status: 500 });
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('receipt-images')
      .getPublicUrl(filePath);

    // Create receipt record in database
    const { data: receiptData, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: filePath,
        processing_status: 'uploading'
      })
      .select()
      .single();

    if (receiptError) {
      console.error('Receipt creation error:', receiptError);
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from('receipt-images')
        .remove([filePath]);

      return NextResponse.json({
        error: 'Failed to create receipt record'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        receiptId: receiptData.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        publicUrl: urlData.publicUrl,
        storagePath: filePath
      }
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
