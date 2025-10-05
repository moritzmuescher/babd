"use client";

import React, { useEffect, useRef, memo } from "react";

type Props = { symbol?: "BTCUSD" | "BTCEUR" | string };

declare global {
  interface Window {
    TradingView?: any;
  }
}

function TradingViewWidget({ symbol = "BTCUSD" }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scriptRequestedRef = useRef(false);
  const containerIdRef = useRef(`tv_${Math.random().toString(36).slice(2)}`);

  // Always use Bitstamp for these pairs
  const mappedSymbol =
    symbol.toUpperCase().includes(":")
      ? symbol.toUpperCase()
      : `BITSTAMP:${symbol.toUpperCase()}`;

  useEffect(() => {
    if (!containerRef.current) return;

    // Ensure container has a stable id
    containerRef.current.id = containerIdRef.current;

    const createWidget = () => {
      if (!window.TradingView) return;

      // Remove any previous iframe/content before creating a new one
      containerRef.current!.innerHTML = "";

      // Instantiate a fresh Advanced Chart widget
      // eslint-disable-next-line no-new
      new window.TradingView.widget({
        container_id: containerIdRef.current,
        symbol: mappedSymbol,                      // <— BITSTAMP pair
        interval: "60",
        autosize: true,
        theme: "dark",
        style: "1",
        locale: "en",
        timezone: "Etc/UTC",
        allow_symbol_change: false,
        hide_side_toolbar: false,
        studies: [],
        disabled_features: ["use_localstorage_for_settings"],
        enabled_features: [],
      });
    };

    if (window.TradingView) {
      createWidget();
    } else if (!scriptRequestedRef.current) {
      // Load tv.js once
      scriptRequestedRef.current = true;
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = () => createWidget();
      document.head.appendChild(script);
    } else {
      // If script was requested earlier but TV isn't ready yet, poll briefly
      const id = window.setInterval(() => {
        if (window.TradingView) {
          window.clearInterval(id);
          createWidget();
        }
      }, 50);
      return () => window.clearInterval(id);
    }

    // Cleanup on unmount
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [mappedSymbol]); // <— Rebuild when the symbol changes

  const label = mappedSymbol.replace("BITSTAMP:", "");

  return (
    <div className="h-full w-full">
      <div className="h-[calc(100%-24px)] w-full" ref={containerRef} />
      <div className="h-6 flex items-center justify-end text-xs text-orange-400/80">
        <a
          href={`https://www.tradingview.com/symbols/${label}/`}
          target="_blank"
          rel="noopener nofollow"
          className="underline"
        >
          {label} chart
        </a>
        <span className="ml-1">by TradingView</span>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);

