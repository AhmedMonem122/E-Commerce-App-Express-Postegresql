import { supabase } from "../config/supabase.js";

export const getSupabasePathFromUrl = (
  url: string,
  bucket: string,
): string | null => {
  try {
    const parsedUrl = new URL(url);

    const marker = `/storage/v1/object/public/${bucket}/`;

    const index = parsedUrl.pathname.indexOf(marker);

    if (index === -1) {
      return null;
    }

    return decodeURIComponent(parsedUrl.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
};

export const deleteSupabaseFiles = async (urls: string[], bucket: string) => {
  const paths = urls
    .filter(Boolean)
    .map((url) => getSupabasePathFromUrl(url, bucket))
    .filter((path): path is string => Boolean(path));

  if (!paths.length) {
    return;
  }

  const { error } = await supabase.storage.from(bucket).remove(paths);

  if (error) {
    throw error;
  }
};
