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
  "3": {
    totalRuns: "3,842",
    totalWickets: "0",
    battingSR: "143.3",
    bowlingEconomy: "0.0",
    bestScore: "117*",
    bestBowling: "N/A"
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
  "7": {
    totalRuns: "3,284",
    totalWickets: "0",
    battingSR: "148.5",
    bowlingEconomy: "0.0",
    bestScore: "128*",
    bestBowling: "N/A"
  },
  "8": {
    totalRuns: "2,954",
    totalWickets: "160",
    battingSR: "128.6",
    bowlingEconomy: "7.6",
    bestScore: "62*",
    bestBowling: "5/16"
  },
  "9": {
    totalRuns: "466",
    totalWickets: "153",
    battingSR: "155.8",
    bowlingEconomy: "6.7",
    bestScore: "79*",
    bestBowling: "4/24"
  },
  "10": {
    totalRuns: "3,446",
    totalWickets: "0",
    battingSR: "148.3",
    bowlingEconomy: "0.0",
    bestScore: "124",
    bestBowling: "N/A"
  },
  "11": {
    totalRuns: "186",
    totalWickets: "105",
    battingSR: "115.4",
    bowlingEconomy: "8.3",
    bestScore: "25",
    bestBowling: "4/21"
  },
  "12": {
    totalRuns: "5,243",
    totalWickets: "0",
    battingSR: "135.9",
    bowlingEconomy: "0.0",
    bestScore: "84*",
    bestBowling: "N/A"
  },
  "13": {
    totalRuns: "32",
    totalWickets: "105",
    battingSR: "103.2",
    bowlingEconomy: "8.3",
    bestScore: "13",
    bestBowling: "4/18"
  },
  "14": {
    totalRuns: "3,135",
    totalWickets: "0",
    battingSR: "134.1",
    bowlingEconomy: "0.0",
    bestScore: "108",
    bestBowling: "N/A"
  },
  "15": {
    totalRuns: "15",
    totalWickets: "35",
    battingSR: "88.2",
    bowlingEconomy: "8.1",
    bestScore: "7",
    bestBowling: "4/25"
  },
  "16": {
    totalRuns: "452",
    totalWickets: "6",
    battingSR: "145.2",
    bowlingEconomy: "8.4",
    bestScore: "100",
    bestBowling: "1/15"
  },
  "17": {
    totalRuns: "1,546",
    totalWickets: "180",
    battingSR: "159.2",
    bowlingEconomy: "6.7",
    bestScore: "85",
    bestBowling: "4/19"
  },
  "18": {
    totalRuns: "10",
    totalWickets: "21",
    battingSR: "76.4",
    bowlingEconomy: "7.7",
    bestScore: "4",
    bestBowling: "3/15"
  },
  "19": {
    totalRuns: "329",
    totalWickets: "0",
    battingSR: "158.4",
    bowlingEconomy: "0.0",
    bestScore: "102",
    bestBowling: "N/A"
  },
  "20": {
    totalRuns: "942",
    totalWickets: "0",
    battingSR: "165.2",
    bowlingEconomy: "0.0",
    bestScore: "81",
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
