import json
import requests
import time
import os

# 要查找的用户ID列表
target_ids = [
    15,
    16,
    19,
    21,
    23,
    27,
    29,
    30,
    31,
    32,
    33,
    34,
    35,
    36,
    37,
    38,
    43,
    45,
    48,
    49,
    52,
    54,
    59,
    61,
    78,
    79,
    87,
    93,
    97,
    101,
    105,
    115,
    123,
    124,
    130,
    132,
    135,
    139,
    150,
    159,
    165,
    182,
    183,
    184,
    186,
    196,
    220,
    227,
    230,
    232,
    245,
    262,
    271,
    297,
    302,
    305,
    314,
    325,
    339,
    343,
    354,
    357,
    358,
    383,
    396,
    431,
    433,
    449,
    472,
    473,
    481,
    512,
    520,
    522,
    525,
    530,
    537,
    569,
    586,
    589,
    601,
    628,
    632,
    642,
    651,
    663,
    666,
    678,
    705,
    707,
    721,
    730,
    750,
    766,
    773,
    798,
    800,
    804,
    809,
    819,
    824,
    828,
    841,
    845,
    884,
    885,
    912,
    919,
    922,
    926,
    969,
    978,
    996,
    1002,
    1006,
    1017,
    1035,
    1047,
    1052,
    1062,
    1128,
    1174,
    1180,
    1186,
    1208,
    1219,
    1255,
    1298,
    1304,
    1325,
    1380,
    1382,
    1476,
    1495,
    1504,
    1522,
    1571,
    1597,
    1602,
    1651,
    1652,
    1658,
    1662,
    1665,
    1679,
    1702,
    1717,
    1755,
    1788,
    1917,
    2071,
    2092,
    2102,
    2108,
    2137,
    2145,
    2151,
    2158,
    2160,
    2197,
    2198,
    2206,
    2286,
    2298,
    2350,
    2361,
]

# 创建一个字典来存储用户ID到团队ID的映射

# 检查是否存在进度文件
progress_file = "../user_team_mapping.json"
user_to_team = {}

if os.path.exists(progress_file):
    with open(progress_file, "r", encoding="utf-8") as f:
        user_to_team = json.load(f)
    print(f"已加载现有进度，已处理 {len(user_to_team)} 个用户")

# 获取每个用户的团队ID
for user_id in target_ids:
    # 跳过已处理的用户ID
    if str(user_id) in map(str, user_to_team.keys()):
        continue

    try:
        response = requests.get(f"https://hgame.vidar.club/api/user/{user_id}/team")
        if response.status_code == 200:
            team_data = response.json()
            if team_data and len(team_data) > 0:
                user_to_team[user_id] = team_data[0]["id"]
                print(f"用户 {user_id} 的团队ID是 {team_data[0]['id']}")
                # 每处理一个用户就保存一次进度
                with open(progress_file, "w", encoding="utf-8") as f:
                    json.dump(user_to_team, f, ensure_ascii=False, indent=2)
        time.sleep(0.5)
    except KeyboardInterrupt:
        print("\n程序被中断，已保存当前进度")
        # 确保在中断时保存进度
        with open(progress_file, "w", encoding="utf-8") as f:
            json.dump(user_to_team, f, ensure_ascii=False, indent=2)
        break
    except Exception as e:
        print(f"获取用户 {user_id} 的团队信息时出错: {e}")

print(f"\n处理完成，共处理 {len(user_to_team)} 个用户")
# 将用户ID到团队ID的映射保存到文件
with open("../user_team_mapping.json", "w", encoding="utf-8") as f:
    json.dump(user_to_team, f, ensure_ascii=False, indent=2)
