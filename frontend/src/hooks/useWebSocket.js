import { useEffect, useRef } from 'react';

const WS_URL = `ws://${window.location.hostname}:8090/ws`;

export function useWebSocket(onRefresh) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    let ws;
    let reconnectTimer;
    let mounted = true;

    function connect() {
      if (!mounted) return;
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        window._wsReady = true;
      };

      ws.onmessage = (event) => {
        if (event.data === 'refresh') {
          onRefreshRef.current();
        }
      };

      ws.onclose = () => {
        window._wsReady = false;
        if (mounted) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };
    }

    connect();

    return () => {
      mounted = false;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);
}
