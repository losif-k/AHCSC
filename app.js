const crypto = require("crypto")
const path = require("path");
const fs = require("fs");
const axios = require('axios');
require("dotenv").config();
var scheduler = require('node-schedule');
const { prependListener } = require("process");
var rule = new scheduler.RecurrenceRule();
rule.hour = Number(process.env.HOUR);
rule.minute = Number(process.env.MINUTE);
rule.second = Number(process.env.SECOND);
rule.dayOfWeek = new scheduler.Range(Number(process.env.DAYOFWEEK_START), Number(process.env.DAYOFWEEK_END));

const ac_q = JSON.parse(fs.readFileSync('queue.json'));
const base_url = "https://senhcs.eduro.go.kr";
const endpoints = {
    "SEARCH_SCHOOL": "/school",
    "LOGIN_WITH_SCHOOL": "/loginwithschool",
    "CHECK_SECOND_PASSWORD": "/checkpw",
    "LOGIN_WITH_SECOND_PASSWORD": "/secondlogin",
    "SEND_SURVEY_RESULT": "/registerServey"
};

const payload = {
  "rspns01": "1",
  "rspns02": "1",
  "rspns03": null,
  "rspns04": null,
  "rspns05": null,
  "rspns06": null,
  "rspns07": "0",
  "rspns08": "0",
  "rspns09": "0",
  "rspns10": null,
  "rspns11": null,
  "rspns12": null,
  "rspns13": null,
  "rspns14": null,
  "rspns15": null,
  "rspns00": "Y",
  "deviceUuid": ""
}

const encryptWithPublicKey = function (plainText, publicKey) {
  const buffer = Buffer.from(plainText);
  return crypto.publicEncrypt( { key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING } , buffer);
}
const header = {
  "Accept": "applicaton/json, text/plain, */*",
  "Content-Type": "application/json; charset=UTF-8",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.8 Safari/537.36",
  "Referrer": "https://hcs.eduro.go.kr/"
};


function asc(arg0, arg1){
  let encrypted_bd = encryptWithPublicKey(arg1["bd"], process.env.PUBLIC_KEY).toString("base64"),
  encrypted_name = encryptWithPublicKey(arg0, process.env.PUBLIC_KEY).toString("base64"),
  encrypted_pass = encryptWithPublicKey(arg1["pass"], process.env.PUBLIC_KEY).toString("base64"),
  school = arg1["school"];
  axios.get(base_url + endpoints["SEARCH_SCHOOL"] + "?lctnScCode=01&schulCrseScCode=4&orgName="+encodeURI(arg1["school"])+"&currentPageNo=1") 
  .then((res) => {
    axios.post(base_url + endpoints["LOGIN_WITH_SCHOOL"], {
      birthday: encrypted_bd,
      name : encrypted_name,
      orgcode: res["data"]["schulList"][0]["orgCode"]
    }, 
    {
      headers: header
    })
    .then((res) => {
      var data = {
        orgname: res["data"]["orgname"],
        registerYmd: res["data"]["registerYmd"],
        name: res["data"]["name"],
        isHealthy: res["data"]["isHealthy"]
      }
      console.log(data)
      var header_ = header
      header_["Authorization"] = res["data"]["token"]
      axios.post(base_url + endpoints["CHECK_SECOND_PASSWORD"], {
      }, 
      {
        headers: header_
      })
      .then((res) => {
        console.log(res["data"])
        axios.post(base_url + endpoints["LOGIN_WITH_SECOND_PASSWORD"], {
          password: encrypted_pass
        }, 
        {
          headers: header_
        })
        .then((res) => {
          console.log(res["data"])
          axios.post(base_url + endpoints["SEND_SURVEY_RESULT"], 
            payload, 
            {
              headers: header_
            })
            .then((res) => {
              console.log(res["data"])
              console.log("\n==================================================================\n")
            })
            .catch((error) => {
              console.error(error);
            })
        })
        .catch((error) => {
          console.error(error)
        })
      })
      .catch((error) => {
        console.error(error)
      })

    })
    .catch((error) => {
      console.error(error)
    })
  })
  .catch((error) => {
    console.error(error)
  })
  
}
console.log("Scheduled time : "+ process.env.HOUR + ":" + process.env.MINUTE + " for week range of " + process.env.DAYOFWEEK_START + " - " + process.env.DAYOFWEEK_END )
var dailyJob = scheduler.scheduleJob(rule, function(){
  console.log("It's Time!!")
  var q_str = "";
  for (key of Object.keys(ac_q)){
    q_str += key + " "
  }
  console.log(new Date().toString() + "\n" + q_str)

  for (const i in Object.keys(ac_q)) {
    (function(x) {
      setTimeout(function() {
        asc(Object.keys(ac_q)[x], Object.values(ac_q)[x]);
      }, 1500*x);
    })(i);
  }
  console.log("next Invocation for this Job : ", dailyJob.nextInvocation())
});

