// Mock statistics for a few key players to demonstrate functionality.
// In a real application, this might come from a backend API or a separate JSON file.

export const mockPlayerStats = {
  "1": {
    totalRuns: "6,628",
    totalWickets: "2",
    battingSR: "131.2",
    bowlingEconomy: "7.9",
    bestScore: "109*",
    bestBowling: "1/5"
  },
  "2": {
    totalRuns: "2,525",
    totalWickets: "64",
    battingSR: "145.8",
    bowlingEconomy: "9.1",
    bestScore: "91*",
    bestBowling: "3/17"
  },
  "4": {
    totalRuns: "57",
    totalWickets: "165",
    battingSR: "93.4",
    bowlingEconomy: "7.3",
    bestScore: "16",
    bestBowling: "5/10"
  },
  "5": {
    totalRuns: "8,004",
    totalWickets: "4",
    battingSR: "131.9",
    bowlingEconomy: "8.8",
    bestScore: "113*",
    bestBowling: "2/25"
  },
  "6": {
    totalRuns: "379",
    totalWickets: "60",
    battingSR: "151.6",
    bowlingEconomy: "8.5",
    bestScore: "66*",
    bestBowling: "4/34"
  },
  "12": {
    totalRuns: "5,243",
    totalWickets: "0",
    battingSR: "135.9",
    bowlingEconomy: "0.0",
    bestScore: "84*",
    bestBowling: "N/A"
  }
};

export const getPlayerStats = (playerId) => {
  // If no mock data, return default dummy stats
  return mockPlayerStats[playerId.toString()] || {
    totalRuns: "N/A",
    totalWickets: "N/A",
    battingSR: "N/A",
    bowlingEconomy: "N/A",
    bestScore: "N/A",
    bestBowling: "N/A"
  };
};
