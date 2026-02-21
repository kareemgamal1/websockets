import { useEffect, useState } from "react";
import "./App.css";

type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

function App() {
  const [data, setData] = useState<string[]>([]);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:3000/sse-stream");

    let reconnectTimeout: null | number = null;
    let hasConnectedOnce = false; // track first successful connection

    const markDisconnectedIfStuck = () => {
      reconnectTimeout = setTimeout(() => {
        if (eventSource.readyState !== EventSource.OPEN) {
          setConnectionState("disconnected");
        }
      }, 10000);
    };

    eventSource.onopen = () => {
      hasConnectedOnce = true;
      clearTimeout(reconnectTimeout!);
      setConnectionState("connected");
    };

    eventSource.onmessage = (event) => {
      setData((prev) => [...prev, event.data]);
    };

    eventSource.onerror = () => {
      // Only switch to reconnecting if we’ve connected at least once
      if (hasConnectedOnce) {
        setConnectionState("reconnecting");
      } else {
        setConnectionState("connecting"); // first-time still connecting
      }

      markDisconnectedIfStuck();
    };

    return () => {
      eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      setConnectionState("disconnected");
    };
  }, []);

  return (
    <div>
      <h1>SSE Live Time</h1>
      <p>Connection state: {connectionState}</p>
      <ul>
        {data.map((d, index) => (
          <li key={index}>{d}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
