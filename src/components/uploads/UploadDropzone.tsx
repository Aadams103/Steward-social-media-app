/**
 * UploadDropzone - Reusable drag-and-drop file upload component
 * Supports drag-and-drop, file picker, validation, and multiple states
 */

import React from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface UploadedItem {
  file: File;
  preview?: string;
  status?: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface UploadDropzoneProps {
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Accepted file types (e.g., "image/*,video/*") */
  accept?: string | Record<string, string[]>;
  /** Maximum number of files */
  maxFiles?: number;
  /** Maximum file size in MB */
  maxSizeMB?: number;
  /** Existing uploaded items to display */
  value?: UploadedItem[];
  /** Callback when files are selected */
  onFilesSelected: (files: File[]) => void;
  /** Callback when a file is removed (by index) */
  onFileRemove?: (index: number) => void;
  /** Title text */
  title?: string;
  /** Helper text below title */
  helperText?: string;
  /** Show file type hints */
  showFileTypes?: boolean;
  /** Custom className */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Is uploading state */
  isUploading?: boolean;
}

export function UploadDropzone({
  multiple = false,
  accept,
  maxFiles,
  maxSizeMB = 10,
  value = [],
  onFilesSelected,
  onFileRemove,
  title,
  helperText,
  showFileTypes = true,
  className,
  disabled = false,
  isUploading = false,
}: UploadDropzoneProps) {
  const [errors, setErrors] = React.useState<string[]>([]);

  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setErrors([]);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const errorMessages: string[] = [];
        rejectedFiles.forEach(({ file, errors: fileErrors }) => {
          fileErrors.forEach((error: any) => {
            if (error.code === 'file-too-large') {
              errorMessages.push(`${file.name}: File size exceeds ${maxSizeMB}MB`);
            } else if (error.code === 'file-invalid-type') {
              errorMessages.push(`${file.name}: Invalid file type`);
            } else if (error.code === 'too-many-files') {
              errorMessages.push(`Too many files. Maximum: ${maxFiles || 1}`);
            } else {
              errorMessages.push(`${file.name}: ${error.message}`);
            }
          });
        });
        setErrors(errorMessages);
      }

      // Handle accepted files
      if (acceptedFiles.length > 0) {
        // Check max files if multiple
        if (multiple && maxFiles && acceptedFiles.length > maxFiles) {
          setErrors([`Maximum ${maxFiles} files allowed. Selected: ${acceptedFiles.length}`]);
          return;
        }

        // Check total files including existing
        if (multiple && maxFiles && value.length + acceptedFiles.length > maxFiles) {
          setErrors([`Maximum ${maxFiles} files allowed. You already have ${value.length} file(s).`]);
          return;
        }

        onFilesSelected(acceptedFiles);
      }
    },
    [multiple, maxFiles, maxSizeMB, value.length, onFilesSelected],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: accept ? (typeof accept === 'string' ? accept.split(',').reduce((acc, type) => {
      acc[type.trim()] = [];
      return acc;
    }, {} as Record<string, string[]>) : accept) : undefined,
    multiple,
    maxSize: maxSizeMB * 1024 * 1024,
    maxFiles: multiple ? maxFiles : 1,
    disabled: disabled || isUploading,
    noClick: false,
    noKeyboard: false,
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Generate file type hint text
  const getFileTypesHint = () => {
    if (!showFileTypes || !accept) return null;
    
    if (typeof accept === 'string') {
      const types = accept.split(',').map(t => t.trim());
      if (types.includes('image/*')) return 'PNG, JPG, GIF, WEBP';
      if (types.includes('video/*')) return 'MP4, MOV, WEBM';
      if (types.includes('image/*') && types.includes('video/*')) return 'Images & Videos';
      return types.join(', ');
    }
    
    // Handle object format
    const allTypes = Object.keys(accept).flatMap(key => accept[key]);
    if (allTypes.includes('image/*')) return 'PNG, JPG, GIF, WEBP';
    if (allTypes.includes('video/*')) return 'MP4, MOV, WEBM';
    return 'Various file types';
  };

  const fileTypesHint = getFileTypesHint();
  const hasFiles = value.length > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 transition-colors',
          'cursor-pointer hover:border-primary/50',
          isDragActive && !isDragReject && 'border-primary bg-primary/5',
          isDragReject && 'border-destructive bg-destructive/5',
          disabled && 'opacity-50 cursor-not-allowed',
          isUploading && 'opacity-50 cursor-wait',
        )}
      >
        <input
          {...getInputProps()}
          ref={fileInputRef}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          {isUploading ? (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div>
                <p className="text-sm font-medium">Uploading...</p>
                <p className="text-xs text-muted-foreground mt-1">Please wait</p>
              </div>
            </>
          ) : isDragActive ? (
            <>
              <Upload className="h-12 w-12 text-primary" />
              <div>
                <p className="text-sm font-medium">Drop to upload</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-2">
                {title && (
                  <p className="text-sm font-medium">{title}</p>
                )}
                {!title && (
                  <p className="text-sm font-medium">Drag & drop files here</p>
                )}
                {helperText && (
                  <p className="text-xs text-muted-foreground">{helperText}</p>
                )}
                {!helperText && (
                  <p className="text-xs text-muted-foreground">or</p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleButtonClick();
                }}
                disabled={disabled}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              {fileTypesHint && (
                <p className="text-xs text-muted-foreground">
                  Supported: {fileTypesHint}
                </p>
              )}
              {maxSizeMB && (
                <p className="text-xs text-muted-foreground">
                  Max size: {maxSizeMB}MB {multiple && maxFiles ? `• Max files: ${maxFiles}` : ''}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, idx) => (
                <li key={idx} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* File Previews */}
      {hasFiles && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Selected Files ({value.length}{maxFiles ? ` / ${maxFiles}` : ''})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {value.map((item, idx) => (
              <div
                key={idx}
                className="relative group border rounded-lg overflow-hidden bg-muted"
              >
                {/* Preview */}
                {item.preview ? (
                  <div className="aspect-square">
                    {item.file.type.startsWith('image/') ? (
                      <img
                        src={item.preview}
                        alt={item.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square flex items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                {/* Status Overlay */}
                {item.status && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    {item.status === 'uploading' && (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    )}
                    {item.status === 'success' && (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    )}
                    {item.status === 'error' && (
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    )}
                  </div>
                )}

                {/* File Info */}
                <div className="p-2">
                  <p className="text-xs font-medium truncate" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {item.error && (
                    <p className="text-xs text-destructive mt-1">{item.error}</p>
                  )}
                </div>

                {/* Remove Button (if not disabled) */}
                {!disabled && !isUploading && onFileRemove && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileRemove(idx);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
