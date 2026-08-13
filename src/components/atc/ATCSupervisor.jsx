import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { MessageCircle, Send, Loader2 } from "lucide-react";

export default function ATCSupervisor({ session }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState(null);

  useEffect(() => {
    // Initialize agent conversation
    const initConversation = async () => {
      const conv = await api.agents.createConversation({
        agent_name: "atc_supervisor",
        metadata: {
          name: `ATC Session ${session.id}`,
          session_id: session.id,
          difficulty: session.difficulty,
          level: session.level,
        },
      });
      setConversation(conv);
    };

    initConversation();
  }, [session]);

  useEffect(() => {
    if (!conversation) return;

    // Subscribe to conversation updates
    const unsubscribe = api.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });

    return unsubscribe;
  }, [conversation]);

  const sendMessage = async () => {
    if (!input.trim() || !conversation) return;

    setLoading(true);
    try {
      await api.agents.addMessage(conversation, {
        role: "user",
        content: input,
      });
      setInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4 text-primary" />
        <h3 className="font-mono text-xs font-semibold text-foreground/80">ATC SUPERVISOR</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {messages.length === 0 ? (
          <p className="text-[10px] font-mono text-muted-foreground text-center mt-4">
            Ask the supervisor for assistance with aircraft management, emergencies, or operations
          </p>
        ) : (
          messages.map((msg) => (
            <AnimatePresence key={msg.id}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-[10px] font-mono ${
                  msg.role === "user"
                    ? "text-cyan-400 ml-6"
                    : "text-green-400 mr-6"
                }`}
              >
                <div className={`bg-black/30 rounded p-2 ${
                  msg.role === "user" ? "bg-cyan-900/20" : "bg-green-900/20"
                }`}>
                  {msg.content}
                </div>
                {msg.tool_calls?.length > 0 && (
                  <div className="mt-1 text-[9px] text-muted-foreground">
                    {msg.tool_calls.map((tc, i) => (
                      <div key={i}>
                        {tc.status === "completed" ? "✓" : "→"} {tc.name}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ))
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Request clearance, report emergency, etc..."
          className="flex-1 bg-black/50 border border-border rounded px-2 py-1.5 text-xs font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
          disabled={loading}
        />
        <Button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          size="icon"
          className="h-8 w-8"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Send className="w-3 h-3" />
          )}
        </Button>
      </div>
    </div>
  );
}