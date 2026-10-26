import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeRecords } from "@/lib/localStore";

export function useGameSync(sessionId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to game session updates
    const unsubscribeSession = subscribeRecords("GameSession", (event) => {
      if (event.id === sessionId) {
        queryClient.invalidateQueries({ queryKey: ["current-game-session"] });
      }
    });

    const unsubscribeParticipants = subscribeRecords("GameSessionParticipant", (event) => {
      if (event.data?.session_id === sessionId) {
        queryClient.invalidateQueries({ queryKey: ["game-participants", sessionId] });
      }
    });

    return () => {
      unsubscribeSession();
      unsubscribeParticipants();
    };
  }, [sessionId, queryClient]);
}