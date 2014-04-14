#from geojsontosvg import transform_to_json
from collections import OrderedDict
import csv
import json
import requests
import time
from collections import defaultdict
def load_matrices():
    reader = csv.reader(open('final_2000.csv', 'rU'), delimiter=',')
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
        
    f = open("name_to_code_2000.json",'w')
    f.write(json.dumps(name_to_code))
    f.close()

    reversed_matrix = defaultdict(lambda: {})
    for fro in matrix :
        for to in matrix[fro]:
            reversed_matrix[to][fro]=matrix[fro][to]
    return matrix, reversed_matrix,code_to_name
height = 700
width=1200
def lolatoxy(point):
    lo = point[0]
    la = point[1]
    x = (lo+180) * (float(width) / 360.0)
    y = (180 - (la+90)) *  (float(height) / 180.0)
    return int(x),int(y)

def transform_to_json():
    world = json.loads(open("world.json").read())

    features= world["features"]
    res = {}
    for feature in features :
        path_list = []
        multipolygon= feature["geometry"]["coordinates"]
        for polygon in multipolygon:
            for path in polygon:
                svgpath ="M %s %s " % lolatoxy(path[0])
                for point in path[1:-1]:
                    svgpath += "L %s %s " % lolatoxy(point)
                svgpath += "Z"
                path_list.append(svgpath)
        res[feature["properties"]["name"]]=path_list


    #print res
    f = open("world_svg_paths.json",'w')
    f.write(json.dumps(res))
    f.close()
    return res
res = transform_to_json()
matrix, reversed_matrix,csv_code_to_name = load_matrices()

from_csv = csv_code_to_name.values()
from_json = res.keys()

#print len(from_csv),from_csv
from_csv = [unicode(name,errors='ignore') for name in from_csv]

unmapped_csv_stats = sorted(list(set(from_csv) - set(from_json)))

csv_name_to_code=OrderedDict()
for code in csv_code_to_name:
    csv_name_to_code[unicode(csv_code_to_name[code],errors="ignore")]=code
print "name_to_code keys", sorted(csv_name_to_code.keys())
json_names = sorted(from_json)
import sys
#line = sys.stdin.readline()
res = OrderedDict()
entered_letter = ""
while unmapped_csv_stats:
    unmapped_stat = unmapped_csv_stats[0]
    print "Match for :", unmapped_stat , ("or beginning letter")
    i=1
    print "0 : not found"
    if entered_letter !="":
        show_list= filter(lambda x:x.lower().startswith(entered_letter),json_names)
    else:
        show_list = json_names
    for name in show_list :
        print  i, ":", name ,
        i+=1
    print 
    value = sys.stdin.readline()
    try:
        print "value ", value
        value=int(value)
        print "value entered" , value
        entered_letter=""
        if i==0:
            code = "NOTFOUND"
        else :
            print csv_name_to_code
            code= csv_name_to_code[unmapped_stat]
        res[code]=show_list[value-1]
        print "res"
        for r in res :
            print r, csv_code_to_name[r], res[r]
        print "-------------"
        f = open('reconciliation_2000.json','w')
        f.write(json.dumps(res))
        f.close()
        unmapped_csv_stats = unmapped_csv_stats[1:]
    except ValueError, e:
        print "the exception : ", type(e)
        entered_letter=value.strip()
        print "letter entered", entered_letter



#print code_to_name
#print line
