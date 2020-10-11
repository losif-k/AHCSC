const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
require("dotenv").config();
var scheduler = require("node-schedule");
var date_ob = new Date();
var rule = new scheduler.RecurrenceRule();
rule.hour = Number(process.env.HOUR);
rule.minute = Number(process.env.MINUTE);
rule.second = Number(process.env.SECOND);
rule.dayOfWeek = new scheduler.Range(
  Number(process.env.DAYOFWEEK_START),
  Number(process.env.DAYOFWEEK_END)
);

const base_url = "https://senhcs.eduro.go.kr";
const endpoints = {
  SEARCH_SCHOOL: "/school",
  LOGIN_WITH_SCHOOL: "/loginwithschool",
  CHECK_SECOND_PASSWORD: "/checkpw",
  LOGIN_WITH_SECOND_PASSWORD: "/secondlogin",
  SEND_SURVEY_RESULT: "/registerServey",
};

const payload = {
  rspns01: "1",
  rspns02: "1",
  rspns03: null,
  rspns04: null,
  rspns05: null,
  rspns06: null,
  rspns07: "0",
  rspns08: "0",
  rspns09: "0",
  rspns10: null,
  rspns11: null,
  rspns12: null,
  rspns13: null,
  rspns14: null,
  rspns15: null,
  rspns00: "Y",
  deviceUuid: "",
};

const encryptWithPublicKey = function (plainText, publicKey) {
  const buffer = Buffer.from(plainText);
  return crypto.publicEncrypt(
    { key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
    buffer
  );
};
const header = {
  Accept: "applicaton/json, text/plain, */*",
  "Content-Type": "application/json; charset=UTF-8",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.8 Safari/537.36",
  Referrer: "https://hcs.eduro.go.kr/",
};

function asc(ac_q, index, done) {
  var name = Object.keys(ac_q).sort()[index];
  axios
    .get(
      base_url +
        endpoints["SEARCH_SCHOOL"] +
        `?lctnScCode=${ac_q[name]["lctnScCode"]}&schulCrseScCode=${
          ac_q[name]["schulCrseScCode"]
        }&orgName=${encodeURI(ac_q[name]["orgName"])}&currentPageNo=1`
    )
    .then((res) => {
      axios
        .post(
          base_url + endpoints["LOGIN_WITH_SCHOOL"],
          {
            birthday: encryptWithPublicKey(
              ac_q[name]["birthday"],
              process.env.PUBLIC_KEY
            ).toString("base64"),
            name: encryptWithPublicKey(name, process.env.PUBLIC_KEY).toString(
              "base64"
            ),
            orgcode: res["data"]["schulList"][0]["orgCode"],
          },
          {
            headers: header,
          }
        )
        .then((res) => {
          var data = {
            orgname: res["data"]["orgname"],
            name: res["data"]["name"],
            isHealthy: res["data"]["isHealthy"],
          };
          console.log(data);
          if (data["isHealthy"]) {
            done.push(name);
            console.log(
              "=================================================================="
            );
            if (index + 1 == Object.keys(ac_q).length) {
              console.log("DONE : ", done.join(", "));
            } else {
              asc(ac_q, index + 1, done);
            }
            return;
          }
          var header_ = header;
          header_["Authorization"] = res["data"]["token"];
          axios
            .post(
              base_url + endpoints["CHECK_SECOND_PASSWORD"],
              {},
              {
                headers: header_,
              }
            )
            .then((res) => {
              axios
                .post(
                  base_url + endpoints["LOGIN_WITH_SECOND_PASSWORD"],
                  {
                    password: encryptWithPublicKey(
                      ac_q[name]["password"],
                      process.env.PUBLIC_KEY
                    ).toString("base64"),
                  },
                  {
                    headers: header_,
                  }
                )
                .then((res) => {
                  if (res["data"]["isError"]) {
                    console.log({
                      isError: true,
                      failCnt: res["data"]["data"]["failCnt"],
                    });
                    console.log(
                      "=================================================================="
                    );
                    if (index + 1 == Object.keys(ac_q).length) {
                      console.log("DONE : ", done.join(", "));
                    } else {
                      asc(ac_q, index + 1, done);
                    }
                    return;
                  }
                  axios
                    .post(base_url + endpoints["SEND_SURVEY_RESULT"], payload, {
                      headers: header_,
                    })
                    .then((res) => {
                      console.log({ registerDtm: res["data"]["registerDtm"] });
                      console.log(
                        "=================================================================="
                      );
                      done.push(name);
                      if (index + 1 == Object.keys(ac_q).length) {
                        console.log("DONE : ", done.join(", "));
                      } else {
                        asc(ac_q, index + 1, done);
                      }
                    });
                });
            });
        });
    });
}
if (Number(process.env.TEST) == 1) {
  console.log("Testing!!");
  rule.hour = Number(date_ob.getHours());
  rule.minute = Number(date_ob.getMinutes());
  rule.second = Number(date_ob.getSeconds() + 1);
  rule.dayOfWeek = new scheduler.Range(0, 6);
} else {
  console.log(
    "Scheduled time : " +
      process.env.HOUR +
      ":" +
      process.env.MINUTE +
      " for week range of " +
      process.env.DAYOFWEEK_START +
      " ~ " +
      process.env.DAYOFWEEK_END
  );
}

var dailyJob = scheduler.scheduleJob(rule, function () {
  var ac_q = JSON.parse(fs.readFileSync("queue.json"));
  var q_arr = [];
  for (key of Object.keys(ac_q).sort()) {
    q_arr.push(key);
  }
  console.log(
    "Queue Loaded [" + new Date().toString() + "]\nQueue : " + q_arr.join(", ")
  );
  asc(ac_q, 0, []);
});
