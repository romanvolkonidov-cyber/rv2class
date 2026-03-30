import { NextRequest, NextResponse } from 'next/server';

const TUTORS = {
  roman: {
    tutorName: 'Roman',
    roomName: 'roman-room',
    sharePath: '/roman',
  },
  violet: {
    tutorName: 'Violet',
    roomName: 'violet-room',
    sharePath: '/violet',
  },
} as const;

export async function POST(req: NextRequest) {
  try {
    const { tutorName } = await req.json();

    if (!tutorName) {
      return NextResponse.json(
        { error: 'Tutor name is required' },
        { status: 400 }
      );
    }

  const key = (tutorName as string).trim().toLowerCase() as keyof typeof TUTORS;
    const config = TUTORS[key];

    if (!config) {
      return NextResponse.json(
        { error: 'Tutor not recognized' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      tutorName: config.tutorName,
      roomName: config.roomName,
      sharePath: config.sharePath,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const slug = searchParams.get('tutor');

  const key = (slug || code)?.trim().toLowerCase() as keyof typeof TUTORS | undefined;
    const config = key ? TUTORS[key] : undefined;

    if (!config) {
      return NextResponse.json(
        { error: 'Tutor not found', found: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      tutorName: config.tutorName,
      roomName: config.roomName,
      sharePath: config.sharePath,
      found: true,
    });
  } catch (error) {
    console.error('Error finding session:', error);
    return NextResponse.json(
      { error: 'Failed to find session' },
      { status: 500 }
    );
  }
}
