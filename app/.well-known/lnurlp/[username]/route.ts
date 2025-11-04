import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const username = params.username;

  // Your Wallet of Satoshi Lightning address username
  // If your WoS address is babd@walletofsatoshi.com, then WOS_USERNAME is "babd"
  const WOS_USERNAME = "babd";

  try {
    // Fetch the LNURL data from Wallet of Satoshi
    const wosResponse = await fetch(
      `https://walletofsatoshi.com/.well-known/lnurlp/${WOS_USERNAME}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!wosResponse.ok) {
      return NextResponse.json(
        { status: 'ERROR', reason: 'Failed to fetch Lightning address data' },
        { status: 500 }
      );
    }

    const wosData = await wosResponse.json();

    // Optionally customize the metadata to show your domain
    // The metadata is a JSON string array
    if (wosData.metadata) {
      try {
        const metadata = JSON.parse(wosData.metadata);
        // Update the text/identifier to show your custom domain
        const updatedMetadata = metadata.map((item: string[]) => {
          if (item[0] === 'text/identifier') {
            return ['text/identifier', `${username}@babd.space`];
          }
          return item;
        });
        wosData.metadata = JSON.stringify(updatedMetadata);
      } catch (e) {
        // If metadata parsing fails, use original
        console.error('Failed to parse metadata:', e);
      }
    }

    // Return the LNURL-pay data
    return NextResponse.json(wosData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Lightning address proxy error:', error);
    return NextResponse.json(
      { status: 'ERROR', reason: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
