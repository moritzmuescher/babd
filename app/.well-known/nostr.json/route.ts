import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  // npub1d3h6cxpz9y9f20c5rg08hgadjtns4stmyqw75q8spssdp46r635q33wvj0
  const YOUR_HEX_PUBKEY = "6c6fac1822290a953f141a1e7ba3ad92e70ac17b201dea00f00c20d0d743d468";

  // NIP-05 response format
  const response = {
    names: {
      "_": YOUR_HEX_PUBKEY,  // _@yourdomain.com (default)
      // Add more names if needed:
      // "yourname": YOUR_HEX_PUBKEY,  // yourname@yourdomain.com
    },
    relays: {
      [YOUR_HEX_PUBKEY]: [
        "wss://relay.primal.net",
        "wss://relay.damus.io",
        "wss://nostr.wine",
        "wss://relay.nostr.band"
      ]
    }
  };

  return NextResponse.json(response, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    }
  });
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
