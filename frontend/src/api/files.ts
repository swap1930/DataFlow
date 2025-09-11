import { getCurrentUserToken } from '../firebase/auth';
import { API_BASE_URL } from './config';

export interface ProcessedFile {
  file_id: string;
  file_name: string;
  description: string;
  created_at: string;
  number_of_relations: number;
  require_dashboard: boolean;
  remove_fields: string;
}

export interface RecentFile {
  file_name: string;
  description: string;
  created_at: string;
  file_id: string;
}

// Get all files for the logged-in user (alias for getUserProcessedFiles for backward compatibility)
export const getAllFiles = async (): Promise<RecentFile[]> => {
  try {
    const token = await getCurrentUserToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    console.log('🔍 Fetching all files for user...');
    console.log('🔑 Token:', token.substring(0, 20) + '...');

    const response = await fetch(`${API_BASE_URL}/user-files`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 API Response data:', data);
    console.log('📁 All files found:', data.files?.length || 0);
    
    // Convert ProcessedFile to RecentFile format for backward compatibility
    const files = data.files || [];
    return files.map((file: any) => ({
      file_id: file.file_id,
      file_name: file.file_name,
      description: file.description,
      created_at: file.created_at
    }));
  } catch (error) {
    console.error('❌ Error fetching all files:', error);
    return [];
  }
};

// Get all processed files for the logged-in user
export const getUserProcessedFiles = async (): Promise<ProcessedFile[]> => {
  try {
    const token = await getCurrentUserToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    console.log('🔍 Fetching processed files for user...');
    console.log('🔑 Token:', token.substring(0, 20) + '...');

    const response = await fetch(`${API_BASE_URL}/user-files`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 API Response data:', data);
    console.log('📁 Files found:', data.files?.length || 0);
    
    return data.files || [];
  } catch (error) {
    console.error('❌ Error fetching user files:', error);
    return [];
  }
};

// Get recent files for the logged-in user (last 7 days)
export const getRecentFiles = async (): Promise<RecentFile[]> => {
  try {
    const token = await getCurrentUserToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    console.log('🔍 Fetching recent files for user...');
    console.log('🔑 Token:', token.substring(0, 20) + '...');

    const response = await fetch(`${API_BASE_URL}/user-recent-files`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 API Response data:', data);
    console.log('📁 Recent files found:', data.recent_files?.length || 0);
    
    return data.recent_files || [];
  } catch (error) {
    console.error('❌ Error fetching recent files:', error);
    return [];
  }
};

// Download a processed file
export const downloadProcessedFile = async (fileId: string): Promise<void> => {
  try {
    const token = await getCurrentUserToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/download-processed-file/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Create a blob from the response
    const blob = await response.blob();
    
    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileId;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

// Delete a file from database
export const deleteProcessedFile = async (fileId: string): Promise<boolean> => {
  try {
    const token = await getCurrentUserToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/delete-file/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Backward compatibility: export old function names for existing components
export const downloadFile = downloadProcessedFile;
export const deleteFile = deleteProcessedFile;
