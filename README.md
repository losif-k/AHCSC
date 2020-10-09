# AHCSC
### Auto Health Condition Self-Check
### 자동 건강상태 자가진단 매크로
* Unversioned files
  * .env
    * required fields
      * PUBLIC_KEY : PKCS#8 formatted public key
      * HOUR : Hour for node-schedule
      * MINUTE : Minute for node-schedule
      * SECOND : Second for node-schedule
      * DAYOFWEEK_START : Start day of week for node-schedule
      * DAYOFWEEK_END : End day of week for node-schedule
  * queue.json 
    * key
      * name
    * value : json(Object)
      * lctnScCode : Location Code
        * 01 : Seoul(서울특별시)
        * 02 : Busan(부산광역시)
        * 03 : Daegu(대구광역시)
        * 04 : Incheon(인천광역시)
        * 05 : Gwangju(광주광역시)
        * 06 : Daejeon(대전광역시)
        * 07 : Ulsan(울산광역시)
        * 08 : Sejong City(세종특별자치시)
        * 10 : Gyeonggi-do(경기도)
        * 11 : Gangwon-do(강원도)
        * 12 : Chungcheongbuk-do(충청북도)
        * 13 : Chungcheongnam-do(충청남도)
        * 14 : Jeollabuk-do(전라북도)
        * 15 : Jeollanam-do(전라남도)
        * 16 : Gyeongsangbuk-do(경상북도)
        * 17 : Gyeongsangnam-do(경상남도)
        * 18 : Jeju-do(제주특별자치도)
      * schulCrseScCode : Type of school
        * 1 : Pre-school(유치원)
        * 2 : Elementary school(초등학교)
        * 3 : Middle school(중학교)
        * 4 : High school(고등학교)
        * 5 : Special School(특수학교)
      * orgName : School Name
      * birthday : Birth date
      * password : 4-digit password

