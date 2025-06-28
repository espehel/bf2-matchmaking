interface LoaderParams {
  src: string;
  width: number;
  quality?: number;
}
export const supabaseImageLoader = ({ src, width, quality }: LoaderParams) => {
  return `${
    process.env.NEXT_PUBLIC_SUPABASE_URL
  }/storage/v1/object/public/${src}?width=${width}&quality=${quality || 75}`;
};
