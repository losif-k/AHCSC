import requests
import json
import sys
from datetime import datetime
import time

headers = {
  "Accept": "applicaton/json, text/plain, */*",
  "Content-Type": "application/json; charset=UTF-8",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.8 Safari/537.36",
  "Referrer": "https://hcs.eduro.go.kr/"
}
url = "https://senhcs.eduro.go.kr"
endpoints = {
    "LOGIN_WITH_SCHOOL": "/loginwithschool",
    "CHECK_SECOND_PASSWORD": "/checkpw",
    "LOGIN_WITH_SECOND_PASSWORD": "/secondlogin",
    "SEND_SURVEY_RESULT": "/registerServey"
}


payload = {
    "rspns01": "1",
    "rspns02": "1",
    "rspns03": None,
    "rspns04": None,
    "rspns05": None,
    "rspns06": None,
    "rspns07": "0",
    "rspns08": "0",
    "rspns09": "0",
    "rspns10": None,
    "rspns11": None,
    "rspns12": None,
    "rspns13": None,
    "rspns14": None,
    "rspns15": None,
    "rspns00": "Y",
    "deviceUuid": ""
}
q_str = ''
sch_time = datetime.now().strftime('%H%M')
if sys.argv.__len__() > 1:
    if sys.argv[1].isdigit() and sys.argv[1].__len__() == 4:
        sch_time = sys.argv[1]
print(sch_time)


def cvd():
    global q_str
    with open('queue.json', 'r', encoding='UTF8') as f:
        q = json.load(f)
        for s in q.keys():
            q_str += s + ' '
    for key, value in q.items():
        response = json.loads(requests.post(url + endpoints['LOGIN_WITH_SCHOOL'], data=json.dumps({"birthday": value["birthday"], "name": value["name"], "orgcode": value["orgcode"]}), headers=headers).content)
        headers["Authorization"] = response["token"]
        requests.post(url + endpoints['CHECK_SECOND_PASSWORD'], data="{}", headers=headers)
        requests.post(url + endpoints['LOGIN_WITH_SECOND_PASSWORD'], data=json.dumps({"password": value["password"]}), headers=headers)
        response = json.loads(requests.post(url + endpoints['SEND_SURVEY_RESULT'], data=json.dumps(payload), headers=headers).content)
        print(f'\n{response["registerDtm"]} : {response["inveYmd"]} 일자 완료 - {key}')
    print(f"\n{datetime.now().strftime('%y/%m/%d %H:%M:%S')} : {datetime.now().strftime('%y/%m/%d')} 일자 자동 자가진단 완료\n{q_str}\n")
    


while True:
    now = datetime.now().strftime('%H%M')
    weekend = datetime.today().weekday() >= 5
    if now == sch_time and not weekend:
        print(f"\n{datetime.now().strftime('%y/%m/%d %H:%M:%S')} : {datetime.now().strftime('%y/%m/%d')} 일자 자동 자가진단 실행 \n{q_str}\n")
        cvd()
    time.sleep(60)