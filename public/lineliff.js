
function createUniversalLink() {
}

async function shareMsg() {
}

function logOut() {
}

async function closed() {
}

async function scanCode() {
}

function openWindow() {
}

async function getFriendship() {
}

// function getPosition() {
// // Simple wrapper
// return new Promise((res, rej) => {
//     navigator.geolocation.getCurrentPosition(res, rej);
// });
// }



async function sendMsg(data) {
    // if(liff.getContext().type !== "none" && liff.getContext().type !== "external"){
    //     var position = await getPosition(); 
    //     var data_latitude = position.coords.latitude
    //     var data_longitude = position.coords.longitude
    //     await liff.sendMessages([
    //         {
    //         type: `text`,
    //         text: 'test'
    //         }
    //     ])
    // }
    const firstName = data.firstName
    const lastName = data.lastName
    const idStudent = data.idStudent
    const course1 = data.course1
    const course2 = data.course2
    const course3 = data.course3
    const course4 = data.course4
    const course5 = data.course5
    const course6 = data.course6
    const date = new Date().toLocaleString("en-GB", {timeZone: "Asia/Bangkok"}).split(',')
    const dateNow = date[0]
    console.log('data')
    console.log(data)
    await liff.sendMessages([
        // {
        // type: `text`,
        // text: `idStudent${idStudent} ชื่อ ${firstName}นามสกุล ${lastName} course1 ${course1} course2 ${course2} course3 ${course3} course4 ${course4} course5 ${course5} course6 ${course6}`
        // }   
        {
            "type": "flex",
            "altText": "คะแนนเกรด",
            "contents": {
              "type": "bubble",
              "size": "giga",
              "header": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                  {
                    "type": "text",
                    "text": "คะแนนเกรด",
                    "weight": "bold",
                    "size": "xxl",
                    "align": "center",
                    "color": "#ffffff"
                  }
                ],
                "backgroundColor": "#002e72"
              },
              "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                  {
                    "type": "box",
                    "layout": "horizontal",
                    "contents": [
                      {
                        "type": "text",
                        "text": "รหัสนักศึกษา : ",
                        "flex": 3,
                        "color": "#aaaaaa"
                      },
                      {
                        "type": "text",
                        "text": idStudent,
                        "flex": 7,
                        "color": "#666666"
                      }
                    ]
                  },
                  {
                    "type": "box",
                    "layout": "horizontal",
                    "contents": [
                      {
                        "type": "text",
                        "text": "ชื่อ : ",
                        "flex": 1,
                        "color": "#aaaaaa"
                      },
                      {
                        "type": "text",
                        "text": firstName+' '+lastName,
                        "flex": 9,
                        "color": "#666666"
                      }
                    ]
                  },
                  {
                    "type": "separator",
                    "margin": "lg"
                  },
                  {
                    "type": "box",
                    "layout": "horizontal",
                    "contents": [
                      {
                        "type": "text",
                        "text": "เทคโนโลยีด้านการถ่ายและตกแต่งภาพ",
                        "flex": 5,
                        "color": "#666666"
                      },
                      {
                        "type": "text",
                        "text": course1,
                        "flex": 1,
                        "align": "end",
                        "weight": "bold"
                      }
                    ],
                    "margin": "xl"
                  },
                  {
                    "type": "box",
                    "layout": "horizontal",
                    "contents": [
                      {
                        "type": "text",
                        "text": "การฝึกปฏิบัติการวิชาชีพระหว่างเรียน 1",
                        "flex": 5,
                        "color": "#666666"
                      },
                      {
                        "type": "text",
                        "text": course2,
                        "flex": 1,
                        "align": "end",
                        "weight": "bold"
                      }
                    ],
                    "margin": "xl"
                  },
                  {
                    "type": "box",
                    "layout": "horizontal",
                    "contents": [
                      {
                        "type": "text",
                        "text": "โครงการวิจัย 2",
                        "flex": 5,
                        "color": "#666666"
                      },
                      {
                        "type": "text",
                        "text": course3,
                        "flex": 1,
                        "align": "end",
                        "weight": "bold"
                      }
                    ],
                    "margin": "xl"
                  },
                  {
                    "type": "box",
                    "layout": "horizontal",
                    "contents": [
                      {
                        "type": "text",
                        "text": "ระบบปฏิบัติการ",
                        "flex": 5,
                        "color": "#666666"
                      },
                      {
                        "type": "text",
                        "text": course4,
                        "flex": 1,
                        "align": "end",
                        "weight": "bold"
                      }
                    ],
                    "margin": "xl"
                  },
                  {
                    "type": "box",
                    "layout": "horizontal",
                    "contents": [
                      {
                        "type": "text",
                        "text": "โปรแกรมประยุกต์สำหรับสำนักงานอัตโนมัติ",
                        "flex": 5,
                        "color": "#666666"
                      },
                      {
                        "type": "text",
                        "text": course5,
                        "flex": 1,
                        "align": "end",
                        "weight": "bold"
                      }
                    ],
                    "margin": "xl"
                  },
                  {
                    "type": "box",
                    "layout": "horizontal",
                    "contents": [
                      {
                        "type": "text",
                        "text": "ระบบการเรียนรู้แบบปรับเหมาะ",
                        "flex": 5,
                        "color": "#666666"
                      },
                      {
                        "type": "text",
                        "text": course6,
                        "flex": 1,
                        "align": "end",
                        "weight": "bold"
                      }
                    ],
                    "margin": "xl"
                  }
                ]
              },
              "footer": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                  {
                    "type": "separator"
                  },
                  {
                    "type": "box",
                    "layout": "horizontal",
                    "contents": [
                      {
                        "type": "text",
                        "text": "LINE Grade System",
                        "size": "xxs",
                        "color": "#aaaaaa"
                      },
                      {
                        "type": "text",
                        "text": dateNow,
                        "size": "xxs",
                        "align": "end",
                        "color": "#aaaaaa"
                      }
                    ],
                    "margin": "xl"
                  }
                ]
              }
            }
          }
    ])

    console.log('Send message')
    liff.closeWindow();
}

function getContext() {
}

async function getUserProfile() {
}

function getEnvironment() {
}

async function main(data) {
  
    
    
    
    await liff.init({ liffId: "1656827618-gNx8JaN1" })
    sendMsg(data)
    
    
}

