import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase.js';

const DRIVER_IMAGES_BUCKET = 'driver_images';
const DRIVER_IMAGES_FOLDER = '2026';
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60;
const REFRESH_SIGNED_URLS_AFTER_MS = 50 * 60 * 1000;
const RETRY_IMAGE_LOAD_AFTER_MS = 60 * 1000;
const EMPTY_IMAGE_MAP = Object.freeze({});

let cachedImageMap = null;
let cacheExpiresAt = 0;
let imageMapRequest = null;

function normalizeImageKey(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function getDriverImageKey(driverName) {
  const words = String(driverName ?? '').trim().split(/\s+/).filter(Boolean);
  return normalizeImageKey(words.at(-1) ?? '');
}

export function getDriverImageKeyFromFileName(fileName) {
  const suffix = String(fileName ?? '').split('_').at(-1) ?? '';
  const match = suffix.match(/^2026(.+)\.[^.]+$/i);
  return match ? normalizeImageKey(match[1]) : '';
}

async function requestDriverImageMap() {
  const storage = supabase.storage.from(DRIVER_IMAGES_BUCKET);
  const { data: files, error: listError } = await storage.list(DRIVER_IMAGES_FOLDER, {
    limit: 1000,
  });

  if (listError) throw listError;

  const imageFiles = (files ?? [])
    .map((file) => ({
      name: file.name,
      path: `${DRIVER_IMAGES_FOLDER}/${file.name}`,
      key: getDriverImageKeyFromFileName(file.name),
    }))
    .filter((file) => file.key);

  if (!imageFiles.length) return {};

  const paths = imageFiles.map((file) => file.path);
  const { data: signedUrls, error: signingError } = await storage.createSignedUrls(
    paths,
    SIGNED_URL_EXPIRES_IN_SECONDS
  );

  if (signingError) throw signingError;

  const signedUrlByPath = new Map();
  (signedUrls ?? []).forEach((signedUrl) => {
    if (!signedUrl?.signedUrl) return;
    const path = String(signedUrl.path ?? '');
    signedUrlByPath.set(path, signedUrl.signedUrl);
    signedUrlByPath.set(path.replace(/^2026\//, ''), signedUrl.signedUrl);
  });

  return imageFiles.reduce((imageMap, file, index) => {
    const signedUrl =
      signedUrlByPath.get(file.path) ??
      signedUrlByPath.get(file.name) ??
      signedUrls?.[index]?.signedUrl;

    if (signedUrl) imageMap[file.key] = signedUrl;
    return imageMap;
  }, {});
}

export function get2026DriverImageMap(forceRefresh = false) {
  if (!forceRefresh && cachedImageMap && Date.now() < cacheExpiresAt) {
    return Promise.resolve(cachedImageMap);
  }

  if (imageMapRequest) return imageMapRequest;

  imageMapRequest = requestDriverImageMap()
    .then((imageMap) => {
      cachedImageMap = imageMap;
      cacheExpiresAt = Date.now() + REFRESH_SIGNED_URLS_AFTER_MS;
      return imageMap;
    })
    .catch((error) => {
      console.error('Error al cargar las imágenes 2026 desde Supabase:', error);
      throw error;
    })
    .finally(() => {
      imageMapRequest = null;
    });

  return imageMapRequest;
}

export function useDriverImageMap(year = 2026) {
  const numericYear = Number(year);
  const [imageState, setImageState] = useState({
    year: numericYear,
    imageMap: EMPTY_IMAGE_MAP,
  });

  useEffect(() => {
    if (numericYear !== 2026) return undefined;

    let isActive = true;
    let refreshTimer;

    const loadImages = async (forceRefresh = false) => {
      let nextRefreshDelay = RETRY_IMAGE_LOAD_AFTER_MS;

      try {
        const images = await get2026DriverImageMap(forceRefresh);
        if (isActive) {
          setImageState({ year: numericYear, imageMap: images });
          nextRefreshDelay = Math.max(0, cacheExpiresAt - Date.now());
        }
      } catch {
        // Keep using the component fallback and retry after a short delay.
      }

      if (isActive) {
        refreshTimer = setTimeout(() => loadImages(true), nextRefreshDelay);
      }
    };

    void loadImages();

    return () => {
      isActive = false;
      clearTimeout(refreshTimer);
    };
  }, [numericYear]);
  return numericYear === 2026 && imageState.year === numericYear
    ? imageState.imageMap
    : EMPTY_IMAGE_MAP;
}
