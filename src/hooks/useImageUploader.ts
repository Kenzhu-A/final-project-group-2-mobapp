// [UPLOAD-PROGRESS] manages per-image upload state for Create/Edit forms
import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';

export type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';

export interface UploadItem {
  uri: string;
  status: UploadStatus;
  progress: number; // 0-100
  url?: string;     // public URL after upload
  error?: string;
}

const MAX_IMAGES = 5; // [DASHBOARD-REDESIGN] spec max

export function useImageUploader(initialUrls: string[] = []) {
  const [items, setItems] = useState<UploadItem[]>(
    initialUrls.map((u) => ({ uri: u, status: 'done' as UploadStatus, progress: 100, url: u }))
  );

  const updateItem = useCallback((uri: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.uri === uri ? { ...it, ...patch } : it)));
  }, []);

  const uploadOne = useCallback(async (uri: string) => {
    updateItem(uri, { status: 'uploading', progress: 0, error: undefined });
    try {
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : `image`;
      const formData = new FormData();
      formData.append('pet_image', { uri, name: filename, type } as any);
      const url = await api.uploadPetImage(formData, (percent) =>
        updateItem(uri, { progress: percent })
      );
      updateItem(uri, { status: 'done', progress: 100, url });
    } catch (e: any) {
      updateItem(uri, { status: 'error', error: e.message || 'Upload failed' });
    }
  }, [updateItem]);

  const pick = useCallback(async () => {
    const remainingSlots = MAX_IMAGES - items.length;
    if (remainingSlots <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.8,
    });
    if (result.canceled) return;
    const newItems: UploadItem[] = result.assets.map((a) => ({
      uri: a.uri,
      status: 'pending' as UploadStatus,
      progress: 0,
    }));
    setItems((prev) => [...prev, ...newItems]);
    // sequential upload — simpler progress UX on flaky mobile networks
    for (const it of newItems) {
      await uploadOne(it.uri); // eslint-disable-line no-await-in-loop
    }
  }, [items.length, uploadOne]);

  const remove = useCallback((uri: string) => {
    setItems((prev) => prev.filter((it) => it.uri !== uri));
  }, []);

  const retry = useCallback((uri: string) => uploadOne(uri), [uploadOne]);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const allUploaded = items.length > 0 && items.every((it) => it.status === 'done');
  const anyUploading = items.some((it) => it.status === 'uploading' || it.status === 'pending');
  const urls = items.filter((it) => it.status === 'done' && it.url).map((it) => it.url!);

  return { items, pick, remove, retry, clear, allUploaded, anyUploading, urls, MAX_IMAGES };
}
