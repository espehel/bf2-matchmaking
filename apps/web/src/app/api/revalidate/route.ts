import { NextResponse, NextRequest } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.nextUrl);
  const tag = searchParams.get('tag');
  const path = searchParams.get('path');

  if (tag) {
    revalidateTag(tag);
    return NextResponse.json({ message: `Revalidated Tag: ${tag}` });
  }
  if (path) {
    revalidatePath(path);
    return NextResponse.json({ message: `Revalidated Path: ${path}` });
  }
  return NextResponse.json({ message: 'Missing param path/tag' }, { status: 400 });
}
