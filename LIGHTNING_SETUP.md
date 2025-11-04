# Lightning Address Setup Guide

## What is a Lightning Address?

A Lightning Address is like an email address for Bitcoin Lightning payments. Instead of sharing long invoices, people can send you sats using a simple address like `you@yourdomain.com`.

## How This Works (No Node Required!)

This setup **proxies/forwards** Lightning payments from your custom domain to your existing Wallet of Satoshi account. You don't need to run your own Lightning node - it's just an HTTP redirect service.

When someone pays `_@babd.space`:
1. Their wallet queries `https://babd.space/.well-known/lnurlp/_`
2. Your server fetches the LNURL data from Wallet of Satoshi
3. Returns it as if it's coming from your domain
4. Payment goes directly to your WoS wallet

## Setup

### 1. Configure Your WoS Username

Edit `app/.well-known/lnurlp/[username]/route.ts` and update:

```typescript
const WOS_USERNAME = "babd";  // Your WoS username from babd@walletofsatoshi.com
```

Or set it in `.env.local`:
```
WOS_USERNAME=babd
```

### 2. Build and Deploy

```bash
npm run build
pm2 restart babd-timechain-explorer
```

### 3. Test Your Lightning Address

**Browser test:**
Visit: `https://babd.space/.well-known/lnurlp/_`

You should see JSON with Lightning payment data.

**Command line test:**
```bash
curl https://babd.space/.well-known/lnurlp/_
```

**Real payment test:**
Use any Lightning wallet that supports Lightning addresses:
- Send a small amount to `_@babd.space`
- Check if it arrives in your Wallet of Satoshi

### 4. Share Your Lightning Address

You can now use these addresses:
- ✅ `_@babd.space` (default/root)
- ✅ `babd@babd.space` (if you want a custom username)
- ✅ Any username: `satoshi@babd.space`, `bitcoin@babd.space`, etc.

**All of these forward to your `babd@walletofsatoshi.com` address!**

## Supported Wallets

Lightning addresses work with most modern Lightning wallets:
- ⚡ Strike
- ⚡ Cash App
- ⚡ Wallet of Satoshi
- ⚡ Muun
- ⚡ Phoenix
- ⚡ Breez
- ⚡ Zeus
- ⚡ Alby
- ⚡ And many more!

## Add to Your Nostr Profile

In Nostr clients like Primal or Damus:
1. Go to Profile Settings
2. Look for "Lightning Address" or "Zap Address"
3. Enter: `_@babd.space`
4. Save

Now when people zap your posts, the sats go to your custom address!

## Customization

### Use Multiple Usernames

The endpoint at `[username]` means it accepts ANY username. All will forward to your WoS address.

For example, all of these work:
- `_@babd.space` → forwards to `babd@walletofsatoshi.com`
- `satoshi@babd.space` → forwards to `babd@walletofsatoshi.com`
- `bitcoin@babd.space` → forwards to `babd@walletofsatoshi.com`

### Switch to a Different Service

Want to use a different Lightning provider instead of Wallet of Satoshi?

Edit `app/.well-known/lnurlp/[username]/route.ts` and change:

```typescript
const wosResponse = await fetch(
  `https://your-provider.com/.well-known/lnurlp/${YOUR_USERNAME}`
);
```

Works with:
- Wallet of Satoshi: `walletofsatoshi.com`
- Strike: `strike.me`
- Alby: `getalby.com`
- LNbits: `your-lnbits-instance.com`
- BTCPay Server: `your-btcpay.com`

## Benefits

✅ **No Lightning node required** - Just a proxy to your existing wallet
✅ **Professional appearance** - Use your own domain
✅ **Easy to remember** - Simpler than traditional Lightning addresses
✅ **Portable** - Switch backend providers without changing your public address
✅ **Works with Nostr zaps** - Integrate with your NIP-05 identity

## Troubleshooting

**Payments not arriving?**
1. Check your WoS username is correct in the route file
2. Test the endpoint: `curl https://babd.space/.well-known/lnurlp/_`
3. Verify your WoS address still works: send to `babd@walletofsatoshi.com` directly
4. Check PM2 logs: `pm2 logs babd-timechain-explorer`

**Endpoint returns error?**
- Make sure your server can make outbound HTTPS requests
- Check that Wallet of Satoshi is accessible: `curl https://walletofsatoshi.com/.well-known/lnurlp/babd`
- Verify CORS headers are present

**Want to test without real payments?**
Use a testnet Lightning wallet or send very small amounts (1 sat) first.

## Security Notes

- This is a **proxy only** - you never handle private keys or Bitcoin
- All payments go directly to your Wallet of Satoshi account
- Your Lightning address just redirects payment requests
- No custody or security risks beyond your existing WoS setup

## Resources

- [Lightning Address Spec](https://github.com/andrerfneves/lightning-address)
- [LNURL Documentation](https://github.com/lnurl/luds)
- [Wallet of Satoshi](https://www.walletofsatoshi.com/)
