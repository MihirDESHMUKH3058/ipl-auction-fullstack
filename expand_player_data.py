import json
import random
import os

def expand_data():
    players_path = 'client/public/players.json'
    mock_stats_path = 'client/src/mockStats.js'
    
    if not os.path.exists(players_path):
        print(f"Error: {players_path} not found.")
        return

    with open(players_path, 'r', encoding='utf-8') as f:
        players = json.load(f)

    # Deterministic generation for consistency
    random.seed(42)

    updated_players = []
    all_mock_stats = {}

    roles = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper']
    batting_hands = ['Right Handed', 'Left Handed']
    bowling_styles_fast = ['Right Arm Fast', 'Right Arm Fast-Medium', 'Left Arm Fast', 'Left Arm Fast-Medium']
    bowling_styles_spin = ['Right Arm Off-Break', 'Right Arm Leg-Break', 'Left Arm Orthodox', 'Left Arm Chinaman']

    for player in players:
        role = player.get('role', 'All-Rounder')
        
        # 1. Assign Handedness & Style
        # Weighted random: 80% Right Handed
        batting_hand = random.choices(batting_hands, weights=[80, 20])[0]
        
        if 'Bowler' in role or 'All-Rounder' in role:
            if random.random() > 0.5:
                bowling_style = random.choice(bowling_styles_fast)
            else:
                bowling_style = random.choice(bowling_styles_spin)
        else:
            bowling_style = "Occasional " + random.choice(['Off-Break', 'Medium'])

        player['batting_hand'] = batting_hand
        player['bowling_style'] = bowling_style
        updated_players.append(player)

        # 2. Generate Statistics
        runs = 0
        wickets = 0
        sr = 0.0
        econ = 0.0
        best_score = "0"
        best_bowling = "0/0"

        rating = player.get('rating', 5)

        if 'Batsman' in role or 'Wicket-Keeper' in role:
            runs = random.randint(500 * rating, 1000 * rating)
            sr = round(random.uniform(125.0, 155.0), 1)
            best_score = str(random.randint(40, 120))
            if random.random() > 0.8: best_score += "*"
            wickets = random.randint(0, 10)
            econ = round(random.uniform(7.5, 9.5), 1)
        elif 'Bowler' in role:
            runs = random.randint(10 * rating, 100 * rating)
            sr = round(random.uniform(80.0, 120.0), 1)
            best_score = str(random.randint(5, 30))
            wickets = random.randint(20 * rating, 40 * rating)
            econ = round(random.uniform(6.5, 8.5), 1)
            # Standard bowling figures (wickets/runs)
            best_bowling = f"{random.randint(3, 6)}/{random.randint(10, 40)}"
        else: # All-Rounder
            runs = random.randint(300 * rating, 600 * rating)
            sr = round(random.uniform(130.0, 150.0), 1)
            best_score = str(random.randint(30, 90))
            if random.random() > 0.7: best_score += "*"
            wickets = random.randint(10 * rating, 25 * rating)
            econ = round(random.uniform(7.0, 9.0), 1)
            best_bowling = f"{random.randint(2, 5)}/{random.randint(15, 35)}"

        all_mock_stats[str(player['id'])] = {
            "totalRuns": f"{runs:,}",
            "totalWickets": str(wickets),
            "battingSR": str(sr),
            "bowlingEconomy": str(econ),
            "bestScore": best_score,
            "bestBowling": best_bowling if wickets > 0 else "N/A"
        }

    # Save Updated Players JSON
    with open(players_path, 'w', encoding='utf-8') as f:
        json.dump(updated_players, f, indent=2, ensure_ascii=False)

    # Save Updated Stats JS
    stats_header = "// Automatically generated statistics for all players.\n\nexport const mockPlayerStats = "
    stats_footer = ";\n\nexport const getPlayerStats = (playerId) => {\n  return mockPlayerStats[playerId.toString()] || {\n    totalRuns: \"N/A\",\n    totalWickets: \"N/A\",\n    battingSR: \"N/A\",\n    bowlingEconomy: \"N/A\",\n    bestScore: \"N/A\",\n    bestBowling: \"N/A\"\n  };\n};\n"
    
    with open(mock_stats_path, 'w', encoding='utf-8') as f:
        f.write(stats_header)
        json.dump(all_mock_stats, f, indent=2)
        f.write(stats_footer)

    print(f"Successfully updated {len(updated_players)} players in players.json and mockStats.js")

if __name__ == "__main__":
    expand_data()
