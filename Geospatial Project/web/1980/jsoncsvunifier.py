#from parser import load_matrices
import csv
import json
import requests
import time
from collections import defaultdict
from collections import OrderedDict
def load_matrices():
    reader = csv.reader(open('final_1980.csv', 'rU'), delimiter=',')
    row = reader.next()
    state_codes  = row[2:]
    i=0
    matrix = {}
    code_to_name_temp = {}
    for row in reader:
        code_to_name_temp[row[1]]=row[0]
        matrix[row[1]]={}
        dict= matrix[row[1]]
        j=0
        for val in row[2:] :
            dict[state_codes[j]] = val
            j=j+1

        i=i+1

    name_to_code = {}
    for code in code_to_name_temp :
        name_to_code[code_to_name_temp[code]]=code
    sorted_names = sorted(name_to_code.keys())
    code_to_name = OrderedDict()
    for name in sorted_names:
        code_to_name[name_to_code[name]]=name
        
    f = open("name_to_code.json",'w')
    f.write(json.dumps(name_to_code))
    f.close()

    reversed_matrix = defaultdict(lambda: {})
    for fro in matrix :
        for to in matrix[fro]:
            reversed_matrix[to][fro]=matrix[fro][to]
    return matrix, reversed_matrix,code_to_name
matrix, reversed_matrix, code_to_name = load_matrices()
name_to_code = {}
for code in code_to_name :
    name_to_code[code_to_name[code]]=code

world_svg_paths = json.loads(open("world_svg_paths.json").read())

reconciliation= json.loads(open("reconciliation.json").read())


for code in reconciliation:
    name_to_code[reconciliation[code]]= code

world_svg_paths_by_code = {}
for country in world_svg_paths:
    code = name_to_code.get(country,None)
    if not  code:
        print country, code
    else :
        world_svg_paths_by_code[code]=world_svg_paths[country]

f = open('world_svg_paths_by_code.json','w')
f.write(json.dumps(world_svg_paths_by_code))
f.close()
