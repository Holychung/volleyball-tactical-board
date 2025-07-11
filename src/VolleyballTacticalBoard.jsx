import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const players = {
  left: [
    { label: "S",  color: "bg-blue-600" },      // Setter - Blue (lighter)
    { label: "OH", color: "bg-blue-500" },      // Outside Hitter - Light Blue
    { label: "MB", color: "bg-blue-400" },      // Middle Blocker - Lighter Blue
    { label: "OP", color: "bg-blue-300" },      // Opposite - Very Light Blue
    { label: "OH", color: "bg-blue-600" },      // Outside Hitter - Blue (lighter)
    { label: "L",  color: "bg-orange-300" },    // Libero - Light Orange
  ],
  right: [
    { label: "S",  color: "bg-red-600" },       // Setter - Red (lighter)
    { label: "OH", color: "bg-red-500" },       // Outside Hitter - Light Red
    { label: "MB", color: "bg-red-400" },       // Middle Blocker - Lighter Red
    { label: "OP", color: "bg-red-300" },       // Opposite - Very Light Red
    { label: "OH", color: "bg-red-600" },       // Outside Hitter - Red (lighter)
    { label: "L",  color: "bg-orange-400" },    // Libero - Light Orange
  ],
};

// Desktop layout (horizontal)
const desktopCoords = {
  left: [
    { x: 85, y: 422 },   // Pos 1: Back Row Right
    { x: 310, y: 422 },  // Pos 2: Front Row Right
    { x: 310, y: 242 },  // Pos 3: Front Row Middle
    { x: 310, y: 62 },   // Pos 4: Front Row Left
    { x: 85, y: 62 },    // Pos 5: Back Row Left
    { x: 85, y: 242 },   // Pos 6: Back Row Middle
  ],
  right: [
    { x: 760, y: 62 },    // Pos 1: Back Row Right
    { x: 535, y: 62 },    // Pos 2: Front Row Right
    { x: 535, y: 242 },   // Pos 3: Front Row Middle
    { x: 535, y: 422 },   // Pos 4: Front Row Left
    { x: 760, y: 422 },   // Pos 5: Back Row Left
    { x: 760, y: 242 },   // Pos 6: Back Row Middle
  ]
};

// Mobile layout (vertical/portrait) - Much smaller size with recalculated positions
const mobileCoords = {
  left: [
    { x: 245, y: 445 },  // Pos 1: Back Row Right (from team's perspective)
    { x: 245, y: 320 },  // Pos 2: Front Row Right (closer to net)
    { x: 144, y: 320 },  // Pos 3: Front Row Center
    { x: 43, y: 320 },   // Pos 4: Front Row Left
    { x: 43, y: 445 },   // Pos 5: Back Row Left
    { x: 144, y: 445 },  // Pos 6: Back Row Center
  ],
  right: [
    { x: 43, y: 58 },    // Pos 1: Back Row Right (from team's perspective - mirrored)
    { x: 43, y: 183 },   // Pos 2: Front Row Right (closer to net)
    { x: 144, y: 183 },  // Pos 3: Front Row Center
    { x: 245, y: 183 },  // Pos 4: Front Row Left
    { x: 245, y: 58 },   // Pos 5: Back Row Left
    { x: 144, y: 58 },   // Pos 6: Back Row Center
  ]
};

const baseRotationPlayerIndices = [
  [0, 1, 2, 3, 4, 5], // Rotation 1: S at pos 1, OH at pos 2, MB at pos 3, OP at pos 4, OH at pos 5, L at pos 6
  [1, 2, 3, 4, 5, 0], // Rotation 2: S at pos 6, OH at pos 1, MB at pos 2, OP at pos 3, OH at pos 4, L at pos 5
  [2, 3, 4, 5, 0, 1], // Rotation 3: S at pos 5, OH at pos 6, MB at pos 1, OP at pos 2, OH at pos 3, L at pos 4
  [3, 4, 5, 0, 1, 2], // Rotation 4: S at pos 4, OH at pos 5, MB at pos 6, OP at pos 1, OH at pos 2, L at pos 3
  [4, 5, 0, 1, 2, 3], // Rotation 5: S at pos 3, OH at pos 4, MB at pos 5, OP at pos 6, OH at pos 1, L at pos 2
  [5, 0, 1, 2, 3, 4], // Rotation 6: S at pos 2, OH at pos 3, MB at pos 4, OP at pos 5, OH at pos 6, L at pos 1
];

// Automatically handle Libero/Middle Blocker substitution
const frontRowCellIndices = new Set([1, 2, 3]); // Court positions 2, 3, 4
const liberoPlayerIndex = 5;
const middleBlockerPlayerIndex = 2;

const rotationPlayerIndices = baseRotationPlayerIndices.map(sequence => {
  const newSequence = [...sequence];
  const mbCellIndex = newSequence.indexOf(middleBlockerPlayerIndex);
  const isMbInBackRow = !frontRowCellIndices.has(mbCellIndex);

  if (isMbInBackRow) {
    const lCellIndex = newSequence.indexOf(liberoPlayerIndex);
    // Swap MB and Libero
    newSequence[mbCellIndex] = liberoPlayerIndex;
    newSequence[lCellIndex] = middleBlockerPlayerIndex;
  }
  
  return newSequence;
});

const createAllRotations = (cellCoords) => {
  return rotationPlayerIndices.map(sequence => ({
    left: sequence.map((playerIndex, cellIndex) => ({
      ...players.left[playerIndex],
      ...cellCoords.left[cellIndex]
    })),
    right: sequence.map((playerIndex, cellIndex) => ({
      ...players.right[playerIndex],
      ...cellCoords.right[cellIndex]
    })),
  }));
};

// Create immutable default positions for reset functionality
const defaultDesktopRotations = JSON.parse(JSON.stringify(createAllRotations(desktopCoords)));
const defaultMobileRotations = JSON.parse(JSON.stringify(createAllRotations(mobileCoords)));

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches, query]);

  return matches;
};

const snapToGrid = (x, y, courtWidth, courtHeight, gridRows, gridCols, isMobile) => {
  // Keep players within court boundaries
  const playerSize = isMobile ? 32 : 56;
  const padding = playerSize / 2;
  
  const minX = padding;
  const maxX = courtWidth - padding;
  const minY = padding;
  const maxY = courtHeight - padding;
  
  // Constrain to court boundaries without snapping to grid
  const constrainedX = Math.max(minX, Math.min(maxX, x));
  const constrainedY = Math.max(minY, Math.min(maxY, y));
  
  return { x: constrainedX, y: constrainedY };
};

const Player = ({ player, onDragEnd, isMobile }) => (
  <motion.div
    drag
    dragMomentum={false}
    dragElastic={0.1}
    dragConstraints={false}
    onDragEnd={onDragEnd}
    initial={{ x: player.x, y: player.y }}
    animate={{ x: player.x, y: player.y }}
    whileDrag={{ scale: 1.1, zIndex: 30, rotate: 2 }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 1.05 }}
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
    className={`absolute ${isMobile ? 'w-8 h-8 text-sm' : 'w-14 h-14 text-lg'} flex items-center justify-center ${player.color} text-white font-bold rounded-full border-2 border-white shadow-lg cursor-grab active:cursor-grabbing select-none`}
  >
    {player.label}
  </motion.div>
);

function VolleyballTacticalBoard() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [rotationIndex, setRotationIndex] = useState(0);
  
  // Separate position tracking for desktop and mobile
  const [desktopPositions, setDesktopPositions] = useState(() => 
    JSON.parse(JSON.stringify(defaultDesktopRotations))
  );
  const [mobilePositions, setMobilePositions] = useState(() => 
    JSON.parse(JSON.stringify(defaultMobileRotations))
  );
  
  // Use the appropriate positions based on screen size
  const currentPositions = isMobile ? mobilePositions : desktopPositions;
  const setCurrentPositions = isMobile ? setMobilePositions : setDesktopPositions;
  const currentDefaultRotations = isMobile ? defaultMobileRotations : defaultDesktopRotations;

  const positions = currentPositions[rotationIndex];

  // Dynamic court dimensions
  const courtWidth = isMobile ? 320 : 900;
  const courtHeight = isMobile ? 535 : 540;
  const gridRows = isMobile ? 9 : 6;
  const gridCols = isMobile ? 6 : 9;
  const gridSizeX = courtWidth / gridCols;
  const gridSizeY = courtHeight / gridRows;

  const handleDragEnd = useCallback((team, index, info) => {
    const player = positions[team][index];
    const newX = player.x + info.offset.x;
    const newY = player.y + info.offset.y;
    const constrained = snapToGrid(newX, newY, courtWidth, courtHeight, gridRows, gridCols, isMobile);

    // Always update position to where user dropped it (within boundaries)
    setCurrentPositions(prevAll => {
      const newAllPositions = [...prevAll];
      newAllPositions[rotationIndex] = {
        ...newAllPositions[rotationIndex],
        [team]: newAllPositions[rotationIndex][team].map((p, i) => 
          i === index ? { ...p, ...constrained } : p
        )
      };
      return newAllPositions;
    });
  }, [positions, courtWidth, courtHeight, gridRows, gridCols, isMobile, rotationIndex, setCurrentPositions]);

  const handleReset = () => {
    setCurrentPositions(prevAll => {
      const newAllPositions = [...prevAll];
      newAllPositions[rotationIndex] = JSON.parse(JSON.stringify(currentDefaultRotations[rotationIndex]));
      return newAllPositions;
    });
  };

  const handleNextRotation = () => {
    setRotationIndex((prevIndex) => (prevIndex + 1) % 6);
  };

  const handlePrevRotation = () => {
    setRotationIndex((prevIndex) => (prevIndex - 1 + 6) % 6);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-3 md:p-8">
      <div className="text-center mb-3 md:mb-6">
        <h1 className="text-lg md:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Volleyball Rotation
        </h1>
        <p className="text-xs md:text-lg text-gray-600 mt-1 md:mt-2">
          Rotation: <span className="font-bold text-sm md:text-xl bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">{rotationIndex + 1}</span>
        </p>
      </div>
      <div
        className="relative rounded-2xl shadow-2xl bg-gradient-to-br from-green-200 via-green-300 to-green-200 overflow-hidden border-4 border-green-600 ring-2 ring-green-400 ring-opacity-50"
        style={{ width: courtWidth, height: courtHeight }}
      >
        {/* Court lines */}
        {[...Array(gridCols)].map((_, i) => (
          <div key={`v${i}`} className="absolute bg-white/40 shadow-sm" style={{ left: (i + 1) * gridSizeX, top: 0, width: 1, height: courtHeight }} />
        ))}
        {[...Array(gridRows)].map((_, i) => (
          <div key={`h${i}`} className="absolute bg-white/40 shadow-sm" style={{ top: (i + 1) * gridSizeY, left: 0, height: 1, width: courtWidth }} />
        ))}
        
        {/* Center Line */}
        {isMobile ? (
          <div className="absolute bg-white shadow-md" style={{ left: 0, top: courtHeight / 2 - 1, width: courtWidth, height: 3 }} />
        ) : (
          <div className="absolute bg-white shadow-md" style={{ left: courtWidth / 2 - 1, top: 0, width: 3, height: courtHeight }} />
        )}
        
        {/* Attack Lines */}
        {isMobile ? (
          <>
            <div className="absolute bg-white/80 shadow-sm" style={{ left: 0, top: courtHeight / 3, width: courtWidth, height: 2 }} />
            <div className="absolute bg-white/80 shadow-sm" style={{ left: 0, top: (courtHeight * 2) / 3, width: courtWidth, height: 2 }} />
          </>
        ) : (
          <>
            <div className="absolute bg-white/80 shadow-sm" style={{ left: courtWidth / 3, top: 0, width: 2, height: courtHeight }} />
            <div className="absolute bg-white/80 shadow-sm" style={{ right: courtWidth / 3, top: 0, width: 2, height: courtHeight }} />
          </>
        )}
        
        {Object.entries(positions).map(([team, players]) =>
          players.map((player, index) => (
            <Player
              key={`${team}-${player.label}-${index}`}
              player={player}
              onDragEnd={(e, info) => handleDragEnd(team, index, info)}
              isMobile={isMobile}
            />
          ))
        )}
      </div>
      <div className="flex flex-row items-center justify-center gap-2 md:gap-4 mt-3 md:mt-8 w-full px-4">
        <button
          onClick={handlePrevRotation}
          className="flex-1 max-w-20 md:max-w-none md:flex-initial px-2 md:px-6 py-2 md:py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white text-xs md:text-lg rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          ← Prev
        </button>
        <button
          onClick={handleReset}
          className="flex-1 max-w-20 md:max-w-none md:flex-initial px-2 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs md:text-lg rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 font-bold"
        >
          Reset
        </button>
        <button
          onClick={handleNextRotation}
          className="flex-1 max-w-20 md:max-w-none md:flex-initial px-2 md:px-6 py-2 md:py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white text-xs md:text-lg rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default VolleyballTacticalBoard;