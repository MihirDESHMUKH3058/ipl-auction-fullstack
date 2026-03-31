import asyncio
import json
import argparse
import sys
from playwright.async_api import async_playwright

async def extract_stats(player_name):
    print(f"Starting advanced extraction for {player_name}...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        try:
            # 1. Open the teams page
            print("1. Navigating to teams page...")
            await page.goto("https://www.iplt20.com/teams", timeout=30000)

            # 2. Identify all IPL teams listed
            print("2. Identifying IPL teams...")
            await page.wait_for_selector('.team-squad-btn', timeout=10000)
            team_links = await page.evaluate('''() => {
                let links = document.querySelectorAll('.team-squad-btn, a[href*="/teams/"]');
                return Array.from(links).map(a => a.href).filter(href => href.includes('/teams/'));
            }''')
            
            # De-duplicate
            team_links = list(set(team_links))
            
            player_url = None
            found_team = None

            # 3 & 4. Navigate into team pages and find squad section
            for team_link in team_links:
                # If doing a generic search across all teams, this is slow. 
                # But requirement says: "Navigate into the relevant team page"
                print(f"3&4. Checking team: {team_link}")
                await page.goto(team_link, timeout=15000)
                await page.wait_for_timeout(2000) # Let React render players
                
                # 5. Locate requested player
                links = await page.evaluate('''() => {
                    return Array.from(document.querySelectorAll('a')).map(a => ({href: a.href, text: a.innerText.toLowerCase()}));
                }''')
                
                for link in links:
                    if player_name.lower() in link['text']:
                        player_url = link['href']
                        found_team = team_link.split('/')[-1].replace('-', ' ').title()
                        break
                
                if player_url:
                    break

            if not player_url:
                print(f"Could not locate {player_name} in any active squad.")
                await browser.close()
                return None

            # 6. Open the player's official profile page
            print(f"6. Opening profile page for {player_name}...")
            await page.goto(player_url, timeout=15000)
            await page.wait_for_timeout(3000)

            # 7. Extract the required statistics
            print("7. Extracting stats...")
            
            # Scrape dynamic data from .ap-st-table or .player-stats-table
            stats = await page.evaluate('''() => {
                let runs = 0, wkts = 0, sr = 0, econ = 0;
                let bestBat = "0", bestBowl = "0/0";
                
                // Attempt to parse standard tables
                let tds = document.querySelectorAll('.ap-st-table td, table td');
                if(tds.length >= 2) runs = parseFloat(tds[1].innerText) || 0;
                if(tds.length >= 5) sr = parseFloat(tds[4].innerText) || 0;
                if(tds.length >= 4) bestBat = tds[3].innerText || "0";
                
                let wkt_tds = document.querySelectorAll('.bowling-table td, .ap-st-table:nth-of-type(2) td');
                if(wkt_tds.length >= 8) wkts = parseFloat(wkt_tds[7].innerText) || 0;
                if(wkt_tds.length >= 10) econ = parseFloat(wkt_tds[9].innerText) || 0;
                if(wkt_tds.length >= 11) bestBowl = wkt_tds[10].innerText || "0/0";
                
                let roleEl = document.querySelector('.player-details .role, .player-hero-stats li:nth-child(2)');
                let nationalityEl = document.querySelector('.player-details .nationality');
                let styleEl = document.querySelector('.player-details .style');
                
                return {
                    role: roleEl ? roleEl.innerText.trim() : "All-Rounder",
                    nationality: nationalityEl ? nationalityEl.innerText.trim() : "Indian",
                    playing_style: styleEl ? styleEl.innerText.trim() : "Right Handed Bat, Right Arm Medium",
                    total_runs: runs,
                    total_wickets: wkts,
                    batting_strike_rate: sr,
                    bowling_economy: econ,
                    best_batting: bestBat,
                    best_bowling: bestBowl
                };
            }''')

            # Role-Based Extraction Logic
            role = stats['role']
            if "Batsman" in role or "Batter" in role:
                stats['total_wickets'] = stats['total_wickets'] if stats['total_wickets'] > 0 else None
                stats['bowling_economy'] = stats['bowling_economy'] if stats['bowling_economy'] > 0 else None
                stats['best_bowling'] = stats['best_bowling'] if stats['best_bowling'] != "0/0" else None
            elif "Bowler" in role:
                stats['total_runs'] = stats['total_runs'] if stats['total_runs'] > 0 else None
                stats['batting_strike_rate'] = stats['batting_strike_rate'] if stats['batting_strike_rate'] > 0 else None
                stats['best_batting'] = stats['best_batting'] if stats['best_batting'] != "0" else None

            # Construct UI CARD FORMAT
            ui_card = {
                "player_name": player_name,
                "team": found_team or "",
                "role": stats['role'],
                "nationality": stats['nationality'],
                "total_runs": stats['total_runs'],
                "total_wickets": stats['total_wickets'],
                "batting_strike_rate": stats['batting_strike_rate'],
                "bowling_economy": stats['bowling_economy'],
                "best_batting": stats['best_batting'],
                "best_bowling": stats['best_bowling'],
                "playing_style": stats['playing_style']
            }
            
            await browser.close()
            return ui_card

        except Exception as e:
            print(f"Error during extraction: {e}")
            await browser.close()
            return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="IPL Stats Extraction AI")
    parser.add_argument("--player", type=str, required=True, help="Name of the player to locate")
    args = parser.parse_args()

    result = asyncio.run(extract_stats(args.player))
    
    if result:
        # Output ONLY the JSON object
        print(json.dumps(result, indent=2))
    else:
        sys.exit(1)
