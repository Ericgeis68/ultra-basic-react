import { supabase } from "@/integrations/supabase/client";
import { Document } from '@/types/document';
import { junctionTableManager, groupBasedQueries } from "./junction-tables";

export const getDocumentsForEquipment = async (equipmentId: string): Promise<Document[]> => {
  console.log(`Fetching documents for equipment: ${equipmentId}`);

  try {
    // Get equipment groups using our transitional function
    const groupIds = await junctionTableManager.getGroupsForEquipment(equipmentId);
    console.log(`Equipment ${equipmentId} belongs to groups:`, groupIds);

    // Use the transitional group-based query helper to get documents linked directly or via groups
    const documents = await groupBasedQueries.getDocumentsForEquipmentAndGroups(equipmentId, groupIds);

    console.log(`Found ${documents.length} documents for equipment ${equipmentId}`);
    return documents;
  } catch (error) {
    console.error("Error in getDocumentsForEquipment:", error);
    throw error;
  }
};

// Keep backward compatibility
export const fetchDocumentsForEquipment = getDocumentsForEquipment;

/**
 * Deletes documents linked to a specific equipment.
 * Only deletes documents that are directly linked to this equipment (not group documents).
 */
export async function deleteDocumentsByEquipmentId(equipmentId: string): Promise<void> {
  console.log(`Attempting to delete documents linked to equipment ID: ${equipmentId}`);

  try {
    // Use the correct column name 'equipment_ids' (array) instead of 'equipment_id'
    const { error } = await supabase
      .from('documents')
      .delete()
      .contains('equipment_ids', [equipmentId]);

    if (error) {
      console.error(`Error deleting documents for equipment ${equipmentId}:`, error);
      throw error;
    }

    console.log(`Documents for equipment ${equipmentId} deleted successfully.`);
  } catch (err) {
    console.error(`Exception deleting documents for equipment ${equipmentId}:`, err);
    throw err;
  }
}

/**
 * Upload a document with a file and create its record.
 */
export async function uploadDocumentWithFile(
  documentData: Omit<Document, 'id' | 'createdat' | 'updatedat' | 'fileurl' | 'filename' | 'size' | 'filetype' | 'tags'> & {
    description?: string | null;
    equipment_ids?: string[] | null;
    category: 'manual' | 'maintenance' | 'warranty' | 'certification' | 'procedure' | 'other';
  }, // Exclude file-related fields and group_ids as they come from the file/join table
  file: File,
  groupIds: string[] // Pass groupIds separately for join table
): Promise<{ success: boolean; error?: string; document?: Document }> {
  try {
    console.log('[uploadDocumentWithFile] Starting upload process...');

    // Upload file to storage
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = `documents/${fileName}`; // Ensure 'documents' bucket is used

    console.log('[uploadDocumentWithFile] Uploading file to storage:', filePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents') // Use 'documents' bucket
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('[uploadDocumentWithFile] Storage upload error:', uploadError);
      return { success: false, error: `Erreur lors du téléchargement du fichier: ${uploadError.message}` };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('documents') // Use 'documents' bucket
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      console.error('[uploadDocumentWithFile] Could not get public URL');
      // Clean up uploaded file if URL cannot be retrieved
      await supabase.storage.from('documents').remove([filePath]);
      return { success: false, error: 'Impossible d\'obtenir l\'URL publique du fichier' };
    }

    // Create document record in 'documents' table
    const documentToInsert = {
      title: documentData.title,
      description: documentData.description,
      equipment_ids: documentData.equipment_ids,
      category: documentData.category,
      fileurl: publicUrlData.publicUrl,
      filename: file.name,
      size: file.size,
      filetype: file.type.split('/')[1] || 'other', // Add filetype
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
    };

    console.log('[uploadDocumentWithFile] Creating document record:', documentToInsert);

    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert([documentToInsert])
      .select()
      .single();

    if (docError) {
      console.error('[uploadDocumentWithFile] Document creation error:', docError);
      // Clean up uploaded file
      await supabase.storage.from('documents').remove([filePath]);
      return { success: false, error: `Erreur lors de la création du document: ${docError.message}` };
    }

    // Update document_group_members table
    if (docData && groupIds && groupIds.length > 0) {
      await junctionTableManager.updateDocumentGroupMembers(docData.id, groupIds);
      console.log(`[uploadDocumentWithFile] Document ${docData.id} associated with groups:`, groupIds);
    }

    console.log('[uploadDocumentWithFile] Document created successfully:', docData);
    return { success: true, document: docData };

  } catch (error: any) {
    console.error('[uploadDocumentWithFile] Unexpected error:', error);
    return { success: false, error: `Erreur inattendue: ${error.message}` };
  }
}

/**
 * Updates the file associated with an existing document.
 * Deletes the old file and uploads the new one, then updates the document record.
 */
export async function updateDocumentFile(
  documentId: string,
  oldFileUrl: string | null, // The current public URL of the file
  newFile: File
): Promise<{ success: boolean; newFileUrl?: string; error?: string }> {
  try {
    console.log(`[updateDocumentFile] Starting file update for document ID: ${documentId}`);

    // 1. Delete old file from storage if oldFileUrl is provided
    if (oldFileUrl) {
      // Extract the path within the bucket from the public URL
      const pathSegments = oldFileUrl.split('/public/documents/');
      if (pathSegments.length > 1) {
        const oldStoragePath = `documents/${pathSegments[1]}`; // Reconstruct path relative to bucket root
        console.log(`[updateDocumentFile] Attempting to delete old file: ${oldStoragePath}`);
        const { error: deleteError } = await supabase.storage.from('documents').remove([oldStoragePath]);
        if (deleteError) {
          console.warn(`[updateDocumentFile] Warning: Could not delete old file ${oldStoragePath}:`, deleteError.message);
        }
      } else {
        console.warn(`[updateDocumentFile] Could not parse old file URL for deletion: ${oldFileUrl}`);
      }
    }

    // 2. Upload new file to storage
    const fileExtension = newFile.name.split('.').pop();
    const fileName = `${documentId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = `documents/${fileName}`; // Store in 'documents' bucket

    console.log(`[updateDocumentFile] Uploading new file: ${filePath}`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents') // Use 'documents' bucket
      .upload(filePath, newFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('[updateDocumentFile] Storage upload error:', uploadError);
      return { success: false, error: `Erreur lors du téléchargement du nouveau fichier: ${uploadError.message}` };
    }

    // 3. Get public URL for the new file
    const { data: publicUrlData } = supabase.storage
      .from('documents') // Use 'documents' bucket
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      console.error('[updateDocumentFile] Could not get public URL for new file');
      await supabase.storage.from('documents').remove([filePath]);
      return { success: false, error: 'Impossible d\'obtenir l\'URL publique du nouveau fichier' };
    }

    // 4. Update the document record with the new file details
    const { error: docUpdateError } = await supabase
      .from('documents')
      .update({
        fileurl: publicUrlData.publicUrl,
        filename: newFile.name,
        size: newFile.size,
        filetype: newFile.type.split('/')[1] || 'other', // Update filetype
        updatedat: new Date().toISOString()
      })
      .eq('id', documentId);

    if (docUpdateError) {
      console.error('[updateDocumentFile] Document record update error:', docUpdateError);
      await supabase.storage.from('documents').remove([filePath]);
      return { success: false, error: `Erreur lors de la mise à jour du document avec le nouveau fichier: ${docUpdateError.message}` };
    }

    console.log(`[updateDocumentFile] File updated successfully for document ${documentId}. New URL: ${publicUrlData.publicUrl}`);
    return { success: true, newFileUrl: publicUrlData.publicUrl };

  } catch (error: any) {
    console.error('[updateDocumentFile] Unexpected error:', error);
    return { success: false, error: `Erreur inattendue lors de la mise à jour du fichier: ${error.message}` };
  }
}
