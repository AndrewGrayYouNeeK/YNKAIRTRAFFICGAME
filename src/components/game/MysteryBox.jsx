import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";

const WEAPONS = [
  { name: "AMMO +50", type: "ammo", value: 50 },
  { name: "MORTAR", type: "mortars", value: 1 },
  { name: "AIR STRIKE", type: "air_strikes", value: 1 },
  { name: "PROTON BEAM", type: "proton_beams", value: 1 },
  { name: "REPAIR +20", type: "health", value: 20 },
  { name: "WOOD +30", type: "wood", value: 30 },
  { name: "NAILS +40", type: "nails", value: 40 },
];

export default function MysteryBox({ onUnbox }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [spinning, setSpinning] = useState(false);

  const openBox = () => {
    if (isOpen || spinning) return;
    
    setSpinning(true);
    
    // Spin for 2 seconds
    setTimeout(() => {
      const weapon = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
      setSelectedWeapon(weapon);
      setSpinning(false);
      setIsOpen(true);
    }, 2000);
  };

  const collectReward = () => {
    if (selectedWeapon) {
      onUnbox(selectedWeapon);
      setIsOpen(false);
      setSelectedWeapon(null);
    }
  };

  return (
    <AnimatePresence>
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <button
            onClick={openBox}
            disabled={spinning}
            className="relative focus:outline-none"
          >
            {/* Spinning Box */}
            <motion.div
              animate={{ rotate: spinning ? 360 : 0 }}
              transition={{ duration: 0.1, repeat: spinning ? Infinity : 0 }}
              className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg border-4 border-yellow-300 shadow-xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform disabled:opacity-50"
            >
              <Gift className="w-10 h-10 text-yellow-900" />
            </motion.div>

            {/* Glow Effect */}
            {!spinning && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 bg-yellow-400/20 rounded-lg"
              />
            )}
          </button>
        </motion.div>
      )}

      {/* Reward Display */}
      {isOpen && selectedWeapon && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 pointer-events-auto"
        >
          <motion.div
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            className="text-center space-y-6"
          >
            {/* Spinning Animation */}
            <motion.div
              animate={{ rotateY: 360 }}
              transition={{ duration: 1, repeat: 1 }}
              className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg border-4 border-yellow-300 flex items-center justify-center text-5xl shadow-2xl"
            >
              🎁
            </motion.div>

            {/* Weapon Name */}
            <div>
              <p className="text-sm font-mono text-gray-400 mb-2">YOU RECEIVED</p>
              <h2 className="text-3xl font-mono font-bold text-yellow-400">{selectedWeapon.name}</h2>
            </div>

            {/* Collect Button */}
            <Button
              onClick={collectReward}
              className="font-mono text-base bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-8"
            >
              COLLECT
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}