"use client";

import React, { useEffect, useRef, memo } from "react";

type Props = {
  /** Pass "BTCUSD" or "BTCEUR" (we’ll map to BITSTAMP:…) */
  symbol?: "BTCUSD" | "BTCEUR" | string;
  /** Let the widget render an inline USD/EUR switch overlayed in the top-right */
  inlineToggle?: boolean;
  /** If you want the inline toggle to control state in your parent */
  onChangeSymbol?: (s: "BTCUSD" | "BTCEUR") => void;
};

declare global {
  interface Window {
    TradingView?: any;
  }
}

function TradingViewWidget({
  symbol = "BTCUSD",
  inlineToggle = true,
  onChangeSymbol,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scriptRequestedRef = useRef(false);
  const containerIdRef = useRef(`tv_${Math.random().toString(36).slice(2)}`);

  // Always force Bitstamp
  const mappedSymbol =
    symbol.toUpperCase().includes(":")
      ? symbol.toUpperCase()
      : `BITSTAMP:${symbol.toUpperCase()}`;

  // Decide default interval per pair (USD => daily, EUR => 1h)
  const pair = mappedSymbol.split(":").pop() || "BTCUSD";
  const defaultInterval =
    pair === "BTCUSD" ? "D" : pair === "BTCEUR" ? "60" : "60";

  useEffect(() => {
    if (!containerRef.current) return;

    // Ensure container has a stable id
    containerRef.current.id = containerIdRef.current;

    const createWidget = () => {
      if (!window.TradingView) return;

      // Clear any prior iframe/content
      containerRef.current!.innerHTML = "";

      // eslint-disable-next-line no-new
      new window.TradingView.widget({
        container_id: containerIdRef.current,
        symbol: mappedSymbol,              // e.g., BITSTAMP:BTCUSD
        interval: defaultInterval,         // USD=D, EUR=60
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
      scriptRequestedRef.current = true;
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = () => createWidget();
      document.head.appendChild(script);
    } else {
      const id = window.setInterval(() => {
        if (window.TradingView) {
          window.clearInterval(id);
          createWidget();
        }
      }, 50);
      return () => window.clearInterval(id);
    }

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [mappedSymbol, defaultInterval]);

  const rawLabel = pair; // "BTCUSD" or "BTCEUR"

  const handleSelect = (next: "BTCUSD" | "BTCEUR") => {
    if (onChangeSymbol) onChangeSymbol(next);
    // If you don’t pass onChangeSymbol, control this in your parent as before.
  };

  return (
    <div className="relative h-full w-full">
      {/* TradingView widget container */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Optional tiny label/footer (kept minimal to preserve height) */}
      <div className="pointer-events-none absolute bottom-1 right-2 z-10 text-[10px] text-white/50">
        {rawLabel} • Bitstamp • TradingView
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);

