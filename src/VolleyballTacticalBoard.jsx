import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const players = {
  left: [
    { label: "S",  color: "bg-blue-600" },
    { label: "OH", color: "bg-blue-700" },
    { label: "MB", color: "bg-blue-400" },
    { label: "OP", color: "bg-blue-300" },
    { label: "OH", color: "bg-blue-500" },
    { label: "L",  color: "bg-yellow-400" },
  ],
  right: [
    { label: "S",  color: "bg-red-600" },
    { label: "OH", color: "bg-red-700" },
    { label: "MB", color: "bg-red-400" },
    { label: "OP", color: "bg-red-300" },
    { label: "OH", color: "bg-red-500" },
    { label: "L",  color: "bg-yellow-600" },
  ],
};

const cellCoords = {
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

const baseRotationPlayerIndices = [
  [0, 1, 2, 3, 4, 5], // Rotation 1
  [1, 2, 3, 4, 5, 0], // Rotation 2
  [2, 3, 4, 5, 0, 1], // Rotation 3
  [3, 4, 5, 0, 1, 2], // Rotation 4
  [4, 5, 0, 1, 2, 3], // Rotation 5
  [5, 0, 1, 2, 3, 4], // Rotation 6
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


const allRotations = rotationPlayerIndices.map(sequence => ({
  left: sequence.map((playerIndex, cellIndex) => ({
    ...players.left[playerIndex],
    ...cellCoords.left[cellIndex]
  })),
  right: sequence.map((playerIndex, cellIndex) => ({
    ...players.right[playerIndex],
    ...cellCoords.right[cellIndex]
  })),
}));

const courtWidth = 900;
const courtHeight = 540;
const gridRows = 6;
const gridCols = 9;
const gridSizeX = courtWidth / gridCols;
const gridSizeY = courtHeight / gridRows;

const snapToGrid = (x, y) => {
  const snappedX = Math.round(x / gridSizeX) * gridSizeX + (gridSizeX - 56) / 2;
  const snappedY = Math.round(y / gridSizeY) * gridSizeY + (gridSizeY - 56) / 2;
  return { x: snappedX, y: snappedY };
};

const Player = ({ player, onDragEnd }) => (
  <motion.div
    drag
    dragMomentum={false}
    onDragEnd={onDragEnd}
    initial={{ x: player.x, y: player.y }}
    whileTap={{ scale: 1.1, zIndex: 20 }}
    style={{ x: player.x, y: player.y }}
    className={`absolute w-14 h-14 flex items-center justify-center ${player.color} text-white text-lg font-bold rounded-full border-4 border-white shadow-lg cursor-pointer select-none`}
  >
    {player.label}
  </motion.div>
);

function VolleyballTacticalBoard() {
  const [rotationIndex, setRotationIndex] = useState(0);
  const [allUserPositions, setAllUserPositions] = useState(allRotations);
  
  const positions = allUserPositions[rotationIndex];

  const handleDragEnd = (team, index, info) => {
    const player = positions[team][index];
    const newX = player.x + info.offset.x;
    const newY = player.y + info.offset.y;
    const snapped = snapToGrid(newX, newY);

    setAllUserPositions(prevAll => {
      const newAllPositions = [...prevAll];
      const newRotationPositions = { ...newAllPositions[rotationIndex] };
      const newTeamPositions = [...newRotationPositions[team]];
      
      newTeamPositions[index] = { ...newTeamPositions[index], ...snapped };
      newRotationPositions[team] = newTeamPositions;
      newAllPositions[rotationIndex] = newRotationPositions;
      
      return newAllPositions;
    });
  };

  const handleReset = () => {
    setAllUserPositions(prevAll => {
      const newAllPositions = [...prevAll];
      newAllPositions[rotationIndex] = allRotations[rotationIndex];
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
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-green-50 p-8">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold">Volleyball 5-1 Rotation Tactical Board</h1>
        <p className="text-lg text-gray-700 mt-2">
          Rotation: <span className="font-bold text-xl">{rotationIndex + 1}</span>
        </p>
      </div>
      <div
        className="relative rounded-2xl shadow-xl bg-green-200 overflow-hidden border-4 border-green-700"
        style={{ width: courtWidth, height: courtHeight }}
      >
        {/* Court lines */}
        {[...Array(gridCols)].map((_, i) => (
          <div key={`v${i}`} className="absolute bg-white/30" style={{ left: (i + 1) * gridSizeX, top: 0, width: 1, height: courtHeight }} />
        ))}
        {[...Array(gridRows)].map((_, i) => (
          <div key={`h${i}`} className="absolute bg-white/30" style={{ top: (i + 1) * gridSizeY, left: 0, height: 1, width: courtWidth }} />
        ))}
        {/* Center Line */}
        <div className="absolute bg-white" style={{ left: courtWidth / 2 - 1, top: 0, width: 2, height: courtHeight }} />
        {/* Attack Lines */}
        <div className="absolute bg-white" style={{ left: courtWidth / 3, top: 0, width: 2, height: courtHeight }} />
        <div className="absolute bg-white" style={{ right: courtWidth / 3, top: 0, width: 2, height: courtHeight }} />
        
        {Object.entries(positions).map(([team, players]) =>
          players.map((player, index) => (
            <Player
              key={`${team}-${player.label}-${index}`}
              player={player}
              onDragEnd={(e, info) => handleDragEnd(team, index, info)}
            />
          ))
        )}
      </div>
      <div className="flex items-center gap-4 mt-8">
        <button
          onClick={handlePrevRotation}
          className="px-6 py-3 bg-gray-500 hover:bg-gray-700 text-white text-lg rounded-xl shadow-lg transition-colors"
        >
          &larr; Prev Rotation
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-800 text-white text-lg rounded-xl shadow-lg transition-colors font-bold"
        >
          Reset Positions
        </button>
        <button
          onClick={handleNextRotation}
          className="px-6 py-3 bg-gray-500 hover:bg-gray-700 text-white text-lg rounded-xl shadow-lg transition-colors"
        >
          Next Rotation &rarr;
        </button>
      </div>
    </div>
  );
}

export default VolleyballTacticalBoard;