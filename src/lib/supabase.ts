import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://cdrssupabase.duckdns.org";
const SUPABASE_PUBLISHABLE_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1ODgyMDQ0MCwiZXhwIjo0OTE0NDk0MDQwLCJyb2xlIjoiYW5vbiJ9.EnrPpw-qGE5Dshonlqc8z9Lht6Zi6BIfOWB9TDdPA5o";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

/**
 * Uploads a file to a specified Supabase storage bucket.
 * @param bucketName The name of the storage bucket.
 * @param file The File object to upload.
 * @param filePath The desired path within the bucket (e.g., 'avatars/user1.png').
 * @returns The public URL of the uploaded file.
 */
export const uploadFileToSupabase = async (bucketName: string, file: File, filePath: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false, // Set to true if you want to overwrite existing files
    });

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  if (!publicUrlData || !publicUrlData.publicUrl) {
     throw new Error("Failed to get public URL after upload.");
  }

  return publicUrlData.publicUrl;
};

/**
 * Deletes a file from a specified Supabase storage bucket using its path.
 * @param bucketName The name of the storage bucket.
 * @param filePath The path of the file within the bucket.
 */
export const deleteFileFromSupabase = async (bucketName: string, filePath: string): Promise<void> => {
  // Supabase storage paths in the DB are often the full URL.
  // We need to extract the path relative to the bucket.
  // Example URL: https://[project_ref].supabase.co/storage/v1/object/public/[bucketName]/[filePath]
  const urlParts = filePath.split(`/${bucketName}/`);
  if (urlParts.length < 2) {
    console.warn("Could not extract file path from URL for deletion:", filePath);
    return; // Cannot delete if path is invalid
  }
  const relativePath = urlParts[1];

  const { error } = await supabase.storage
    .from(bucketName)
    .remove([relativePath]);

  if (error) {
    console.error("Supabase deletion error:", error);
    // Depending on requirements, you might want to throw an error or just log
    // throw new Error(`Failed to delete file: ${error.message}`);
  }
};
