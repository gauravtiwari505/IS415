#from parser import load_matrices
import requests
import json
from collections import OrderedDict
import csv
import json
import requests
import time
from collections import defaultdict
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
def getIndicator(indicator_code, file_name):
    matrix, reversed_matrix, code_to_name = load_matrices()
    f = open(file_name+"_1980.json","w")
    res ={}
    for country_code in code_to_name:
        print "http://api.worldbank.org/countries/%s/indicators/%s?per_page=10&date=1990:1990&format=json" % (country_code,indicator_code)
        r = requests.get("http://api.worldbank.org/countries/%s/indicators/%s?per_page=10&date=1990:1990&format=json" % (country_code,indicator_code))
        print r.content
        try :
            print country_code
            content=json.loads(r.content)
            res[country_code]= content[1][0]["value"]
            print res[country_code]
        except Exception, e:
            print e
        #print res[code]

    f.write(json.dumps(res))
    f.close()


getIndicator("SH.TBS.INCD","TUBERCULOSIS")
getIndicator("SH.DYN.AIDS.ZS","HIV")
getIndicator("SH.DYN.MORT","UNDER-FIVE-MORTALITY")
getIndicator("SP.POP.TOTL","POP")
getIndicator("NY.GDP.PCAP.CD","GDP")

