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
							icon_url: 'https://avatars3.githubusercontent.com/u/54474221?s=460&u=0564e969c40c571cee8c67a6d5034b6850ff66b9&v=4'
						},
						footer: {
							text: 'losif',
							icon_url: 'https://avatars3.githubusercontent.com/u/54474221?s=460&u=0564e969c40c571cee8c67a6d5034b6850ff66b9&v=4'
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

function asc(ac_q, index, done) {
	var name = Object.keys(ac_q).sort()[index]
	var e_name = encryptWithPublicKey(name, process.env.PUBLIC_KEY).toString('base64')
	var e_birthday = encryptWithPublicKey(ac_q[name]['birthday'], process.env.PUBLIC_KEY).toString('base64')
	var e_password = encryptWithPublicKey(ac_q[name]['password'], process.env.PUBLIC_KEY).toString('base64')
	var result = {}
	axios.request(
		{ url: base_url + endpoints.SEARCH_SCHOOL,
			method: 'get',
			params: {
				lctnScCode: ac_q[name]['lctnScCode'],
				schulCrseScCode: ac_q[name]['schulCrseScCode'],
				orgName: ac_q[name]['orgName'],
				loginType: 'school',
			},
			headers: headers
		})
		.then((res) => {
			if(res.data['schulList'].length > 0){
				result['School'] = res.data['schulList'][0]['engOrgNm']
				var base_url = `https://${res.data['schulList'][0]['atptOfcdcConctUrl']}`
				axios.request(
					{ url: base_url + endpoints.FIND_USER,
						method: 'post',
						data: {
							birthday: e_birthday,
							loginType: 'school',
							name: e_name,
							orgCode: res.data['schulList'][0]['orgCode'],
							stdntPNo: null,
						},
						headers: headers
					}).then((res) => {
					result['Name'] = res.data['userName']
					if(ac_q[name]['mention']) {
						result['mention'] = ac_q[name]['mention']
					}
					var headers_ = headers
					headers_['Authorization'] = res.data.token
					axios.request(
						{ url: base_url + endpoints.HAS_PASSWORD,
							method: 'post',
							headers: headers_
						}).then((res) => {
						if (res.data) {
							axios.request(
								{ url: base_url + endpoints.LOGIN_WITH_SECOND_PASSWORD,
									method: 'post',
									data: {
										deviceUuid: '',
										password: e_password
									},
									headers: headers_
								}).then((res) => {
								result['Validate'] = res.data
								if (res.data) {
									axios.request(
										{ url: base_url + endpoints.SELECT_GROUP_LIST,
											method: 'post',
											headers: headers_
										}
									).then((res) => {
										axios.request(
											{ url: base_url + endpoints.REFRESH_USER_INFO,
												method: 'post',
												data: {
													orgCode: res.data[0]['orgCode'],
													userPNo: res.data[0]['userPNo']
												},
												headers: headers_
											}).then((res) => {
											if(!res.data['isHealthy']){
												headers_['Authorization'] = res.data.token
												payload['upperToken'] = res.data.token
												payload['upperUserNameEncpt'] = res.data['userNameEncpt']
												axios.request(
													{ url: base_url + endpoints.SEND_SURVEY_RESULT,
														method:'post',
														data: payload,
														headers: headers_
													}).then((res) => {
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
									discord_webhook(result)
									console.log(JSON.stringify(result))
									done.push(name)
									if (index + 1 == Object.keys(ac_q).length) {
										console.log('DONE : ', done.join(', '))
									} else {
										asc(ac_q, index + 1, done)
									}
								}
							})
						} else {
							discord_webhook(result)
							console.log(JSON.stringify(result))
							done.push(name)
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
		'Scheduled time : ' +
    process.env.HOUR +
    ':' +
    process.env.MINUTE +
    ' for week range of ' +
    process.env.DAYOFWEEK_START +
    ' ~ ' +
    process.env.DAYOFWEEK_END
	)
}

scheduler.scheduleJob(rule, function () {
	var ac_q = JSON.parse(fs.readFileSync('queue.json'))
	var q_arr = []
	for (var key of Object.keys(ac_q).sort()) {
		q_arr.push(key)
	}
	console.log(
		'Queue Loaded [' + new Date().toString() + ']\nQueue : ' + q_arr.join(', ')
	)
	asc(ac_q, 0, [])
})
