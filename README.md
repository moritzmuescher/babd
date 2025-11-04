# babd.space

**https://babd.space**

A Bitcoin blockchain explorer with a 3D space theme. Shows live network stats, block details, and lets you search transactions and addresses.

## What it does

The site pulls real-time data from the Mempool.space API and displays it with a scrollable block timeline. Click any block to see its transactions, fees, and other details. There's also a search bar for looking up specific TxIDs or addresses.

The background has a Three.js scene with a rotating planet and some visual effects. You can drag to rotate the camera.

## Tech stack

- Next.js with the App Router
- React and Three.js for the 3D stuff
- Tailwind CSS for styling
- shadcn/ui components
- Mempool.space API for Bitcoin data

## Features

- Live Bitcoin price, mempool size, fee rates, and block height
- Block explorer showing recent and projected future blocks
- Block weight visualization (the blue/green fill shows MWU relative to max)
- Search for transactions and addresses
- Lightning Network donation QR code
- Works on mobile
