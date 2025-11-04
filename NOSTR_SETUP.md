# Nostr NIP-05 Setup Guide

## What is NIP-05?

NIP-05 is a verification protocol that links your domain name to your Nostr public key (npub), similar to Twitter's blue checkmark. It makes you easier to find and verifies you control the domain.

## Setup Steps

### 1. Convert your npub to hex format

Your Nostr public key (npub) needs to be converted to hex format.

**Option A: Use online converter**
- Visit: https://nostrcheck.me/converter/
- Paste your `npub1...` key
- Copy the hex output

**Option B: Use nostr tools**
```bash
npm install -g nostr-tools
# Then use the CLI or JavaScript to convert
```

### 2. Configure your environment

1. Copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your hex pubkey:
   ```
   NEXT_PUBLIC_NOSTR_HEX_PUBKEY=your_hex_pubkey_here
   NEXT_PUBLIC_DOMAIN=yourdomain.com
   ```

### 3. Update the route handler

Edit `app/.well-known/nostr.json/route.ts` and replace `your_hex_pubkey_here` with your actual hex pubkey.

You can also add custom names:
```typescript
names: {
  "_": YOUR_HEX_PUBKEY,        // _@yourdomain.com
  "satoshi": YOUR_HEX_PUBKEY,  // satoshi@yourdomain.com
  "bitcoin": YOUR_HEX_PUBKEY,  // bitcoin@yourdomain.com
}
```

### 4. Build the app

```bash
npm run build
```

### 5. Run with PM2

**First time setup:**
```bash
# Install PM2 globally if you haven't
npm install -g pm2

# Start the app
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

**Common PM2 commands:**
```bash
pm2 list                    # Show all running apps
pm2 logs babd-timechain-explorer  # View logs
pm2 restart babd-timechain-explorer  # Restart app
pm2 stop babd-timechain-explorer    # Stop app
pm2 delete babd-timechain-explorer  # Remove from PM2
pm2 monit                   # Monitor CPU/Memory
```

### 6. Configure your domain

Make sure your domain points to your server:

**DNS Setup:**
- Add an A record pointing `yourdomain.com` to your server IP
- Or add a CNAME if using a subdomain

**Nginx/Reverse Proxy (if needed):**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Ensure .well-known is accessible
    location /.well-known {
        proxy_pass http://localhost:3000/.well-known;
    }
}
```

### 7. Test your NIP-05

**Local test:**
```bash
curl http://localhost:3000/.well-known/nostr.json
```

**Domain test:**
```bash
curl https://yourdomain.com/.well-known/nostr.json
```

**Verify in Nostr clients:**
1. Open your Nostr client (Primal, Damus, Amethyst, etc.)
2. Go to your profile settings
3. Add NIP-05 identifier: `_@yourdomain.com` or `yourname@yourdomain.com`
4. Wait a few moments for verification

### 8. Update your Nostr profile

In your Nostr client, set your NIP-05 identifier to:
- `_@yourdomain.com` (if using the default "_" name)
- `yourname@yourdomain.com` (if you added a custom name)

## Troubleshooting

**Verification not working?**
1. Check if the endpoint is accessible: `curl https://yourdomain.com/.well-known/nostr.json`
2. Verify CORS headers are present
3. Ensure your hex pubkey is correct
4. Clear cache and try again
5. Check that your domain DNS is properly configured

**PM2 issues?**
```bash
pm2 logs babd-timechain-explorer --lines 100  # Check recent logs
pm2 restart babd-timechain-explorer          # Restart the app
```

**Port already in use?**
Edit `ecosystem.config.js` and change the PORT in the env section.

## Additional Relays

You can add more relays to your configuration in `app/.well-known/nostr.json/route.ts`:

```typescript
relays: {
  [YOUR_HEX_PUBKEY]: [
    "wss://relay.primal.net",
    "wss://relay.damus.io",
    "wss://nostr.wine",
    "wss://relay.nostr.band",
    "wss://nos.lol",
    "wss://relay.snort.social"
  ]
}
```

## Security Notes

- Keep your `.env.local` file private (it's in .gitignore by default)
- Your public key (hex) is safe to share - it's public information
- Never share your private key (nsec)
- Use HTTPS in production for security

## Resources

- [NIP-05 Specification](https://github.com/nostr-protocol/nips/blob/master/05.md)
- [Nostr Tools](https://github.com/nbd-wtf/nostr-tools)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
