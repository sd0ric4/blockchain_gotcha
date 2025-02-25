import json

# 读取user_team_mapping.json获取团队ID列表
with open("../user_team_mapping.json", "r", encoding="utf-8") as f:
    user_team_mapping = json.load(f)
    team_ids = set(user_team_mapping.values())

# 读取team.json
with open("../team.json", "r", encoding="utf-8") as f:
    team_data = json.load(f)

# 提取匹配的团队信息
target_teams = []
for team in team_data[0]:
    if team["id"] in team_ids:
        target_teams.append(team)

# 检查是否有缺失的团队ID
found_team_ids = {team["id"] for team in target_teams}
missing_team_ids = team_ids - found_team_ids
if missing_team_ids:
    print(f"\n缺失的团队ID ({len(missing_team_ids)}个):")
    print(sorted(list(missing_team_ids)))

# 将结果保存到文件
with open("../target_teams.json", "w", encoding="utf-8") as f:
    json.dump(target_teams, f, ensure_ascii=False, indent=2)

print(f"\n目标团队ID总数: {len(team_ids)}")
print(f"已找到团队数: {len(target_teams)}")
print(f"已提取团队信息到 target_teams.json")
