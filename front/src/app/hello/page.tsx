"use client";

import { useState } from "react";

// Define a type for your orderbook data
export interface OrderbookData {
  // Define specific properties if you know them, for example:
  // bids: Array<{ price: number; amount: number }>;
  // asks: Array<{ price: number; amount: number }>;
  // For now, we'll use an index signature:
  [key: string]: unknown;
}

export default function HelloPage() {
  const [orderbook, setOrderbook] = useState<OrderbookData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderbook = async () => {
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_STREAM_API_URL;
      const endpoint = process.env.NEXT_PUBLIC_ORDERBOOK_ENDPOINT;
      if (!baseUrl || !endpoint) {
        throw new Error("Environment variables not defined");
      }
      console.log("Fetching orderbook from", baseUrl + endpoint);
      const url = `${baseUrl}${endpoint}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      // Cast the returned JSON to your OrderbookData type
      const data: OrderbookData = await res.json();
      setOrderbook(data);
    } catch (err: unknown) {
      let message = "Unknown error";
      if (err instanceof Error) {
        message = err.message;
      }
      console.error("Error fetching orderbook:", message);
      setError(message);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Hello World Next.js Page</h1>
      <button onClick={fetchOrderbook} style={{ padding: "1rem", fontSize: "1rem" }}>
        Get Orderbook
      </button>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {orderbook && (
        <pre style={{ textAlign: "left", background: "#eee", padding: "1rem" }}>
          {JSON.stringify(orderbook, null, 2)}
        </pre>
      )}
    </div>
  );
}