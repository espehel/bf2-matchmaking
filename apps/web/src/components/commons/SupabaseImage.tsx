'use client';
import Image, { ImageProps } from 'next/image';

type Props = Omit<ImageProps, 'loader'>;

export function SupabaseImage(props: Props) {
  return (
    <Image
      {...props}
      loader={({ src, width, quality }) =>
        `${
          process.env.NEXT_PUBLIC_SUPABASE_URL
        }/storage/v1/object/public/${src}?width=${width}&quality=${quality || 75}`
      }
    />
  );
}
