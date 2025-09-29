'use client';

import { useState, useCallback } from 'react';
import { Card } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { ProgressBar } from '@progress/kendo-react-progressbars';
import { Notification } from '@progress/kendo-react-notification';
import { Badge } from '@progress/kendo-react-indicators';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  receiptId?: string;
  publicUrl?: string;
  extractedData?: {
    store: string;
    date: string;
    items: Array<{ name: string; quantity: number; price: number; total: number }>;
    subtotal: number;
    discount: number | null;
    tax: number | null;
    total: number;
  };
  expenseId?: string;
}

export function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([]);

  const addNotification = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const uploadAndProcessFile = useCallback(async (fileId: string, file: File) => {
    try {
      // Step 1: Upload file to Supabase
      setUploadedFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, status: 'uploading', progress: 25 } : f
      ));

      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();

      setUploadedFiles(prev => prev.map(f =>
        f.id === fileId
          ? {
              ...f,
              status: 'processing',
              progress: 50,
              receiptId: uploadData.data.receiptId,
              publicUrl: uploadData.data.publicUrl
            }
          : f
      ));

      // Step 2: Process with AI
      const processResponse = await fetch('/api/process-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptId: uploadData.data.receiptId,
          imageUrl: uploadData.data.publicUrl,
        }),
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.error || 'AI processing failed');
      }

      const processData = await processResponse.json();

      // Step 3: Update with results
      setUploadedFiles(prev => prev.map(f =>
        f.id === fileId
          ? {
              ...f,
              status: 'completed',
              progress: 100,
              extractedData: processData.data.extractedData,
              expenseId: processData.data.expense.id
            }
          : f
      ));

      addNotification('success', 'Receipt processed successfully!');

    } catch (error) {
      console.error('Upload/processing error:', error);

      setUploadedFiles(prev => prev.map(f =>
        f.id === fileId
          ? {
              ...f,
              status: 'error',
              progress: 0
            }
          : f
      ));

      addNotification('error', error instanceof Error ? error.message : 'Failed to process receipt');
    }
  }, [addNotification]);

  const handleFiles = useCallback((files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      return validTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      addNotification('error', 'Some files were skipped. Only JPG, PNG, and PDF files are supported.');
    }

    validFiles.forEach(file => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';

      const uploadedFile: UploadedFile = {
        id,
        file,
        preview,
        status: 'uploading',
        progress: 0,
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);

      // Upload file to Supabase and process with AI
      uploadAndProcessFile(id, file);
    });
  }, [addNotification, uploadAndProcessFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const processAllCompleted = () => {
    const completedFiles = uploadedFiles.filter(file => file.status === 'completed');
    if (completedFiles.length > 0) {
      addNotification('success', `${completedFiles.length} receipts ready for review!`);
      // Navigate to the review page
      window.location.href = '/review';
    }
  };

  const reviewReceipt = (file: UploadedFile) => {
    if (file.extractedData && file.expenseId) {
      // Navigate to the review page
      window.location.href = '/review';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Receipts</h1>
        <p className="text-gray-600 mt-1">Upload your receipts for AI-powered expense extraction</p>
      </div>

      {/* Upload Area */}
      <Card className="p-8">
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
            isDragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <div className="space-y-4">
            <div className="text-6xl">📤</div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Drag & drop your receipts here
              </h3>
              <p className="text-gray-600 mt-2">
                or click to browse files
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <Button
                themeColor="primary"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Choose Files
              </Button>
              <Button
                fillMode="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Take Photo
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Supports JPG, PNG, and PDF files up to 10MB
            </p>
          </div>
        </div>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Uploaded Files ({uploadedFiles.length})
            </h3>
            {uploadedFiles.some(f => f.status === 'completed') && (
              <Button
                themeColor="primary"
                onClick={processAllCompleted}
              >
                Review Completed ({uploadedFiles.filter(f => f.status === 'completed').length})
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="border rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  {/* File Preview */}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt="Receipt preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">📄</span>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 relative">
                      <h4 className="font-medium text-gray-900">{file.file.name}</h4>
                      <Badge
                        themeColor={
                          file.status === 'completed' ? 'success' :
                          file.status === 'error' ? 'error' :
                          file.status === 'processing' ? 'info' : 'warning'
                        }
                        size="small"
                      >
                        {file.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>

                    {/* Progress Bar */}
                    {file.status === 'uploading' || file.status === 'processing' ? (
                      <div className="mt-2">
                        <ProgressBar
                          value={file.progress}
                          max={100}
                          className="h-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {file.status === 'uploading' ? 'Uploading...' : 'Processing with AI...'}
                        </p>
                      </div>
                    ) : file.status === 'completed' && file.extractedData ? (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-green-600 font-medium">
                            ${file.extractedData.total}
                          </span>
                          <span className="text-gray-600">
                            {file.extractedData.store}
                          </span>
                          <span className="text-gray-500">
                            {file.extractedData.date}
                          </span>
                          <span className="text-blue-600">
                            {file.extractedData.items.length} items
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {file.status === 'completed' && (
                      <Button
                        fillMode="outline"
                        size="small"
                        onClick={() => reviewReceipt(file)}
                      >
                        Review
                      </Button>
                    )}
                    <Button
                      fillMode="outline"
                      size="small"
                      onClick={() => removeFile(file.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            closable
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
          >
            {notification.message}
          </Notification>
        ))}
      </div>
    </div>
  );
}
