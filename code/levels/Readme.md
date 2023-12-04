# Editing or creating new game levels

CHANGING ASSET IDS IN level.json WILL BREAK THE GAME!

Add your new level in levels (level.json)\
You can edit or checkout level0.json (the "menu" level) as example.

pos: int [0-29, 0-19] (x, y // 0, 0 located in the top left corner)\
height: int[0-19] (only for background)\
comment: not used by the program

id:\
1 Solid Block\
2 Block, vanishing if walked over\
3 Ladder\
4 Star to collect (10pts)\
5 Star to collect, vanishing after timer past (20pts)\
6 Enemy, must be placed on solid block, walks horizontally\
7 Smart Enemy, must be placed on solid block or ladder, also climbs ladders

The cannon will be added in the future.