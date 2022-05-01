// Real time listener
const showdata = document.querySelector('.wrapper');
const btnshowdata = document.querySelector('.btn-primary');
const showdataForm = document.querySelector('.wrapper .form');

// Click add user button
btnshowdata.addEventListener('click', () => {
  const idstudent = showdataForm.idstudent.value
  const password = showdataForm.password.value
  console.log('Btn click')
  console.log('idstudent') 
  console.log(idstudent) 
  console.log('password')
  console.log(password)
   select_data(idstudent,password)
  // console.log(data)
  
  });

const select_data =  (idstudent,password) => {
  var arr_data = []
  var arr_data2 = []
  var data = ''
  var wrongpass = true
  
  db.collection('users').onSnapshot(async snapshot => {
    
     snapshot.docChanges().forEach(async change => {
        // console.log(change.doc.data().idStudent)
        // console.log(change.doc.data().password)
        if(change.doc.data().idStudent === idstudent && change.doc.data().password === password){
            // console.log(change.doc.data())
            wrongpass = false
            await main(change.doc.data()) 
            await wrong_Pass(wrongpass)
        }
    })   
    await wrong_Pass(wrongpass)
  })
  // if(wrongpass === true){
  //   alert('รหัสนักศึกษาหรือรหัสผ่านผิด กรุณาตรวจสอบใหม่อีกครั้ง123')
  // }
  
  console.log('wrongpass= '+wrongpass)
  
 
}

const wrong_Pass = (wrongpass) =>{
  if(wrongpass === true){
    alert('รหัสนักศึกษาหรือรหัสผ่านผิด กรุณาตรวจสอบใหม่อีกครั้ง')
  }
}


