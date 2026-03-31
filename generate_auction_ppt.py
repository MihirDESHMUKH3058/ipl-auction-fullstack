import json
import os
import re
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN

def extract_mock_stats(file_path):
    if not os.path.exists(file_path):
        return {}
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex to find the mockPlayerStats object
    match = re.search(r'export const mockPlayerStats = ({[\s\S]*?});', content)
    if not match:
        return {}
    
    # Convert JS object syntax to valid JSON (remove quotes from keys, etc.)
    # This is a bit hacky but works for this specific structure
    js_obj = match.group(1)
    # Wrap keys in quotes if they aren't
    json_str = re.sub(r'(\s)(\w+):', r'\1"\2":', js_obj)
    # Remove trailing commas
    json_str = re.sub(r',\s*}', '}', json_str)
    
    try:
        return json.loads(json_str)
    except Exception as e:
        print(f"Error parsing mock stats: {e}")
        return {}

def generate_ppt():
    # Paths
    players_json_path = 'client/public/players.json'
    mock_stats_path = 'client/src/mockStats.js'
    images_dir = 'client/public/players'
    output_path = 'Auction_Presentation.pptx'

    # Load player data
    with open(players_json_path, 'r', encoding='utf-8') as f:
        players = json.load(f)
    
    # Load mock stats
    stats_data = extract_mock_stats(mock_stats_path)

    # Initialize PPT
    prs = Presentation()

    # --- Slide 1: Welcome ---
    slide_layout = prs.slide_layouts[0]
    slide = prs.slides.add_slide(slide_layout)
    title = slide.shapes.title
    subtitle = slide.placeholders[1]
    
    title.text = "IPL AUCTION 2026"
    subtitle.text = "WELCOME TO THE PREMIER AUCTION EVENT\nCOLLEGE NAME: [ENTER COLLEGE NAME HERE]"

    # --- Slide 2: Rules ---
    slide_layout = prs.slide_layouts[1]
    slide = prs.slides.add_slide(slide_layout)
    title = slide.shapes.title
    title.text = "AUCTION RULES & GUIDELINES"
    
    content = slide.placeholders[1]
    tf = content.text_frame
    tf.text = "1. TOTAL PURSE: ₹120.00 Cr per team"
    p = tf.add_paragraph()
    p.text = "2. SQUAD SIZE: Minimum 18, Maximum 25 players"
    p = tf.add_paragraph()
    p.text = "3. OVERSEAS LIMIT: Maximum 8 players per squad"
    p = tf.add_paragraph()
    p.text = "4. MINIMUM SPEND: 75% of the total purse"
    p = tf.add_paragraph()
    p.text = "5. INCREMENTS: Standard IPL bidding increments apply"

    # --- Slides 3+: Individual Players (Limit to top 200 for size) ---
    for player in players[:200]:
        slide_layout = prs.slide_layouts[5] # Blank layout
        slide = prs.slides.add_slide(slide_layout)
        
        # Player Name Title
        title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.2), Inches(9), Inches(1))
        title_tf = title_box.text_frame
        title_tf.text = player['name'].upper()
        p = title_tf.paragraphs[0]
        p.font.size = Pt(44)
        p.font.bold = True
        p.alignment = PP_ALIGN.CENTER

        # Role & Info
        info_box = slide.shapes.add_textbox(Inches(0.5), Inches(1.2), Inches(5), Inches(1))
        info_tf = info_box.text_frame
        info_tf.text = f"Role: {player['role']} | {player['overseas']} ({player['country']})"
        p = info_tf.paragraphs[0]
        p.font.size = Pt(24)
        p.alignment = PP_ALIGN.LEFT

        # Image (if available)
        img_name = player.get('image_file')
        if not img_name:
            img_name = f"{player['id']}.png"
        
        img_path = os.path.join(images_dir, img_name)
        if os.path.exists(img_path):
            try:
                slide.shapes.add_picture(img_path, Inches(0.5), Inches(2.2), width=Inches(3.5))
            except Exception as e:
                print(f"Error adding image for {player['name']}: {e}")
        
        # Stats Table
        stats = stats_data.get(str(player['id']), {})
        
        # Determine Profile from actual data
        batting_hand = player.get('batting_hand', 'N/A')
        bowling_style = player.get('bowling_style', 'N/A')
        
        rows = 7
        cols = 2
        left = Inches(4.5)
        top = Inches(2.2)
        width = Inches(5)
        height = Inches(3.5)
        
        table = slide.shapes.add_table(rows, cols, left, top, width, height).table
        
        def set_cell(row, label, value):
            table.cell(row, 0).text = label
            table.cell(row, 1).text = str(value)
            # Formatting
            for col in range(2):
                cell = table.cell(row, col)
                cell.text_frame.paragraphs[0].font.size = Pt(18)
                cell.text_frame.paragraphs[0].font.bold = (col == 0)
        
        set_cell(0, "Batting Style", batting_hand)
        set_cell(1, "Bowling Style", bowling_style)
        set_cell(2, "Total Runs", stats.get('totalRuns', 'N/A'))
        set_cell(3, "Total Wickets", stats.get('totalWickets', 'N/A'))
        set_cell(4, "Batting SR", stats.get('battingSR', 'N/A'))
        set_cell(5, "Bowling Econ", stats.get('bowlingEconomy', 'N/A'))
        set_cell(6, "Base Price", player['basePrice'])

    # Save
    prs.save(output_path)
    print(f"PowerPoint generated successfully: {output_path}")

if __name__ == "__main__":
    generate_ppt()
