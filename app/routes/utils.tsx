import { useRef, useEffect } from "react";

export function useInterval(callback: () => void, delay: number | null | undefined) {
    const savedCallback = useRef<undefined | (() => void)> ();
  
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);
  
    useEffect(() => {
      function tick() {
        if(savedCallback.current)
            savedCallback.current();
      }
  
      if (delay !== null) {
        let id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    }, [delay]);
  }