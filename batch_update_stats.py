import asyncio
import json
import os
import re
from ai_cricket_scraper import extract_stats

async def update_all_players():
    players_path = os.path.join('client', 'public', 'players.json')
    mock_stats_path = os.path.join('client', 'src', 'mockStats.js')
    
    with open(players_path, 'r', encoding='utf-8') as f:
        players = json.load(f)

    print("=====================================================")
    print("STARTING IPL BATCH INTEGRATION")
    print("Goal: Sync real stats from iplt20.com to Dashboard UI")
    print("=====================================================")
    
    # Load existing mockStats
    with open(mock_stats_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = re.search(r'export const mockPlayerStats = ({[\s\S]*?});', content)
    current_stats = {}
    if match:
        js_obj = match.group(1)
        json_str = re.sub(r'(\s)(\w+):', r'\1"\2":', js_obj)
        json_str = re.sub(r',\s*}', '}', json_str)
        try:
            current_stats = json.loads(json_str)
        except Exception:
            pass

    def save_progress():
        stats_header = "// REAL STATS FROM AI SCRAPER (UI CARD FORMAT)\n\nexport const mockPlayerStats = "
        stats_footer = ";\n\nexport const getPlayerStats = (playerId) => {\n  return mockPlayerStats[playerId.toString()] || {\n    totalRuns: \"0\",\n    totalWickets: \"0\",\n    battingSR: \"N/A\",\n    bowlingEconomy: \"N/A\",\n    bestScore: \"0\",\n    bestBowling: \"0/0\"\n  };\n};\n"
        
        with open(mock_stats_path, 'w', encoding='utf-8') as f:
            f.write(stats_header)
            json.dump(current_stats, f, indent=2)
            f.write(stats_footer)

    # Note: Only trying the first 3 for demonstration (otherwise it takes 6 hours to finish)
    # The user can edit [0:3] to process the whole array locally overnight.
    demo_players = players[0:3]
    
    for count, player in enumerate(demo_players):
        pid = str(player['id'])
        player_name = player.get('name')
        
        print(f"[{count+1}/{len(demo_players)}] Parsing {player_name} via AI Scraper...", flush=True)
        
        result = await extract_stats(player_name)
        
        if result:
            print(f"-> SUCCESS: {player_name} fetched!")
            # Convert dictionary into the specific `mockStats` schema
            current_stats[pid] = {
                "totalRuns": str(result.get("total_runs", "0")),
                "totalWickets": str(result.get("total_wickets", "0")),
                "battingSR": str(result.get("batting_strike_rate", "N/A")),
                "bowlingEconomy": str(result.get("bowling_economy", "N/A")),
                "bestScore": str(result.get("best_batting", "0")),
                "bestBowling": str(result.get("best_bowling", "0/0"))
            }
        else:
            print(f"-> NOT FOUND: {player_name} not in active team squads. Defaulting to empty.")
            current_stats[pid] = {
                "totalRuns": "0", "totalWickets": "0", 
                "battingSR": "N/A", "bowlingEconomy": "N/A", 
                "bestScore": "0", "bestBowling": "0/0"
            }
        
        save_progress()
        print("-> Progress Automatically Saved to mockStats.js!")

    print("=====================================================")
    print("DEMONSTRATION RUN COMPLETE. Script correctly saves API into UI format.")
    print("To run for all players, remove the '[0:3]' slice in batch_update_stats.py")
    print("=====================================================")

if __name__ == "__main__":
    asyncio.run(update_all_players())
