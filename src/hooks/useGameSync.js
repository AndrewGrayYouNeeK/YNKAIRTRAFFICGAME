import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useGameSync(sessionId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to game session updates
    const unsubscribeSession = base44.entities.GameSession.subscribe((event) => {
      if (event.id === sessionId) {
        queryClient.invalidateQueries({ queryKey: ["current-game-session"] });
      }
    });

    // Subscribe to participant updates
    const unsubscribeParticipants = base44.entities.GameSessionParticipant.subscribe((event) => {
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