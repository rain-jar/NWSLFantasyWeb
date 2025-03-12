import json
#import supabase from sup

# Load Supabase Client
from supaBaseAdminClient import supabase

response = supabase.table("players_base").select("*").limit(1).execute()
print(response.data)

# Load Season Stats JSON
with open("../data-mgmt/playersbase-master.json", "r", encoding="utf-8") as f:
    players_data = json.load(f)

# Convert Data & Insert into Supabase
players_list = []
for player in players_data:
    players_list.append({
        "name": player["name"],
        "team": player["team"],
        "position": player["position"],
        "Minutes": int(player["Minutes"].replace(",", "")) if player["Minutes"] else 0,
        "goals": int(player["goals"]),
        "assists": int(player["assists"]),
        "PKMissed": int(player["PKMissed"]),
        "Goals Against": int(player["Goals Against"]),
        "Saves": int(player["Saves"]) ,
        "Clean Sheet": int(player["Clean Sheet"]),
        "Yellow Cards": int(player["Yellow Cards"]),
        "Red Cards": int(player["Red Cards"]), 
        "FantasyPoints" : int(player["FantasyPoints"]),
        "image_url": player["ImgURL"],
        "injuries": player["injuries"],
        "description":player["description"],
    })
    print(f"added : {player["name"]}")

# Insert into Supabase
response = supabase.table("players_base").insert(players_list).execute()

if response.data:  
    print("✅ Successfully uploaded season stats!")
else:
    print("❌ Error inserting players:", response)