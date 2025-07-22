# Babd Timechain Explorer

https://babd.space

A modern, interactive Bitcoin blockchain explorer with a unique 3D visualization experience, built using Next.js and Three.js. Explore real-time Bitcoin network data, display block details, and visualize the "timechain" in a dynamic, immersive environment.

## ✨ Features

*   **Immersive 3D Visualization**: A captivating Three.js scene featuring a central planet with a glowing effect, an orbiting accretion disk, and a starfield with a gravitational lensing effect, creating a "black hole" aesthetic.
*   **Real-time Bitcoin Metrics**: Displays live data including Bitcoin price, mempool size, high-priority fee rates, unconfirmed transactions, and current block height, fetched from the Mempool.space API.
*   **Interactive Block Explorer**:
    *   Visually represents recent and projected future blocks.
    *   Blocks are filled with a transparent blue/green color indicating their weight (MWU) relative to the maximum block weight.
    *   Clickable blocks open detailed modals with comprehensive information (transactions, fees, technical details).
    *   Future blocks show estimated time until confirmation and projected fee rates.
    *   Scrollable interface with the current block centered for easy navigation.
*   **Smart Search Functionality**: A modal-based search bar allows users to look up Bitcoin transaction IDs (TxIDs) or addresses, providing detailed information upon successful search.
*   **Responsive Design**: Optimized for various screen sizes, ensuring a consistent and engaging experience on both desktop and mobile devices.
*   **Lightning Network Integration**: Includes a Lightning Network QR code for donations (hidden on mobile, but copy button remains visible).
*   **Social Connectivity**: Easy access to the project's X (Twitter) profile.
*   **Modern UI/UX**: Utilizes glass morphism cards, a consistent orange/yellow/blue color theme, and custom scrollbars for a sleek and intuitive interface.

## 🚀 Technologies Used

*   **Next.js (App Router)**: A React framework for building performant and scalable web applications.
*   **React**: For building the user interface components.
*   **Three.js**: A JavaScript 3D library used for rendering the interactive background scene.
*   **Tailwind CSS**: A utility-first CSS framework for rapid styling.
*   **shadcn/ui**: A collection of reusable components built with Radix UI and Tailwind CSS.
*   **Lucide React**: A library of beautiful and customizable open-source icons.
*   **Mempool.space API**: Used for fetching real-time Bitcoin blockchain data.

## 💡 Usage

*   **Explore Blocks**: Scroll horizontally through the block explorer to view recent and upcoming blocks.
*   **View Block Details**: Click on any block card to open a modal with detailed information about that block.
*   **Search**: Use the search bar at the bottom to look up specific Bitcoin transaction IDs or addresses.
*   **Interact with 3D Scene**: Drag to rotate the camera around the central planet.
