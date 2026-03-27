import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PowerUp({ x, y, type, onCollect }) {
  const [collected, setCollected] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!collected) onCollect(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [collected, onCollect]);

  const handleCollect = () => {
    setCollected(true);
    onCollect(type);
  };

  const icons = {
    shield: "🛡️",
    double_damage: "⚔️",
    slow_motion: "⏱️",
  };

  return (
    <AnimatePresence>
      {!collected && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.3 }}
          onClick={handleCollect}
          style={{
            left: `${x}px`,
            top: `${y}px`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
        >
          <motion.div
            animate={{ rotate: 360, y: [0, -10, 0] }}
            transition={{ rotate: { duration: 2, repeat: Infinity }, y: { duration: 1.5, repeat: Infinity } }}
            className="text-4xl filter drop-shadow-lg"
          >
            {icons[type] || "✨"}
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}