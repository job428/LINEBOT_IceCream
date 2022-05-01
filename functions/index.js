const functions = require('firebase-functions');
const request = require('request-promise');
const admin = require('firebase-admin');
admin.initializeApp();
const { LINE_MESSAGING_API, LINE_HEADER } = require('./config');
const { object } = require('firebase-functions/v1/storage');


const region = 'asia-east2';
const runtimeOpts = {
  timeoutSeconds: 10,
  memory: '1GB'
}


exports.LineBot = functions.region(region).runWith(runtimeOpts).https.onRequest(async (req, res) => {
  const payload = req.body
  const events = payload.events
  const json = { name: 'kittiphong' }

  // await admin.database().ref('data_land').child('test').push(json);

  // console.log(testJson)
  events.forEach(async payload_element => {
    const uid = payload_element.source.userId
    const UserMsg = payload_element.message.text
    const menu = payload_element.message.text
    const price = 50
    
    if (payload_element.type == 'message') {  //เช็คว่าเป็นข้อความไหม
      const DataOrder = await admin.database().ref('order').child(uid).once('value') // คือออเดอร์ปัจจุน
      const DataOrderVal = DataOrder.val()

      const DataMenu = await admin.database().ref('Menu').once('value') // ข้อมูลเมนูอาหารจาก Database
      const DataMenuVal = DataMenu.val()

      const DataAdmin = await admin.database().ref('admin').once('value')
      const DataAdminVal = DataAdmin.val()

      const DataDoneForCheck = await admin.database().ref('done').child(uid).once('value')
      const DataDoneForCheckVal = DataDoneForCheck.val()
      

      let priceForShow = []
     
     
      if (uid == DataAdminVal.uid && UserMsg.split(' : ')[0] == 'ยืนยันรับออเดอร์') { //admin กด ยืนยันรับออเดอร์
        //confirm form Admin
        
        // console.log(UserMsg.split(' : ')[2])
        // console.log((UserMsg.split(' : ')[1]).split('\n')[0])

        const DataDone = await admin.database().ref('done').child(UserMsg.split(' : ')[2] +'/'+ (UserMsg.split(' : ')[1]).split('\n')[0]).once('value')
        const DataDoneVal = DataDone.val()
        // { idบิล : ข้อมูลรายการที่สั่ง }
        const data = { [(UserMsg.split(' : ')[1]).split('\n')[0]] :DataDoneVal}

        //{ [(UserMsg.split(' : ')[1]).split('\n')[0]] :DataDoneVal}
        pushFlexForConfirm(UserMsg.split(' : ')[2],data) //ส่ง Flex รายการอาหารที่สั่งกลับไปให้ผู้ซื้อ(ลูกค้า) สถานะสีเขียว
        await admin.database().ref('done').child(UserMsg.split(' : ')[2] +'/'+ (UserMsg.split(' : ')[1]).split('\n')[0]).update({ status: 'confirm'}); //อัพเดทstatus confirm 
        reply(payload_element,'ยืนยันการรับออเดอร์ : '+(UserMsg.split(' : ')[1]).split('\n')[0]) // ส่งข้อความไปที่ admin

      }else if (uid == DataAdminVal.uid && UserMsg.split(' : ')[0] == 'ยกเลิกออเดอร์') {
        await admin.database().ref('done').child(UserMsg.split(' : ')[2] +'/'+ (UserMsg.split(' : ')[1]).split('\n')[0]).update({ status: 'cancel'}); //อัพเดทstatus cancel
        //reply(payload_element, 'ออเดอร์ '+(UserMsg.split(' : ')[1]).split('\n')[0]+' ของคุณถูกยกเลิกจากทางร้าน') //ส่งข้อความหาผู้สั่งว่ายกเลิกแล้ว
        pushMESSAGING(UserMsg.split(' : ')[2],'ออเดอร์ '+(UserMsg.split(' : ')[1]).split('\n')[0]+' ของคุณถูกยกเลิกจากทางร้าน')
      } else if (DataOrder.val() !== null) { //ออเดอร์ปัจจุบันไม่มี ไม่ใช่หรือ?
        //insert order
        const Datastage = await admin.database().ref('stage1/' + uid).once('value') //เรียกข้อมูล Stage
        const DatastageVal = Datastage.val()

        if (Datastage.val() !== null) {
          //send Order
          if (DatastageVal.stage == 1) {
            //Member name
            stage = DatastageVal.stage + 1 //หลัง User พิมพ์ชื่อ จะนำ stage1 + 1 =2 
            await admin.database().ref('stage1').child(uid).update({ nameMember: UserMsg, stage: stage }); // บันทึก stage=2 // บันทึกชื่อ 
            reply(payload_element, 'กรุณาพิมพ์เบอร์โทรศัพท์')// ตอบกลับ
          } else if (DatastageVal.stage == 2) {
            //Member phone number
            stage = DatastageVal.stage + 1
            await admin.database().ref('stage1').child(uid).update({ phoneNumber: UserMsg, stage: stage });// บันทึก stage=3 // บันทึกเบอร์
            reply(payload_element, 'กรุณาระบุสถานที่รับอาหาร \nรับที่ร้าน/จัดส่งหน่วยงาน\n(กรุณาพิมชื่อหน่วยและกอง)') // so1
          } else if (DatastageVal.stage == 3) { //ส่งออเดอร์เงื่อนไขสุดท้าย
            //Member army unit
            DatastageVal['armyUnit'] = UserMsg
            delete DatastageVal.stage;
            
            const NewDataOrderVal = Object.values(DataOrderVal)[0]
            NewDataOrderVal['status'] = 'pending' //สถานะ

            Object.assign(NewDataOrderVal, DatastageVal);

            const idOrder = Object.keys(DataOrderVal)[0]
            const DataOrderValPush = JSON.stringify(DataOrderVal)
            await admin.database().ref('done').child(uid + '/' + idOrder).set(NewDataOrderVal); //ส่งออเดอร์เข้า Done

            await admin.database().ref('stage1').child(uid).remove(); //ลบ stage
            await admin.database().ref('order').child(uid+'/'+idOrder).remove(); //ลบ


            replyflexDone(payload_element, DataOrderVal) //ส่งบิล User เข้าห้องแชท
            pushFlex(DataAdminVal.uid,uid, JSON.parse(DataOrderValPush)) //ส่งบิล User ไปหา Admin ยืนยัน
          }

        } else {

          if (UserMsg == 'ส่งรายการอาหาร') {
            var stage = 1
            await admin.database().ref('stage1').child(uid).update({ stage: stage }); // บันทึก Stage= 1 ลงฐานข้อมูล
            reply(payload_element, 'กรุณาพิมพ์ชื่อ - นามสกุล')
          } else if (UserMsg == 'ยกเลิกออเดอร์') {
            await admin.database().ref('order').child(uid).remove();
            reply(payload_element, 'ยกเลิกออเดอร์เรียบร้อยแล้ว')
          } else {
            //การรับออเดอร์ที่แท้ทรู
            var arrIdOrder = []


            Object.keys(DataMenuVal).forEach((key1, index) => { //ค้นหาข้อมูลเมนูใน ชื่อ,ราคา database จากที่ User พิมพ์
              if (DataMenuVal[key1].name == menu) {

                Object.keys(DataOrderVal).forEach((key, index) => {

                  Object.keys(DataOrderVal[key]).forEach((data) => {

                    if (data == key1) {
                      arrIdOrder.push(data)
                    }

                  })
                })

                let Count
                let price
                // console.log('Count')
                // console.log(Count)

                //arrIdOrder = อาหารที่ซ้ำ
                if (arrIdOrder.length > 0) { // กรณีสั่งซ้ำหรือ 2 ขึ้น

                  Count = (Object.values(Object.values(DataOrderVal)[0])[0].count) + 1
                  price = (DataMenuVal[key1].price) * Count
                } else {

                  price = DataMenuVal[key1].price
                  Count = 1
                }

                //
                priceForShow.push({ [key1]: { menu: DataMenuVal[key1].name, price: price, count: Count } })
              }
            })

            let jsonList = priceForShow[0]

            if (priceForShow.length > 0) {// เช็คในกรณีที่ User พิมพ์เมนูมั่วๆ ไม่มีใน Database
              

              await admin.database().ref('order').child(uid + '/' + Object.keys(DataOrderVal)).update(jsonList); //บันลงใน ฐานข้อมูล order
              replyflexList(payload_element, jsonList, Object.values(DataOrder.val())[0]) // ส่งFlex รายการอาหารเข้าห้องแชท
            } else {
              reply(payload_element, 'กรุณากดเลือกอาหารในเมนู')

            }
          }
        }

      } else if(payload_element.message.text == 'UID' || payload_element.message.text == 'uid' ){ //เช็ค UID ใช่หรือไม่
        reply(payload_element,'LINE USER ID ของคุณ : '+uid)
      }else {
        // สั่งอาหาร
        if (payload_element.message.text == 'สั่งอาหาร') {

          const DataOrder = await admin.database().ref('order').child(uid).once('value')
          const DataOrderAll = await admin.database().ref('order').once('value')
          const DataOrderAllVal = DataOrderAll.val()
          const DataDoneAll = await admin.database().ref('done').once('value')
          const DataDoneAllVal = DataDoneAll.val()
          //B0001
          let idOrder
          var str
          var pad
          var ans
          var getIdOrder = [] // ['B0001','B0002','B0003','B0004','B0005']
          var countIdOrder = [] //'1','2','3'

          //Get OrderID //การรับ Order
          if (DataOrderAllVal !== null) { //ข้อมูลออเดอร์ทั้งหมด ไม่มี ไม่ใช่หรือ //ป้องกันการเกิด Error
            Object.values(DataOrderAllVal).forEach((data) => {
              getIdOrder.push(Object.keys(data)[0]) // เก็บ IDOrderไว้ใน Arr

            })
          }

          if (DataDoneAllVal !== null) { //ข้อมูลออเดอร์ทั้งหมด ไม่มี ไม่ใช่หรือ //ป้องกันการเกิด Error
            Object.values(DataDoneAllVal).forEach((data2) => {
              Object.keys(data2).forEach((data3) => {
                getIdOrder.push(data3) // เก็บ IDOrderไว้ใน Arr
              })
              // getIdOrder.push(Object.keys(data2)[0]) 
            })
          }


          getIdOrder.forEach((data) => {
            countIdOrder.push(Number(data.substring(1, 5))) // substring คือการตัดข้อความ B0005 ตัด B000 เหลือแต่ 5

          })

          countIdOrder.sort(function (a, b) { //sort ค้นหาตัวเลขที่มากที่สุด
            return a - b;
          });

          if (getIdOrder.length < 1) {
            str = "" + 1 // นำตัวเลขที่ sort มา + 1

          } else { // กรณีไม่มีออเดอร์เลย (ลูกค้าคนแรก)

            const lastKey = countIdOrder[(countIdOrder.length - 1)]
            str = "" + (lastKey + 1) // = 1
          }
          pad = "0000" 
          ans = pad.substring(0, pad.length - str.length) + str //นำ 0000 มารวมกับ 6 = 0006
          idOrder = 'B' + ans // B มารวมกับ 0006 = B0006





          await admin.database().ref('order').child(uid + '/' + idOrder).set({ id: idOrder }); //บันทึกลงฐานข้อมูล
          replyflexMenu(payload_element, DataMenu.val()) // ส่ง Flex เมนูอาหาร ไปที่ห้องแชท
          
        }else {
          if(DataDoneForCheckVal !== null){
            console.log('DataDoneForCheckVal')
            console.log(DataDoneForCheckVal)
            console.log('-------------------')
            var stillPending = false
            Object.keys(DataDoneForCheckVal).forEach((key , index) =>{
              if(DataDoneForCheckVal[key].status == 'pending'){
                stillPending = true
              }
            })
          } 
          if(stillPending == true){
            reply(payload_element,'กรุณารอการยืนยันจากทางร้านสักครู่')
          }else{
            reply(payload_element, 'กรุณากดที่เมนู สั่งอาหาร หรือพิมพ์คำว่า สั่งอาหาร')
          }
          
          
        }
      }





      //   reply(payload_element,'Hello')


    }


  });
  res.sendStatus(200)
});

const replyflexMenu = (bodyResponse, DataMenu) => {

  var size = Object.keys(DataMenu).length;
  let dollarUSLocale = Intl.NumberFormat('en-US');
  //let test2 = dollarUSLocale.format(price)
  var arrFlex = []
  var arrCarousel = []

  var column = 5 // จำนวนแถว
  var row = Math.ceil(size / column)

  //[ 'M0001', 'M0002', 'M0003', 'M0004', 'M0005', 'M0006' ]

  if (size > column) {

  }
  
  var countRow = 0
  var count = 0
  var lastRow
  Object.keys(DataMenu).forEach((key, index) => {
    count = count + 1
    size = size - 1
    arrCarousel.push(
      {
        "type": "bubble",
        "size": "micro",
        "hero": {
          "type": "image",
          "url": DataMenu[key].imageUrl,
          "size": "full",
          "aspectMode": "cover",
          "aspectRatio": "320:213"
        },
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": DataMenu[key].name,
              "weight": "bold",
              "size": "xl",
              "wrap": true
            },
            {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": DataMenu[key].price + " บาท",
                  "size": "md"
                }
              ]
            }
          ],
          "spacing": "sm",
          "paddingAll": "13px"
        },
        "action": {
          "type": "message",
          "label": "action",
          "text": DataMenu[key].name
        }
      }
    )

    if (count == column || size == 0) {

      arrFlex.push(
        {
          "type": "flex",
          "altText": "เมนูอาหาร",
          "contents": {
            "type": "carousel",
            "contents": arrCarousel
          }
        }
      )
      count = 0
      countRow = countRow + 1
      arrCarousel = []
    }
  });
 /////////////////////////////////////////////////////////////////////////////////////
  return request({
    method: `POST`,
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      replyToken: bodyResponse.replyToken,
      messages: arrFlex 
    })
  });
};

const StrtoNumber = (amount) => {
  return Number(amount.replace(/[^0-9.-]+/g, ""));
}
const numberToStringCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    minimumFractionDigits: 2
    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  }).format(amount)
}

const replyflexDone = async (bodyResponse, DataOrder) => {
  let arrListmenu = []
  var arrDataOrder = []
  let = messagesJson = {}
  let arrFlex = []
  let dollarUSLocale = Intl.NumberFormat('en-US');
  let cal = 0

  //let test2 = dollarUSLocale.format(price)
  Object.keys(DataOrder).forEach((key, index) => {
    arrDataOrder.push(DataOrder[key])
  });
  console.log('arrDataOrder[0] flexDone')
  console.log(arrDataOrder[0])
  let id = arrDataOrder[0].id
  let nameMember = arrDataOrder[0].nameMember
  let phoneNumber = arrDataOrder[0].phoneNumber
  let armyUnit = arrDataOrder[0].armyUnit

  delete arrDataOrder[0].id;
  delete arrDataOrder[0].nameMember;
  delete arrDataOrder[0].phoneNumber;
  delete arrDataOrder[0].armyUnit;
  delete arrDataOrder[0].status;

  const DataOrder2 = await arrDataOrder[0]
  var count = 0


  await Object.keys(DataOrder2).forEach((key, index) => {
    if (DataOrder2[key].count !== undefined) {
      // console.log('count undefined')
      // console.log(count)
      count = count + DataOrder2[key].count
    }
  })

  Object.keys(DataOrder2).forEach((key, index) => {

    cal = DataOrder2[key].price + cal
    // console.log('DataOrder[key]')
    // console.log(DataOrder[key])

    arrFlex.push(
      {
        "type": "box",
        "layout": "horizontal",
        "contents": [
          {
            "type": "text",
            "text": (DataOrder2[key].count).toString(),
            "size": "sm",
            "color": "#111111",
            "align": "start",
            "flex": 1
          },
          {
            "type": "text",
            "text": DataOrder2[key].menu,
            "size": "sm",
            "color": "#555555",
            "flex": 5
          },
          {
            "type": "text",
            "text": numberToStringCurrency(DataOrder2[key].price) + ' บาท',
            "size": "sm",
            "color": "#111111",
            "align": "end",
            "flex": 5
          }
        ]
      }

    )
  });

  messagesJson = {
    "type": "flex",
    "altText": "รายการอาหารที่สั่ง",
    "contents": {
      "type": "bubble",
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "text",
            "text": "รายการอาหาร",
            "weight": "bold",
            "color": "#1DB446",
            "size": "sm"
          },
          {
            "type": "text",
            "text": "FoodAirForceClub",
            "weight": "bold",
            "size": "xxl",
            "margin": "md"
          },
          {
            "type": "text",
            "text": "ID " + id,
            "size": "xs",
            "color": "#aaaaaa",
            "wrap": true
          },
          {
            "type": "text",
            "text": "Name: " + nameMember,
            "size": "xs",
            "color": "#aaaaaa",
            "wrap": true
          },
          {
            "type": "text",
            "text": "Phone: " + phoneNumber,
            "size": "xs",
            "color": "#aaaaaa",
            "wrap": true
          },
          {
            "type": "text",
            "text": "หน่วย : " + armyUnit,
            "size": "xs",
            "color": "#aaaaaa",
            "wrap": true
          },
          {
            "type": "separator",
            "margin": "xxl"
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "xxl",
            "spacing": "sm",
            "contents": arrFlex,
          },
          {
            "type": "separator",
            "margin": "xxl"
          },
          {
            "type": "box",
            "layout": "horizontal",
            "margin": "xxl",
            "contents": [
              {
                "type": "text",
                "text": "ITEMS",
                "size": "sm",
                "color": "#555555"
              },
              {
                "type": "text",
                "text": count.toString(),
                "size": "sm",
                "color": "#111111",
                "align": "end"
              }
            ]
          },
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              {
                "type": "text",
                "text": "TOTAL",
                "size": "sm",
                "color": "#555555"
              },
              {
                "type": "text",
                "text": numberToStringCurrency(cal) + ' บาท',
                "size": "sm",
                "color": "#111111",
                "align": "end"
              }
            ]
          },
          {
            "type": "separator",
            "margin": "md"
          }
          ,
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              {
                "type": "text",
                "text": "สถานะ",
                "flex": 1,
                "size": "sm",
                "color": "#555555"
              },
              {
                "type": "text",
                "text": "รอการยืนยันรับออเดอร์จากทางร้าน",
                "flex": 5,
                "size": "sm",
                "color": "#D11919"
              }
            ]
          }

        ]
      },
      "styles": {
        "footer": {
          "separator": true
        }
      }
    }
  }
  return request({
    method: `POST`,
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      replyToken: bodyResponse.replyToken,
      messages: [
        messagesJson
      ]
    })
  });

}

const replyflexList = async (bodyResponse, jsonList, DataOrder) => {
  let arrListmenu = []
  var count = 0

  Object.assign(DataOrder, jsonList);
  await Object.keys(DataOrder).forEach((key, index) => {
    if (DataOrder[key].count !== undefined) {
      count = count + DataOrder[key].count
    }
  })

  const id = await DataOrder.id

  delete DataOrder.id;
  let arrFlex = []
  let dollarUSLocale = Intl.NumberFormat('en-US');
  let cal = 0
  //let test2 = dollarUSLocale.format(price)
  Object.keys(DataOrder).forEach((key, index) => {

    cal = DataOrder[key].price + cal

    arrFlex.push(
      {
        "type": "box",
        "layout": "horizontal",
        "contents": [
          {
            "type": "text",
            "text": (DataOrder[key].count).toString(),
            "size": "sm",
            "color": "#111111",
            "align": "start",
            "flex": 1
          },
          {
            "type": "text",
            "text": DataOrder[key].menu,
            "size": "sm",
            "color": "#555555",
            "flex": 5
          },
          {
            "type": "text",
            "text": numberToStringCurrency(DataOrder[key].price) + ' บาท',
            "size": "sm",
            "color": "#111111",
            "align": "end",
            "flex": 5
          }
        ]
      }

    )
  });



  return request({
    method: `POST`,
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      replyToken: bodyResponse.replyToken,
      messages: [
        {
          "type": "flex",
          "altText": "รายการอาหารที่สั่ง",
          "contents": {
            "type": "bubble",
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "รายการอาหาร",
                  "weight": "bold",
                  "color": "#1DB446",
                  "size": "sm"
                },
                {
                  "type": "text",
                  "text": "FoodAirForceClub",
                  "weight": "bold",
                  "size": "xxl",
                  "margin": "md"
                },
                {
                  "type": "text",
                  "text": "ID " + id,
                  "size": "xs",
                  "color": "#aaaaaa",
                  "wrap": true
                },
                {
                  "type": "separator",
                  "margin": "xxl"
                },
                {
                  "type": "box",
                  "layout": "vertical",
                  "margin": "xxl",
                  "spacing": "sm",
                  "contents": arrFlex,
                },
                {
                  "type": "separator",
                  "margin": "xxl"
                },
                {
                  "type": "box",
                  "layout": "horizontal",
                  "margin": "xxl",
                  "contents": [
                    {
                      "type": "text",
                      "text": "ITEMS",
                      "size": "sm",
                      "color": "#555555"
                    },
                    {
                      "type": "text",
                      "text": count.toString(),
                      "size": "sm",
                      "color": "#111111",
                      "align": "end"
                    }
                  ]
                },
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    {
                      "type": "text",
                      "text": "TOTAL",
                      "size": "sm",
                      "color": "#555555"
                    },
                    {
                      "type": "text",
                      "text": numberToStringCurrency(cal) + ' บาท',
                      "size": "sm",
                      "color": "#111111",
                      "align": "end"
                    }
                  ]
                },
                {
                  "type": "separator",
                  "margin": "md"
                }
                ,
                {
                  "type": "button",
                  "action": {
                    "type": "message",
                    "label": "ส่งรายการอาหาร",
                    "text": "ส่งรายการอาหาร"
                  },
                  "style": "primary",
                  "margin": "md"
                },
                {
                  "type": "button",
                  "action": {
                    "type": "message",
                    "label": "ยกเลิกออเดอร์",
                    "text": "ยกเลิกออเดอร์"
                  },
                  "style": "primary",
                  "margin": "md",
                  "color": "#FF0000"
                }

              ]
            },
            "styles": {
              "footer": {
                "separator": true
              }
            }
          }
        }
      ]
    })
  });
};

const reply = (bodyResponse, msg) => {
  return request({
    method: `POST`,
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      replyToken: bodyResponse.replyToken,
      messages: [
        {
          type: `text`,
          text: msg
        }
      ]
    })
  });
};

const pushFlexForConfirm = async (uid, DataOrder) => {
  let arrListmenu = []
  var arrDataOrder = []
  let = messagesJson = {}
  let arrFlex = []
  let dollarUSLocale = Intl.NumberFormat('en-US');
  let cal = 0
  console.log('DataOrder')
  console.log(DataOrder)
  //let test2 = dollarUSLocale.format(price)
  if(DataOrder !== null){
    Object.keys(DataOrder).forEach((key, index) => {
      
      arrDataOrder.push(DataOrder[key])
    });
  }
  
  // console.log('arrDataOrder[0] flexDone')
  // console.log(arrDataOrder[0])

  let id = arrDataOrder[0].id
  let nameMember = arrDataOrder[0].nameMember
  let phoneNumber = arrDataOrder[0].phoneNumber
  let armyUnit = arrDataOrder[0].armyUnit

  delete arrDataOrder[0].id;
  delete arrDataOrder[0].nameMember;
  delete arrDataOrder[0].phoneNumber;
  delete arrDataOrder[0].armyUnit;
  delete arrDataOrder[0].status;

  const DataOrder2 = await arrDataOrder[0]
  var count = 0


  await Object.keys(DataOrder2).forEach((key, index) => {
    if (DataOrder2[key].count !== undefined) {
      // console.log('count undefined')
      // console.log(count)
      count = count + DataOrder2[key].count
    }
  })

  Object.keys(DataOrder2).forEach((key, index) => {

    cal = DataOrder2[key].price + cal
    // console.log('DataOrder[key]')
    // console.log(DataOrder[key])

    arrFlex.push(
      {
        "type": "box",
        "layout": "horizontal",
        "contents": [
          {
            "type": "text",
            "text": (DataOrder2[key].count).toString(),
            "size": "sm",
            "color": "#111111",
            "align": "start",
            "flex": 1
          },
          {
            "type": "text",
            "text": DataOrder2[key].menu,
            "size": "sm",
            "color": "#555555",
            "flex": 5
          },
          {
            "type": "text",
            "text": numberToStringCurrency(DataOrder2[key].price) + ' บาท',
            "size": "sm",
            "color": "#111111",
            "align": "end",
            "flex": 5
          }
        ]
      }

    )
  });

  messagesJson = {
    "type": "flex",
    "altText": "รายการอาหารที่สั่ง",
    "contents": {
      "type": "bubble",
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "text",
            "text": "รายการอาหาร",
            "weight": "bold",
            "color": "#1DB446",
            "size": "sm"
          },
          {
            "type": "text",
            "text": "FoodAirForceClub",
            "weight": "bold",
            "size": "xxl",
            "margin": "md"
          },
          {
            "type": "text",
            "text": "ID " + id,
            "size": "xs",
            "color": "#aaaaaa",
            "wrap": true
          },
          {
            "type": "text",
            "text": "Name: " + nameMember,
            "size": "xs",
            "color": "#aaaaaa",
            "wrap": true
          },
          {
            "type": "text",
            "text": "Phone: " + phoneNumber,
            "size": "xs",
            "color": "#aaaaaa",
            "wrap": true
          },
          {
            "type": "text",
            "text": "หน่วย : " + armyUnit,
            "size": "xs",
            "color": "#aaaaaa",
            "wrap": true
          },
          {
            "type": "separator",
            "margin": "xxl"
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "xxl",
            "spacing": "sm",
            "contents": arrFlex,
          },
          {
            "type": "separator",
            "margin": "xxl"
          },
          {
            "type": "box",
            "layout": "horizontal",
            "margin": "xxl",
            "contents": [
              {
                "type": "text",
                "text": "ITEMS",
                "size": "sm",
                "color": "#555555"
              },
              {
                "type": "text",
                "text": count.toString(),
                "size": "sm",
                "color": "#111111",
                "align": "end"
              }
            ]
          },
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              {
                "type": "text",
                "text": "TOTAL",
                "size": "sm",
                "color": "#555555"
              },
              {
                "type": "text",
                "text": numberToStringCurrency(cal) + ' บาท',
                "size": "sm",
                "color": "#111111",
                "align": "end"
              }
            ]
          },
          {
            "type": "separator",
            "margin": "md"
          }
          ,
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              {
                "type": "text",
                "text": "สถานะ",
                "flex": 1,
                "size": "sm",
                "color": "#555555"
              },
              {
                "type": "text",
                "text": "รับออเดอร์แล้ว กำลังเตรียมอาหาร",
                "flex": 5,
                "size": "sm",
                "color": "#00E33E"
              }
            ]
          }

        ]
      },
      "styles": {
        "footer": {
          "separator": true
        }
      }
    }
  }

  return request({
    method: `POST`,
    uri: `${LINE_MESSAGING_API}/push`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      to: uid,
      messages: [
        messagesJson
      ]
    })
  }).then(() => {
    return 'Push messenger Done';
  }).catch((error) => {
    return error;
  });
}

const pushMESSAGING = async (uid, msg) => {
 
  

  return request({
    method: `POST`,
    uri: `${LINE_MESSAGING_API}/push`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      to: uid,
      messages: [
        {
          type: `text`,
          text: msg
        }
      ]
    })
  }).then(() => {
    return 'Push messenger Done';
  }).catch((error) => {
    return error;
  });
}

const pushFlex = async (uidadmin,uid, DataOrder) => {
 
  let arrListmenu = []
  var arrDataOrder = []
  let = messagesJson = {}
  let arrFlex = []
  let dollarUSLocale = Intl.NumberFormat('en-US');
  let cal = 0
  
  //let test2 = dollarUSLocale.format(price)
  Object.keys(DataOrder).forEach((key, index) => {
    arrDataOrder.push(DataOrder[key])
  });

  let id = arrDataOrder[0].id
  let nameMember = arrDataOrder[0].nameMember
  let phoneNumber = arrDataOrder[0].phoneNumber
  let armyUnit = arrDataOrder[0].armyUnit

  delete arrDataOrder[0].id;
  delete arrDataOrder[0].nameMember;
  delete arrDataOrder[0].phoneNumber;
  delete arrDataOrder[0].armyUnit;
  delete arrDataOrder[0].status;
  

  DataOrder = await arrDataOrder[0]
  var count = 0


  await Object.keys(DataOrder).forEach((key, index) => {
    if (DataOrder[key].count !== undefined) {
      // console.log('count undefined')
      // console.log(count)
      count = count + DataOrder[key].count
    }
  })

  Object.keys(DataOrder).forEach((key, index) => {

    cal = DataOrder[key].price + cal
    // console.log('DataOrder[key]')
    // console.log(DataOrder[key])

    arrFlex.push(
      {
        "type": "box",
        "layout": "horizontal",
        "contents": [
          {
            "type": "text",
            "text": (DataOrder[key].count).toString(),
            "size": "sm",
            "color": "#111111",
            "align": "start",
            "flex": 1
          },
          {
            "type": "text",
            "text": DataOrder[key].menu,
            "size": "sm",
            "color": "#555555",
            "flex": 5
          },
          {
            "type": "text",
            "text": numberToStringCurrency(DataOrder[key].price) + ' บาท',
            "size": "sm",
            "color": "#111111",
            "align": "end",
            "flex": 5
          }
        ]
      }

    )
  });

  messagesJson = {
    "type": "flex",
    "altText": "รายการอาหารที่สั่ง",
    "contents": {
      "type": "bubble",
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "text",
            "text": "รายการอาหาร",
            "weight": "bold",
            "color": "#1DB446",
            "size": "sm"
          },
          {
            "type": "text",
            "text": "FoodAirForceClub",
            "weight": "bold",
            "size": "xxl",
            "margin": "md"
          },
          {
            "type": "text",
            "text": "ID " + id,
            "size": "xs",
            "color": "#aaaaaa",
            "wrap": true
          },
          {
            "type": "text",
            "text": "Name: " + nameMember,
            "size": "xs",
            "color": "#aaaaaa",
            "wrap": true
          },
          {
            "type": "text",
            "text": "Phone: " + phoneNumber,
            "size": "xs",
            "color": "#aaaaaa",
            "wrap": true
          },
          {
            "type": "text",
            "text": "หน่วย : " + armyUnit,
            "size": "xs",
            "color": "#aaaaaa",
            "wrap": true
          },
          {
            "type": "separator",
            "margin": "xxl"
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "xxl",
            "spacing": "sm",
            "contents": arrFlex,
          },
          {
            "type": "separator",
            "margin": "xxl"
          },
          {
            "type": "box",
            "layout": "horizontal",
            "margin": "xxl",
            "contents": [
              {
                "type": "text",
                "text": "ITEMS",
                "size": "sm",
                "color": "#555555"
              },
              {
                "type": "text",
                "text": count.toString(),
                "size": "sm",
                "color": "#111111",
                "align": "end"
              }
            ]
          },
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              {
                "type": "text",
                "text": "TOTAL",
                "size": "sm",
                "color": "#555555"
              },
              {
                "type": "text",
                "text": numberToStringCurrency(cal) + ' บาท',
                "size": "sm",
                "color": "#111111",
                "align": "end"
              }
            ]
          },
          {
            "type": "separator",
            "margin": "md"
          },
          {
            "type": "button",
            "action": {
              "type": "message",
              "label": "ยืนยันรับออเดอร์",
              "text": "ยืนยันรับออเดอร์ : " + id +'\nรหัสลูกค้า : '+uid
            },
            "style": "primary",
            "margin": "md"
          },
          {
            "type": "button",
            "action": {
              "type": "message",
              "label": "ยกเลิกออเดอร์",
              "text": "ยกเลิกออเดอร์ : " + id +'\nรหัสลูกค้า : '+uid
            },
            "style": "primary",
            "margin": "md",
            "color": "#FF0000"
          }


        ]
      },
      "styles": {
        "footer": {
          "separator": true
        }
      }
    }
  }

  return request({
    method: `POST`,
    uri: `${LINE_MESSAGING_API}/push`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      to: uidadmin,
      messages: [
        messagesJson
      ]
    })
  }).then(() => {
    return 'Push messenger Done';
  }).catch((error) => {
    return error;
  });
}

