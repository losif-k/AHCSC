const crypto = require('crypto')
const fs = require('fs')
const axios = require('axios')
axios.defaults.withCredentials = true
require('dotenv').config()
var scheduler = require('node-schedule')
var date_ob = new Date()
var rule = new scheduler.RecurrenceRule()
rule.hour = Number(process.env.HOUR)
rule.minute = Number(process.env.MINUTE)
rule.second = Number(process.env.SECOND)
rule.dayOfWeek = new scheduler.Range(
	Number(process.env.DAYOFWEEK_START),
	Number(process.env.DAYOFWEEK_END)
)


const base_url = 'https://senhcs.eduro.go.kr'
const endpoints = {
	SEARCH_SCHOOL: '/v2/searchSchool',
	FIND_USER: '/v2/findUser',
	HAS_PASSWORD: '/v2/hasPassword',
	LOGIN_WITH_SECOND_PASSWORD: '/v2/validatePassword',
	SELECT_GROUP_LIST: '/v2/selectUserGroup',
	REFRESH_USER_INFO: '/v2/getUserInfo',
	SEND_SURVEY_RESULT: '/registerServey',
}

const payload = {
	deviceUuid: '',
	rspns00: 'Y',
	rspns01: '1',
	rspns02: '1',
	rspns03: null,
	rspns04: null,
	rspns05: null,
	rspns06: null,
	rspns07: null,
	rspns08: null,
	rspns09: '0',
	rspns10: null,
	rspns11: null,
	rspns12: null,
	rspns13: null,
	rspns14: null,
	rspns15: null
}

const encryptWithPublicKey = function (plainText, publicKey) {
	const buffer = Buffer.from(plainText)
	return crypto.publicEncrypt(
		{ key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
		buffer
	)
}
const headers = {
	Accept: 'applicaton/json, text/plain, */*',
	'Accept-Encoding': 'gzip, deflate, br',
	Connection: 'keep-alive',
	'Content-Type': 'application/json;',
	Referrer: 'https://senhcs.eduro.go.kr/',
	Host: 'senhcs.eduro.go.kr',
	Agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.183 Safari/537.36'
}

function discord_webhook(result) {
	if(!process.env.DISCORD_WEBHOOK_URL) {
		return
	}
	var result_ = Object.assign({}, result)
	var fields = []
	if(result_['mention']) {
		result_['Name'] = result['mention']
		delete result_['mention']
	}
	for (const [key, value] of Object.entries(result_)) {
		fields.push({name: key, value: value, inline: true})
	}
	axios.request(
		{
			url: process.env.DISCORD_WEBHOOK_URL,
			method: 'post',
			data: {
				content: '',
				embeds: [
					{
						title: 'Auto Health Codition Self Check',
						url: 'https://github.com/losifz/AHCSC',
						color: 5439232,
						fields: fields,
						author: {
							name: 'losif',
							url: 'http://losifz.com',
							icon_url: 'https://avatars1.githubusercontent.com/u/54474221?s=460&u=4528d15da4babf939a10038f17427b44483dbc0f&v=4'
						},
						footer: {
							text: 'losif',
							icon_url: 'https://avatars1.githubusercontent.com/u/54474221?s=460&u=4528d15da4babf939a10038f17427b44483dbc0f&v=4'
						},
						timestamp: new Date().toISOString()
					}
				],
			},
			headers: {
				'Content-Type': 'application/json;'
			}
		}
	).catch((err) => {
		if(err.response) {
			console.log(err.response.status)
		}
	})
}

function search_school(lctnScCode, schulCrseScCode, orgName) {
	return axios.request(
		{ url: base_url + endpoints.SEARCH_SCHOOL,
			method: 'get',
			params: {
				lctnScCode: lctnScCode,
				schulCrseScCode: schulCrseScCode,
				orgName: orgName,
				loginType: 'school',
			},
			headers: headers
		})
}

function find_user(atptOfcdcConctUrl, name, birthday, orgCode) {
	return axios.request(
		{ url: atptOfcdcConctUrl + endpoints.FIND_USER,
			method: 'post',
			data: {
				birthday: encryptWithPublicKey(birthday, process.env.PUBLIC_KEY).toString('base64'),
				loginType: 'school',
				name: encryptWithPublicKey(name, process.env.PUBLIC_KEY).toString('base64'),
				orgCode: orgCode,
				stdntPNo: null,	
			},
			headers: headers
		})
}

function has_password(atptOfcdcConctUrl, token) {
	var headers_ = headers
	headers_['Authorization'] = token
	return axios.request(
		{ url: atptOfcdcConctUrl + endpoints.HAS_PASSWORD,
			method: 'post',
			headers: headers_
		})
}

function login_with_second_password(atptOfcdcConctUrl, token, password) {
	var headers_ = headers
	headers_['Authorization'] = token
	return axios.request(
		{ url: atptOfcdcConctUrl + endpoints.LOGIN_WITH_SECOND_PASSWORD,
			method: 'post',
			data: {
				deviceUuid: '',
				password: encryptWithPublicKey(password, process.env.PUBLIC_KEY).toString('base64')
			},
			headers: headers_
		})
}	

function select_group_list(atptOfcdcConctUrl, token) {
	var headers_ = headers
	headers_['Authorization'] = token
	return axios.request(
		{ url: atptOfcdcConctUrl + endpoints.SELECT_GROUP_LIST,
			method: 'post',
			headers: headers_
		}
	)
}

function refresh_user_info(atptOfcdcConctUrl, token, orgCode, userPNo) {
	var headers_ = headers
	headers_['Authorization'] = token
	return axios.request(
		{ url: atptOfcdcConctUrl + endpoints.REFRESH_USER_INFO,
			method: 'post',
			data: {
				orgCode: orgCode,
				userPNo: userPNo
			},
			headers: headers_
		})
}

function send_survey_result(atptOfcdcConctUrl, token, userNameEncpt) {
	var headers_ = headers
	headers_['Authorization'] = token
	payload['upperToken'] = token
	payload['upperUserNameEncpt'] = userNameEncpt
	return axios.request(
		{ url: atptOfcdcConctUrl + endpoints.SEND_SURVEY_RESULT,
			method:'post',
			data: payload,
			headers: headers_
		})
}


function asc(ac_q, index, done) {
	var name = Object.keys(ac_q).sort()[index]
	var result = {}
	search_school(ac_q[name]['lctnScCode'], ac_q[name]['schulCrseScCode'], ac_q[name]['orgName'])
		.then((res) => {
			console.log("!!!!")
			if(res.data['schulList'].length > 0){
				result['School'] = res.data['schulList'][0]['engOrgNm']
				var atptOfcdcConctUrl = `https://${res.data['schulList'][0]['atptOfcdcConctUrl']}`
				find_user(atptOfcdcConctUrl, name, ac_q[name]['birthday'], res.data['schulList'][0]['orgCode']).then((res) => {
					console.log("!!!!")
					result['Name'] = res.data['userName']
					if(ac_q[name]['mention']) {
						result['mention'] = ac_q[name]['mention']
					}
					var token = res.data.token
					has_password(atptOfcdcConctUrl, token).then((res) => {
						console.log("!!!!")
						if (res.data) {
							login_with_second_password(atptOfcdcConctUrl, token, ac_q[name]['password']).then((res) => {
								console.log("!!!!")
								if (res.data) {
									token = res.data
									select_group_list(atptOfcdcConctUrl, token).then((res) => { //error
										console.log("!!!!")
										refresh_user_info(atptOfcdcConctUrl, token, res.data[0]['orgCode'], res.data[0]['userPNo']).then((res) => {
											console.log("!!!!")
											if(!res.data['isHealthy']){
												token = res.data.token
												send_survey_result(atptOfcdcConctUrl, token, res.data['userNameEncpt']).then((res) => {
													console.log("!!!!")
													result['RegisterDtm'] = res.data['registerDtm']
													discord_webhook(result)
													console.log(JSON.stringify(result))
													done.push(name)
													if (index + 1 == Object.keys(ac_q).length) {
														console.log('DONE : ', done.join(', '))
													} else {
														asc(ac_q, index + 1, done)
													}
												})
											} else {
												result['Healthy'] = res.data['isHealthy']
												discord_webhook(result)
												console.log(JSON.stringify(result))
												done.push(name)
												if (index + 1 == Object.keys(ac_q).length) {
													console.log('DONE : ', done.join(', '))
												} else {
													asc(ac_q, index + 1, done)
												}
												return
											}
										})
										
									})
								} else {
									console.log(JSON.stringify(result))
									if (index + 1 == Object.keys(ac_q).length) {
										console.log('DONE : ', done.join(', '))
									} else {
										asc(ac_q, index + 1, done)
									}
								}
							})
						} else {
							console.log(JSON.stringify(result))
							if (index + 1 == Object.keys(ac_q).length) {
								console.log('DONE : ', done.join(', '))
							} else {
								asc(ac_q, index + 1, done)
							}
						}
					})
				})

			} else {
				if (index + 1 == Object.keys(ac_q).length) {
					console.log('DONE : ', done.join(', '))
				} else {
					asc(ac_q, index + 1, done)
				}
			}
		}).catch((error)=>{
			if(error.response) {
				console.log(error.response.status)
			}
		})
}
if (Number(process.env.TEST) == 1) {
	console.log('Testing!!')
	rule.hour = Number(date_ob.getHours())
	rule.minute = Number(date_ob.getMinutes())
	rule.second = Number(date_ob.getSeconds() + 1)
	rule.dayOfWeek = new scheduler.Range(0, 6)
} else {
	console.log(
		`Scheduled time : ${process.env.HOUR}:${process.env.MINUTE} for week range of ${process.env.DAYOFWEEK_START} ~ ${process.env.DAYOFWEEK_END}`
	)
}

scheduler.scheduleJob(rule, function () {
	var ac_q = JSON.parse(fs.readFileSync('queue.json'))
	var q_arr = []
	for (var key of Object.keys(ac_q).sort()) {
		q_arr.push(key)
	}
	console.log(`Queue Loaded [${new Date().toString()}]\nQueue : ${q_arr.join(', ')}`)
	asc(ac_q, 0, [])
})
