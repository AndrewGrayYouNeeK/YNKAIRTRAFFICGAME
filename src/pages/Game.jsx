import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gamepad2, Radar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import StrategyMode from "../components/game/StrategyMode";
import ARMode from "../components/game/ARMode";
import GameSetup from "../components/game/GameSetup";
import BetweenWaves from "../components/game/BetweenWaves";
import MultiplayerLobby from "../components/game/MultiplayerLobby";

export default function Game() {
  const queryClient = useQueryClient();
  const [gameSession, setGameSession] = useState(null);
  const [showLobby, setShowLobby] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user
  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  const { data: session, isLoading } = useQuery({
    queryKey: ["current-game-session"],
    queryFn: async () => {
      const sessions = await base44.entities.GameSession.filter({ status: "active" }, "-created_date", 1);
      return sessions[0] || null;
    },
    refetchInterval: 2000,
  });

  // Subscribe to real-time game updates
  useEffect(() => {
    if (!session) return;
    
    const unsubscribe = base44.entities.GameSession.subscribe((event) => {
      if (event.id === session.id) {
        queryClient.invalidateQueries({ queryKey: ["current-game-session"] });
      }
    });

    return unsubscribe;
  }, [session?.id, queryClient]);

  const createGameMutation = useMutation({
    mutationFn: (data) => base44.entities.GameSession.create(data),
    onSuccess: (newSession) => {
      setGameSession(newSession);
      queryClient.invalidateQueries({ queryKey: ["current-game-session"] });
    },
  });

  const updateGameMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GameSession.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-game-session"] });
    },
  });

  useEffect(() => {
    if (session) setGameSession(session);
  }, [session]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (showLobby && !gameSession) {
    return (
      <MultiplayerLobby
        onStartGame={() => setShowLobby(false)}
        onJoinGame={async (session) => {
          // Add player as participant
          if (currentUser) {
            await base44.entities.GameSessionParticipant.create({
              session_id: session.id,
              player_email: currentUser.email,
              player_name: currentUser.full_name,
              status: "active",
            });
          }
          setGameSession(session);
          setShowLobby(false);
        }}
      />
    );
  }

  if (!gameSession) {
    return (
      <GameSetup
        onStartGame={(data) => {
          createGameMutation.mutate({
            status: "active",
            current_wave: 1,
            total_waves: 5,
            health: 100,
            max_health: 100,
            wood: 30,
            nails: 50,
            ammo: 100,
            score: 0,
            game_mode: "strategy",
            ...data,
          });
          setShowLobby(false);
        }}
      />
    );
  }

  return (
    <div className="w-full h-screen bg-background overflow-hidden">
      {gameSession.status === "between_waves" ? (
        <BetweenWaves
          session={gameSession}
          onUpdate={(data) => updateGameMutation.mutate({ id: gameSession.id, data })}
        />
      ) : gameSession.game_mode === "strategy" ? (
        <StrategyMode
          session={gameSession}
          onUpdate={(data) => updateGameMutation.mutate({ id: gameSession.id, data })}
        />
      ) : (
        <ARMode
          session={gameSession}
          onUpdate={(data) => updateGameMutation.mutate({ id: gameSession.id, data })}
        />
      )}
    </div>
  );
}