import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";

export function useGameSync(sessionId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to game session updates
    const unsubscribeSession = api.entities.GameSession.subscribe((event) => {
      if (event.id === sessionId) {
        queryClient.invalidateQueries({ queryKey: ["current-game-session"] });
      }
    });

    // Subscribe to participant updates
    const unsubscribeParticipants = api.entities.GameSessionParticipant.subscribe((event) => {
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