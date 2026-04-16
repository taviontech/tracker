import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  const backendInternal = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:8080';
  const internalUrl = url.replace(/^https?:\/\/[^/]+/, backendInternal);

  try {
    const res = await fetch(internalUrl);
    if (!res.ok) return NextResponse.json({ error: 'File not found' }, { status: res.status });

    const contentType = res.headers.get('content-type') ?? 'application/octet-stream';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 502 });
  }
}
