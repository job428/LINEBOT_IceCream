const modalWrapper = document.querySelector('.modal-wrapper');
// modal add
const addModal = document.querySelector('.add-modal');
const addModalForm = document.querySelector('.add-modal .form');

// modal edit
const editModal = document.querySelector('.edit-modal');
const editModalForm = document.querySelector('.edit-modal .form');

const btnAdd = document.querySelector('.btn-add');

const tableUsers = document.querySelector('.table-users');

let id;

// Create element and render users

const renderUser = (doc,key,remove,ref,db) => {
  
  const tr = `
    <tr data-id='${key}'>
      <td>${key}</td>
      <td>${doc.name}</td>
      <td>${doc.price}</td>
      

      <td>
        <button class="btn btn-edit">Edit</button>
        <button class="btn btn-delete">Delete</button>
      </td>
    </tr>
  `;
  tableUsers.insertAdjacentHTML('beforeend', tr);

  // Click edit user
  const btnEdit = document.querySelector(`[data-id='${key}'] .btn-edit`);
  btnEdit.addEventListener('click', () => {
    editModal.classList.add('modal-show');

    id = key;
    editModalForm.idmenu.value = key;
    editModalForm.name.value = doc.name;
    editModalForm.price.value = doc.price;
    editModalForm.imageUrl.value = doc.imageUrl;
    
    

  });

    //Click delete user
    const btnDelete = document.querySelector(`[data-id='${key}'] .btn-delete`);
    btnDelete.addEventListener('click', () => {
      // db.collection('users').doc(`${doc.id}`).delete().then(() => {
      //   console.log('Document succesfully deleted!');
      // }).catch(err => {
      //   console.log('Error removing document', err);
      // });
      console.log('delete')
      remove(ref(db, 'Menu/'+key));
      location.reload();
    });

}

// Click add user button
btnAdd.addEventListener('click', () => {
  addModal.classList.add('modal-show');
  addModalForm.name.value = '';
  addModalForm.price.value = '';
  addModalForm.imageUrl.value = '';
  

});
//course1: addModalForm.course1.value,
// User click anyware outside the modal
window.addEventListener('click', e => {
  if(e.target === addModal) {
    addModal.classList.remove('modal-show');
  }
  if(e.target === editModal) {
    editModal.classList.remove('modal-show');
  }
});



// Click submit in add modal



