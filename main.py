import json
import sys
import time
from datetime import datetime

from bs4 import BeautifulSoup
from pyvirtualdisplay import Display
from selenium import common, webdriver
from selenium.common.exceptions import UnexpectedAlertPresentException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select

run = False
if sys.argv.__len__() > 1:
    scheduled_time = sys.argv[1]
else:
    scheduled_time = datetime.now().strftime('%H%M')
display: Display.display

chrome_options = Options()
chrome_options.add_argument("--incognito")
chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])

q: dict
q_str = ''


def cvd():
    global q_str
    for key, value in q.items():
        while True:
            try:
                driver = webdriver.Chrome(options=chrome_options)
                driver.get('https://hcs.eduro.go.kr/#/loginHome')
                driver.find_element_by_id('btnConfirm2').click()
                driver.find_element_by_class_name('searchBtn').click()
                Select(driver.find_elements_by_tag_name('select')[0]).select_by_visible_text(value['office'])
                Select(driver.find_elements_by_tag_name('select')[1]).select_by_visible_text(value['schoolType'])
                driver.find_element_by_class_name('searchArea').send_keys(value['schoolNm'])
                driver.find_element_by_class_name('searchArea').send_keys(Keys.ENTER)
                time.sleep(0.5)
                driver.execute_script('document.getElementsByTagName("LI")[10].click()')
                time.sleep(0.5)
                driver.find_element_by_class_name('layerFullBtn').click()
                driver.find_elements_by_class_name('input_text_common')[1].send_keys(key)
                driver.find_elements_by_class_name('input_text_common')[2].send_keys(value['dob'])
                driver.find_element_by_id('btnConfirm').click()
                time.sleep(0.5)
                driver.find_elements_by_tag_name('input')[0].send_keys(value['pass'])
                time.sleep(0.5)
                driver.find_elements_by_tag_name('input')[1].click()
                time.sleep(1)
                driver.execute_script('document.getElementsByTagName("a")[5].click()')
                time.sleep(2)
                driver.execute_script('document.getElementById("survey_q1a1").click()')
                driver.execute_script('document.getElementById("survey_q2a1").click()')
                driver.execute_script('document.getElementById("survey_q3a1").click()')
                driver.execute_script('document.getElementById("survey_q4a1").click()')
                driver.execute_script('document.getElementById("survey_q5a1").click()')
                driver.execute_script('document.getElementById("btnConfirm").click()')
                time.sleep(0.5)
                print(driver.find_elements_by_tag_name('span')[6].text + f' | {key}')
            except UnexpectedAlertPresentException as e:
                if '마지막 설문결과 3분후 재설문이 가능합니다.' in str(e.alert_text):
                    print(f'마지막 설문을 3분전이내에 하여 아직 자가진단을 할 수 없습니다. | {key}')
                    q_str = q_str.replace(f'{key} ', '')
                    driver.close()
                    break
                elif '클라이언트' in str(e.alert_text):
                    driver.close()
                else:
                    print(f"알림 메세지가 열려 자동 자가진단이 중지 되었습니다. | {key}\n 알림 내용 : {str(e.alert_text)}")
                    q_str = q_str.replace(f'{key} ', '')
                    driver.close()
                    break
            except KeyboardInterrupt:
                driver.close()
                if sys.platform != 'win32':
                    display.stop()
            else:
                driver.close()
                break

    print(f"\n{datetime.now().strftime('%y/%m/%d %H:%M:%S')} : {datetime.now().strftime('%y/%m/%d')} 일자 자동 자가진단 완료\n{q_str}\n")

while True:
    now = datetime.now().strftime('%H%M')
    weekend = datetime.today().weekday() >= 5
    if now == scheduled_time and not weekend:
        if sys.platform != 'win32':
            display = Display(visible=0, size=(1024, 768))
            display.start()
        with open('queue.json', 'r', encoding='UTF8') as f:
            q = json.load(f)
            for i in q:
                q_str += f'{i} '
        print(
            f"\n{datetime.now().strftime('%y/%m/%d %H:%M:%S')} : {datetime.now().strftime('%y/%m/%d')} 일자 자동 자가진단 실행\n{q_str}\n")
        cvd()
        if sys.platform != 'win32':
            display.stop()
    time.sleep(60)
