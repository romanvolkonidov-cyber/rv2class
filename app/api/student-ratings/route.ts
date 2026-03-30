import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    
    // Build the Cloud Function URL
    let url = 'https://getstudentratings-35666ugduq-uc.a.run.app';
    if (studentId) {
      url += `?studentId=${studentId}`;
    }
    
    console.log('🔄 Proxying request to Cloud Function:', url);
    
    // Fetch from the Cloud Function
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Cloud Function error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch ratings', details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('✅ Cloud Function returned data successfully');
    
    // Return the data with CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('❌ Error in proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
