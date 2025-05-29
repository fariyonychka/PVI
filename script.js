loadHeader();
loadNav();

    let editedRow = null;
    const addNewBtn = document.querySelector(".addnew img");
    const modal = document.getElementById("modal");
    const overlay = document.getElementById("overlay");
    const cancelBtn = document.getElementById("cancel");
    const createBtn = document.getElementById("create");
    const warningModal = document.getElementById("warningModal");
    const groupInput = document.getElementById("student_group");
    const firstNameInput = document.getElementById("first_name");
    const lastNameInput = document.getElementById("last_name");
    const genderInput = document.getElementById("gender");
    const birthdayInput = document.getElementById("birthday"); 
    const cancelWarMod = document.getElementById("cancelWarMod");
    const okWarMod = document.getElementById("okWarMod");
    const selectAllCheckbox = document.querySelector("th input[type='checkbox']");
    const studentTable = document.getElementById("studentTable");
    const validationTypeElement = document.getElementById("validationType");
    const useJSValidation = validationTypeElement ? validationTypeElement.value === "js" : false;
        if (useJSValidation) {
        document.getElementById("studentForm").setAttribute("novalidate", "true");
    }
    const rowsPerPage = 5; 
    let currentPage = 1;


async function loadHeader() {
    let response = await fetch("./header.html");
    let data = await response.text();
    let headerPlaceholder = document.getElementById("header-placeholder");

    if (headerPlaceholder) {
        headerPlaceholder.innerHTML = data;
        document.dispatchEvent(new Event("headerLoaded"));
    }


}
function waitForNotificationUI(callback) {
    const check = () => {
        if (
            document.getElementById('bell') &&
            document.getElementById('notifDot') &&
            document.getElementById('messageMod')
        ) {
            callback();
        } else {
            setTimeout(check, 100); // перевіряє кожні 100мс
        }
    };
    check();
}

document.addEventListener("headerLoaded", async function () {
    try {
        const response = await safeFetch("/PVI/server/index.php/api/user", {
            method: "GET",
            headers: {
                "Cache-Control": "no-cache"
            }
        }, { silent401: true });
        console.log("Користувач з сервера:", response);
        
        const user = response;
        console.log("user:", user);
        console.log("user.login:", user?.login);
                
        attachHeaderEvents();
        
        if (user && user.login) {
            localStorage.setItem("user", JSON.stringify(user));
            console.log("renderUserUI викликано з:", user);
            renderUserUI(user);
        } else {
            localStorage.removeItem("user");

            console.log("renderUserUI викликано з: null");
            renderUserUI(null);
        }

    } catch (error) {
        if (error.message === "Unauthorized") {
            console.log("Користувач не авторизований — показуємо гостьовий режим");
        } else {
            console.warn("Не вдалося отримати user:", error);
        }
        localStorage.removeItem("user");
        attachHeaderEvents(); 
        renderUserUI(null);
    }
});
function renderUserUI(user) {
    console.log("renderUserUI викликано з:", user);
    const loginBtn = document.getElementById("loginButton");
    const logoutBtn = document.getElementById("logoutBtn"); 
    const userInfoBlock = document.getElementById("userInfo");
    const protectedElements = document.querySelectorAll(".needs-auth");
    if (!loginBtn || !logoutBtn || !userInfoBlock) {
        console.warn("❗ Один або кілька елементів не знайдені в DOM");
    }

    const isLoggedIn = user && user.id && user.login;

    if (isLoggedIn) {
        loginBtn?.classList.add("hidden");
        logoutBtn?.classList.remove("hidden");
        userInfoBlock?.classList.remove("hidden");
        const userLoginText = document.getElementById("userLoginText");

        const userChatRoomText=document.getElementById("userChatRoomText");
        if (userLoginText) {
            userLoginText.textContent = user.login;
        }
        if (userChatRoomText) {
            userChatRoomText.textContent = "Chat Room "+ user.login;
        }

        protectedElements.forEach(el => {
            el.classList.remove("disabled-link");
            el.style.pointerEvents = "auto";
            el.style.opacity = "1";
        });

            fetchStudents();

waitForNotificationUI(fetchUnreadMessages);

        
    } else {
        loginBtn?.classList.remove("hidden");
        logoutBtn?.classList.add("hidden");
        userInfoBlock?.classList.add("hidden");

        protectedElements.forEach(el => {
            el.classList.add("disabled-link");
            el.style.pointerEvents = "none"; 
            el.style.opacity = "0.5";        
        });    
    }
}


function attachHeaderEvents() {
    const userBtn = document.querySelector(".userInfo");
    const userAccount = document.getElementById("useraccount");
    const messagBtn = document.querySelector(".message-icon");
    const messageMod = document.getElementById("messageMod");

    if (userBtn && userAccount) {
        userBtn.addEventListener("mouseenter", function () {
            userAccount.classList.toggle("active");
        });

        userAccount.addEventListener("mouseleave", function () {
            userAccount.classList.remove("active");
        });
    } else {
        console.warn("Не знайдено елементи для користувацького меню.");
    }

    if (messagBtn && messageMod) {
        messagBtn.addEventListener("mouseenter", function () {
            messageMod.classList.toggle("active");
        });

        messageMod.addEventListener("mouseleave", function () {
            messageMod.classList.remove("active");
        });
    } else {
        console.warn("Не знайдено елементи для повідомлень.");
    }

    const loginModal = document.getElementById("loginModal");
    const loginBtn = document.getElementById("loginButton");
    const closeLogin = document.getElementById("closeLogin");
    const confirmLogin = document.getElementById("confirmLogin");

    loginBtn?.addEventListener("click", () => {
        loginModal.style.display = "block";
    });

    closeLogin?.addEventListener("click", () => {
        loginModal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === loginModal) {
            loginModal.style.display = "none";
        }
    });



    confirmLogin?.addEventListener("click", async (e) => { 
        e.preventDefault();
        const login = document.getElementById("loginInput").value;
        const password = document.getElementById("passwordInput").value;
    
        try {
            const data = await safeFetch("/PVI/server/index.php/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ login, password }), 
            });
    
            if (data.success) {
                console.log("Користувач залогінився:", data.user); 
            localStorage.setItem("user", JSON.stringify(data.user));
            window.location.reload();
            } else {
                throw new Error(data.error || "Невідома помилка входу");
            }
        } catch (err) {
            alert("Помилка входу: " + err.message);
        }

        
    });

    document.getElementById("logoutBtn")?.addEventListener("click", async () => {
        await safeFetch("/PVI/server/index.php/api/logout", {
            method: "POST"
        });
        localStorage.removeItem("user");
        window.location.reload(); 
    });
    
}



async function safeFetch(url, options = {}, config = {}) {
    const { silent401 = false } = config;

    try {
        const response = await fetch(url, options);
        const data = await response.json(); 

        if (!response.ok) {
            const error = new Error(data?.error || 'Unknown server error');
            error.status = response.status;
            throw error;
        }

        return data;
    } catch (error) {
        if (silent401 && error.status === 401) {
        } else {
            console.error("Fetch error:", error.message);
        }
        throw error;
    }
}
function attachEditEvent(button) {
    button.addEventListener("click", function () {
        editedRow = this.closest("tr"); 
        const cells = editedRow.getElementsByTagName("td");
        
        resetValidation();

        groupInput.value = cells[2].textContent;

        const nameParts = cells[3].textContent.split(" ");
        firstNameInput.value = nameParts[0] || "";
        lastNameInput.value = nameParts[1] || "";

        genderInput.value = cells[4].textContent;

        const dateParts = cells[5].textContent.split(".");
        if (dateParts.length === 3) {
            birthdayInput.value = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        } else {
            birthdayInput.value = cells[5].textContent;
        }

        const id = cells[1].textContent.trim();
        editedRow.dataset.id = id;

        document.getElementById("h2Text").textContent = "Edit Student";
        createBtn.textContent = "Save";
        modal.classList.add("active");
        overlay.classList.add("active");
    });
}
function attachDeleteStudentEvent(button) {
    button.addEventListener("click", function () {
        const allCheckboxes = studentTable.querySelectorAll("tr td input[type='checkbox']");
        const checkedCheckboxes = studentTable.querySelectorAll("tr td input[type='checkbox']:checked");
        
        if (checkedCheckboxes.length === allCheckboxes.length && checkedCheckboxes.length > 0) {
            document.getElementById("textWarning").textContent = `Are you sure you want to delete all students?`;
        } else {
            editedRow = this.closest("tr");
            const nameParts = editedRow.getElementsByTagName("td")[2].textContent;
            document.getElementById("textWarning").textContent = `Are you sure you want to delete user ${nameParts}?`;
        }
        
        warningModal.classList.add("active");
        overlay.classList.add("active");
    });
}

function resetValidation() {
    document.querySelectorAll(".error-span").forEach(span => {
        span.style.visibility = "hidden";
    });
    document.querySelectorAll("input").forEach(input => {
        input.classList.remove("invalid");
    });
}



async function fetchStudents() {
    try {
        const response = await fetch('/PVI/server/index.php/api/students');
        const students = await response.json();
        renderStudentsTable(students);
        paginateTable();
    } catch (error) {
        console.error("Помилка при завантаженні студентів:", error);
    }
}

function renderStudentsTable(students) {
    const tableBody = document.getElementById("studentTable");
    tableBody.innerHTML = ""; 

    students.forEach(student => {
        const row = document.createElement("tr");
        row.innerHTML = `
<td><input type="checkbox" aria-label="Select all students"></td>
            <td style="display:none;" class="studentId">${student.id}</td>
            <td>${student.student_group}</td>
            <td>${student.first_name} ${student.last_name}</td>
            <td>${student.gender}</td>
            <td>${student.birthday}</td>
            <td>
                <svg width="10" height="10">
                    <circle cx="5" cy="5" r="5" fill="${student.status === 'active' ? 'green' : 'gray'}" />
                </svg>
            </td>
            <td>
                <div class="editbutton needs-auth">
                    <img class="edit" src="edit.png" alt="edit"> 
                    <img class="trash" src="trash.png" alt="delete">
                </div>
            </td>
        `;
        tableBody.appendChild(row);
        const editBtn = row.querySelector(".editbutton img[alt='edit']");
const deleteBtn = row.querySelector(".editbutton img[alt='delete']");
if (editBtn && deleteBtn) {
    attachEditEvent(editBtn);
    attachDeleteStudentEvent(deleteBtn);
}
    });


        return data;
    } catch (error) {
        if (silent401 && error.status === 401) {
        } else {
            console.error("Fetch error:", error.message);
        }
        throw error;
    }
}


function showFormErrors(errors, prefix = "") {
    for (const field in errors) {
        console.log("Перевірка поля:", field); 
        const errorSpan = document.getElementById(`error-span-${prefix}${field}`);
        if (errorSpan) {
            errorSpan.textContent = errors[field];
            errorSpan.style.visibility = "visible";
        } else {
            console.warn(`Не знайдено span для помилки: error-span-${prefix}${field}`);
        }
    }
}





async function submitAddForm(data) {
    console.log("Дані, що надсилаються:", data); 
    const res = await fetch('/PVI/server/index.php/api/students', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    const result = await res.json();
    console.log("Відповідь сервера:", result);
    if (result.success) {
        await fetchStudents();
        modal.classList.remove("active");
        overlay.classList.remove("active");
        document.getElementById("studentForm").reset();
    } else {
        showFormErrors(result.errors);
    }
}

async function submitEditForm(id, data) {
    const res = await fetch(`/PVI/server/index.php/api/students?id=${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    const result = await res.json();
    console.log("Відповідь сервера:", result);
    if (result.success) {
        await fetchStudents();
        modal.classList.remove("active");
        overlay.classList.remove("active");
        document.getElementById("studentForm").reset();
    } else {
        showFormErrors(result.errors);
    }
}

async function deleteStudent(id) {
    const res = await fetch(`/PVI/server/index.php/api/students?id=${id}`, {
        method: 'DELETE'
    });
    const result = await res.json();
    if (result.success) {
        await fetchStudents();
    } else {
        alert(result.error || 'Не вдалося видалити студента');
    }
}

function paginateTable() {
    const table = document.getElementById("studentTable");
    const rows = Array.from(table.querySelectorAll("tr"));
    const totalPages = Math.ceil(rows.length / rowsPerPage);

    rows.forEach(row => (row.style.display = "none"));

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const rowsToShow = rows.slice(start, end);
    rowsToShow.forEach(row => (row.style.display = ""));

    const paginationContainer = document.querySelector(".pagination");
    paginationContainer.innerHTML = "";

    const prevButton = document.createElement("button");
    prevButton.innerHTML = "&lt;";
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            paginateTable();
        }
    });
    paginationContainer.appendChild(prevButton);

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement("button");
        pageButton.textContent = i;
        if (i === currentPage) {
            pageButton.classList.add("active");
        }
        pageButton.addEventListener("click", () => {
            currentPage = i;
            paginateTable();
        });
        paginationContainer.appendChild(pageButton);
    }

    const nextButton = document.createElement("button");
    nextButton.innerHTML = "&gt;";
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            paginateTable();
        }
    });
    paginationContainer.appendChild(nextButton);
}
document.addEventListener("DOMContentLoaded", paginateTable);


function renderStudentsTable(students) {
    const tableBody = document.getElementById("studentTable");
    tableBody.innerHTML = ""; 


/*document.addEventListener("dblclick", function (event) {

    if (event.target.closest("#message-icon")) {
        let bell = document.getElementById("bell");
        let notifDot = document.getElementById("notifDot");

        if (bell) bell.classList.add("shake"); 
        if (notifDot) notifDot.style.display = "block";

        setTimeout(() => {
            bell.classList.remove("shake");
            if (notifDot) notifDot.style.display = "block";
        }, 500);
    }
});

*/
async function loadNav(params) {
    let response=await fetch("./navigation.html");
    let data = await response.text();
    document.getElementById("navigation-placeholder").innerHTML=data;
    highlightActivePage();
}
function highlightActivePage() {
    let links = document.querySelectorAll("nav ul li a");
    let currentPage = window.location.pathname.split("/").pop(); 
    
    for(let i = 0; i < links.length; i++) {
        if (links[i].getAttribute("href") === currentPage) {
            links[i].classList.add("active");
            links[i].parentElement.classList.add("active"); 
        }
    }
}


document.addEventListener("DOMContentLoaded", function () {
    

    document.querySelectorAll(".closeMod").forEach((btn) => {
        btn.addEventListener("click", function () {
            modal.classList.remove("active");
            warningModal.classList.remove("active");
            overlay.classList.remove("active");
        });
    });
    document.querySelectorAll(".editbutton img[alt='edit']").forEach(attachEditEvent);
    document.querySelectorAll(".editbutton img[alt='delete']").forEach(attachDeleteStudentEvent);

    document.getElementById("studentForm")?.addEventListener("submit", function (event) {
        event.preventDefault();
        const student = {
            student_group: groupInput.value.trim(),
            first_name: firstNameInput.value.trim(),
            last_name: lastNameInput.value.trim(),
            gender: genderInput.value,
            birthday: birthdayInput.value,
            status: 'inactive'           
        };
    
        if (createBtn.textContent === "Create") {
            submitAddForm(student); 
        } else if (createBtn.textContent === "Save" && editedRow) {
            const updatedStudent = {
                ...student,
                id: editedRow.querySelector(".studentId").textContent.trim()
            };
            submitEditForm(updatedStudent.id, updatedStudent); 
        }
    
        
    
    });
    
    
    
    addNewBtn?.addEventListener("click", function () {
        editedRow = null; 

        resetValidation();

        document.getElementById("h2Text").textContent = "Add Student";
        createBtn.textContent = "Create";
        modal.classList.add("active");
        overlay.classList.add("active");

        groupInput.value = "";
        firstNameInput.value = "";
        lastNameInput.value = "";
        birthdayInput.value = "";
    });

    cancelBtn?.addEventListener("click", function () {
        modal.classList.remove("active");
        overlay.classList.remove("active");
    });
    cancelWarMod?.addEventListener("click", function(){
        warningModal.classList.remove("active");
        overlay.classList.remove("active");
    });
    overlay?.addEventListener("click", function () {
        modal.classList.remove("active");
        overlay.classList.remove("active");
        warningModal.classList.remove("active");

    });

    okWarMod?.addEventListener("click", function () {
        const checkedCheckboxes = studentTable.querySelectorAll("tr td input[type='checkbox']:checked");
    
        checkedCheckboxes.forEach(async checkbox => {
            const row = checkbox.closest("tr");
            const id = row.querySelector(".studentId")?.textContent?.trim();
            if (id) await deleteStudent(id);
        });
    
        warningModal.classList.remove("active");
        overlay.classList.remove("active");
    });

    
    function addStudentToTable(student) {
        const table = document.getElementById("studentTable");
        const row = document.createElement("tr");
    
        row.innerHTML = `
            <td><input type="checkbox"></td>
            <td style="display:none;" class="studentId">0</td>
            <td>${student.student_group}</td>
            <td>${student.first_name} ${student.last_name}</td>
            <td>${student.gender}</td>
            <td>${student.birthday}</td>
            <td>
                <svg width="10" height="10">
                    <circle cx="5" cy="5" r="5" fill="gray" />
                </svg>
            </td>
            <td>
                <div class="editbutton">
                    <img class="edit" src="edit.png" alt="edit">
                    <img class="trash" src="trash.png" alt="delete">
                </div>
            </td>
        `;
    
        table.appendChild(row);
        attachEditEvent(row.querySelector(".editbutton img[alt='edit']"));
        attachDeleteStudentEvent(row.querySelector(".editbutton img[alt='delete']"));
    }
    
    function updateSelectAllCheckbox() {
        const allCheckboxes = studentTable.querySelectorAll("tr td input[type='checkbox']");
        const checkedCheckboxes = studentTable.querySelectorAll("tr td input[type='checkbox']:checked");
        selectAllCheckbox.checked = allCheckboxes.length > 0 && allCheckboxes.length === checkedCheckboxes.length;
    }

    selectAllCheckbox?.addEventListener("change", function () {
        const checkboxes = studentTable.querySelectorAll("tr td input[type='checkbox']");
        checkboxes.forEach(checkbox => checkbox.checked = selectAllCheckbox.checked);
    });

    studentTable?.addEventListener("change", function (event) {
        if (event.target.type === "checkbox") {
            updateSelectAllCheckbox();
        }
    });
});


/*if ("serviceWorker" in navigator) {

    navigator.serviceWorker.register("./sw.js")
        .then(() => console.log("Service Worker зареєстровано"))
        .catch(err => console.error("Помилка реєстрації Service Worker", err));
}
*/



let modalMode = 'create'; 
let selectedChatId = null;
let existingParticipants = [];
let activeChatId = null;
let activeChatParticipants = [];

const socket = io('http://localhost:3000');

document.addEventListener('DOMContentLoaded', () => {
   const user = JSON.parse(localStorage.getItem('user'));
    const studentId = user?.id;

    if (studentId) {
        socket.emit('userConnected', studentId);
        joinAllChatRooms(studentId);

        fetchUnreadMessages();

        if (window.location.pathname.includes('messages')) {
            const newChatBtn = document.getElementById('newChatBtn');
            const createChatBtn = document.getElementById('createChatBtn');
            const closeModalBtn = document.getElementById('closeModalBtn');
            const addMemberBtn = document.getElementById('addMemberBtn');

            if (newChatBtn) newChatBtn.addEventListener('click', handleNewChatClick);
            if (createChatBtn) createChatBtn.addEventListener('click', handleModalSubmit);
            if (closeModalBtn) closeModalBtn.addEventListener('click', closeNewChatModal);
            if (addMemberBtn) addMemberBtn.addEventListener('click', handleAddMembersToChat);

            loadChatRooms(studentId);
        }
    }
});

async function joinAllChatRooms(studentId) {
    try {
        const res = await fetch(`http://localhost:3000/chatrooms/${studentId}`, {
            cache: 'no-store'
        });
        const chatRooms = await res.json();
        chatRooms.forEach(chat => {
            socket.emit('joinRoom', chat.id);
            console.log(`Приєднано до кімнати ${chat.id}`);
        });
    } catch (err) {
        console.error('Помилка при завантаженні чатів для приєднання:', err);
    }
}

socket.on('userStatusUpdate', ({ userId, status }) => {
    console.log(`Статус користувача ${userId} змінено на ${status}`);
    if (window.location.pathname.includes('messages') && activeChatParticipants) {
        // Оновлюємо статус у activeChatParticipants
        activeChatParticipants = activeChatParticipants.map((participant) => {
            if (participant.id.toString() === userId.toString()) {
                return { ...participant, status };
            }
            return participant;
        });
        updateChatRoomUI();
    }
});

function updateChatRoomUI() {
    const avatars = document.getElementById('memberAvatars');
if (!avatars || !activeChatParticipants) {
        console.log('memberAvatars або activeChatParticipants відсутні');
        return;
    }
    avatars.innerHTML = '';
    activeChatParticipants.forEach((participant) => {
        const div = document.createElement('div');
        div.className = `avatar ${participant.status === 'active' ? 'active' : 'inactive'}`;
        div.title = `${participant.first_name} ${participant.last_name} (${participant.status})`;
        div.innerHTML = `<img class="user-ic" src="usericon.png" alt="user">`;
        avatars.appendChild(div);
    });
}

async function handleNewChatClick() {
  modalMode = 'create';
  selectedChatId = null;
  existingParticipants = [];

  const modal = document.getElementById('newChatModal');
  const studentList = document.getElementById('studentList');
  const createBtn = document.getElementById('createChatBtn');

  createBtn.textContent = "➕ Створити чат";

  studentList.innerHTML = '';

  try {
    const res = await fetch('http://localhost:3000/students', { cache: 'no-store' });
    const students = await res.json();

    students.forEach(student => {
      const li = document.createElement('li');
      li.innerHTML = `
        <label>
          <input type="checkbox" value="${student.id}"> 
          ${student.first_name} ${student.last_name} — ${student.status}
        </label>
      `;
      studentList.appendChild(li);
    });

    modal.classList.remove('hiddenChat');
  } catch (err) {
    alert('❌ Помилка при завантаженні студентів');
    console.error(err);
  }
}


async function handleCreateChat() {
  const checkboxes = document.querySelectorAll('#studentList input:checked');
  const participantIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

  if (participantIds.length < 2) {
    alert('❗ Оберіть щонайменше двох учасників');
    return;
  }

    try {
    const res = await fetch('http://localhost:3000/chatrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ participants: participantIds })
    });

    const data = await res.json();
    alert(data.message || '✅ Чат створено');
    await new Promise(r => setTimeout(r, 1000));
    const user = JSON.parse(localStorage.getItem("user"));
    const studentId = user?.id; 
    await loadChatRooms(studentId);
    console.log('Чати перезавантажено');
    closeNewChatModal();
    } catch (err) {
    alert('❌ Помилка при створенні чату');
    console.error(err);
  } 

}

function closeNewChatModal() {
  const modal = document.getElementById('newChatModal');
  modal.classList.add('hiddenChat');
}

async function loadChatRooms(currentStudentId) {
  try {
    const res = await fetch(`http://localhost:3000/chatrooms/${currentStudentId}`, {
        cache: 'no-store'
    });
    const chatRooms = await res.json();

    const chatList = document.getElementById('chatList');
    chatList.innerHTML = ''; 
    console.log("🔁 Отримані чати:", chatRooms); 

    chatRooms.forEach(chat => {
      const li = document.createElement('li');
      li.className = 'chat';
      li.dataset.chatId = chat.id;
      li.dataset.members = JSON.stringify(chat.participants); 
      const otherParticipants = chat.participants.filter(p => p.id !== currentStudentId);
      const names = otherParticipants.map(p => p.first_name).join(', ');
      const chatTitle = names ? `Chat з ${names}` : `Chat`;
      li.innerHTML = `<img class="user-ic" src="usericon.png" alt="user">${chatTitle}`;
      li.addEventListener('click', async () =>await  openChatRoom(chat.id, chat.participants));
      chatList.appendChild(li);
    });

    if (chatRooms.length > 0) {
      await openChatRoom(chatRooms[0].id, chatRooms[0].participants);
    }
  } catch (err) {
    console.error('Помилка при завантаженні чатів:', err);
  }
}

async function openChatRoom(chatId, participants) {
  activeChatId = chatId; 
  activeChatParticipants = participants; 
  localStorage.setItem('activeChatId', chatId); 
  socket.emit('joinRoom', chatId);
  const chatTitle = document.getElementById('userChatRoomText');
  const user = JSON.parse(localStorage.getItem('user'));
  const otherParticipants = participants.filter(p => p.id !== user.id);
  const names = otherParticipants.map(p => p.first_name).join(', ');

  chatTitle.textContent = `Chat з ${names || 'собою'}`;

  const avatars = document.getElementById('memberAvatars');
  avatars.innerHTML = '';

  updateChatRoomUI();
  loadMessages(chatId);

  const chats = document.querySelectorAll('.chat');
  chats.forEach(li => {
    li.classList.toggle('selected', li.dataset.chatId == chatId);
  });
try {
  const res = await fetch(`http://localhost:3000/unread/${user.id}/${chatId}`, { method: 'DELETE' });
  if (!res.ok) {
    console.error("DELETE failed with status", res.status);
  }
} catch (e) {
  console.error("DELETE fetch error:", e);
}


    document.getElementById('notifDot').style.display = 'none';

}


async function handleAddMembersToChat() {
const activeChatId = localStorage.getItem('activeChatId'); 

  if (!activeChatId || !activeChatParticipants.length) {
    alert("❗ Спочатку виберіть чат");
    return;
  }

  modalMode = 'add';
  selectedChatId = activeChatId;
  existingParticipants = activeChatParticipants.map(p => p.id);

  const modal = document.getElementById('newChatModal');
  const studentList = document.getElementById('studentList');
  const createBtn = document.getElementById('createChatBtn');

  studentList.innerHTML = '';

  try {
    const res = await fetch('http://localhost:3000/students', { cache: 'no-store' });
    const allStudents = await res.json();

    const notInChat = allStudents.filter(s => !existingParticipants.includes(s.id));

    if (notInChat.length === 0) {
      alert("✅ Всі користувачі вже є в чаті");
      return;
    }

    notInChat.forEach(student => {
      const li = document.createElement('li');
      li.innerHTML = `
        <label>
          <input type="checkbox" value="${student.id}"> 
          ${student.first_name} ${student.last_name} — ${student.status}
        </label>
      `;
      studentList.appendChild(li);
    });

    createBtn.textContent = "➕ Додати до чату";
    modal.classList.remove('hiddenChat');
  } catch (err) {
    alert("❌ Помилка при завантаженні студентів");
    console.error(err);
  }
}



async function handleAddSelectedMembersToChat(chatId, existingIds) {
  const checkboxes = document.querySelectorAll('#studentList input:checked');
  const newIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

  if (newIds.length === 0) {
    alert("❗ Оберіть хоча б одного нового учасника");
    return;
  }

  const updatedIds = [...new Set([...existingIds, ...newIds])];

  try {
    const res = await fetch(`http://localhost:3000/chatrooms/${chatId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ participants: updatedIds })
    });

    const data = await res.json();
    alert(data.message || "✅ Учасники додані");

    const user = JSON.parse(localStorage.getItem("user"));
    const studentId = user?.id;
    await loadChatRooms(studentId);

    closeNewChatModal();
  } catch (err) {
    alert("❌ Помилка при оновленні чату");
    console.error(err);
  }
}

async function handleModalSubmit() {
  const checkboxes = document.querySelectorAll('#studentList input:checked');
  const selectedIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

  if (modalMode === 'create') {
    if (selectedIds.length < 2) {
      alert('❗ Оберіть щонайменше двох учасників');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/chatrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ participants: selectedIds })
      });

      const data = await res.json();
      alert(data.message || '✅ Чат створено');
    } catch (err) {
      alert('❌ Помилка при створенні чату');
      console.error(err);
    }

  } else if (modalMode === 'add') {
    if (selectedIds.length === 0) {
      alert("❗ Оберіть хоча б одного нового учасника");
      return;
    }

    const updatedIds = [...new Set([...existingParticipants, ...selectedIds])];

    try {
      const res = await fetch(`http://localhost:3000/chatrooms/${selectedChatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ participants: updatedIds })
      });

      const data = await res.json();
      alert(data.message || "✅ Учасники додані");
    } catch (err) {
      alert("❌ Помилка при оновленні чату");
      console.error(err);
    }
  }

  const user = JSON.parse(localStorage.getItem("user"));
  const studentId = user?.id;
  await loadChatRooms(studentId);
  closeNewChatModal();
}

async function loadMessages(chatRoomId) {
  const container = document.getElementById('chatMessages');
  container.innerHTML = '';

  try {
    const res = await fetch(`http://localhost:3000/messages/${chatRoomId}`, {
      cache: 'no-store'
    });
    const messages = await res.json();
    const user = JSON.parse(localStorage.getItem('user'));

    messages.forEach(msg => {
      const div = document.createElement('div');
      div.className = 'message ' + (msg.authorId === user.id ? 'sent' : 'received');

      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      bubble.textContent = msg.text;

      const sender = document.createElement('span');
      sender.className = 'sender';
      sender.innerHTML = `<img class="user-ic" src="usericon.png" alt="user">${msg.authorName}`;

      if (msg.authorId === user.id) {
        div.appendChild(bubble);
        div.appendChild(sender);
      } else {
        div.appendChild(sender);
        div.appendChild(bubble);
      }

      container.appendChild(div);
    });

    container.scrollTop = container.scrollHeight;
  } catch (err) {
    console.error("❌ Помилка при завантаженні повідомлень:", err);
  }
}

socket.on('newMessage', (message) => {
    console.log('Нове повідомлення:', message);

    const user = JSON.parse(localStorage.getItem('user'));
    console.log('Поточний користувач:', user);

    const activeChatId = localStorage.getItem('activeChatId');
    console.log('activeChatId:', activeChatId);

    if (message.authorId === user.id) {
        console.log('Повідомлення від себе — рендерю');
        if (window.location.pathname.includes('messages') && message.chatRoomId === activeChatId) {
            renderMessage(message);
        }
        return;
    }

    if (
        window.location.pathname.includes('messages') &&
        message.chatRoomId === activeChatId
    ) {
        console.log('Відображення повідомлення у відкритому чаті');
        renderMessage(message);
        fetch(`http://localhost:3000/unread/${user.id}/${message.chatRoomId}`, { method: 'DELETE' })
            .catch(err => console.error('Помилка при видаленні непрочитаних:', err));
        return;
    }

    console.log('Показ сповіщення дзвіночком');
    waitForNotificationUI(() => showNotification(message));
    if (message.authorId !== user.id) {
        fetchUnreadMessages();
    }
});

document.getElementById('sendMessageBtn').addEventListener('click', () => {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  const activeChatId = localStorage.getItem('activeChatId'); 
  if (!text || !activeChatId) return;

  const user = JSON.parse(localStorage.getItem('user'));

  const messageData = {
    chatRoomId: activeChatId,
    authorId: user.id,
    authorName: `${user.login}`,
    text: text
  };

  socket.emit('sendMessage', messageData);
  input.value = '';
});

function renderMessage(message) {
  const messagesContainer = document.getElementById('chatMessages');
  const user = JSON.parse(localStorage.getItem('user'));

  const isOwnMessage = message.authorId === user.id;
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isOwnMessage ? 'sent' : 'received'}`;

  const senderSpan = document.createElement('span');
  senderSpan.className = 'sender';
  senderSpan.innerHTML = `<img class="user-ic" src="usericon.png" alt="user">${message.authorName}`;

  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'bubble';
  bubbleDiv.textContent = message.text;

  if (isOwnMessage) {
    messageDiv.appendChild(bubbleDiv);
    messageDiv.appendChild(senderSpan);
  } else {
    messageDiv.appendChild(senderSpan);
    messageDiv.appendChild(bubbleDiv);
  }

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight; 
}

function showNotification(message) {
    const notifDot = document.getElementById('notifDot');
    const bell = document.getElementById('bell');
    const messageMod = document.getElementById('messageMod');

    if (bell) bell.classList.add("shake"); 
    if (notifDot) notifDot.style.display = "block";

        setTimeout(() => {
            bell.classList.remove("shake");
            if (notifDot) notifDot.style.display = "block";
        }, 500);

  const newMsg = document.createElement('div');
  newMsg.className = 'wholeMessage';
  newMsg.innerHTML = `
    <div class="iconUserMessag">
        <img src="usericon.png" alt="user">
        <p class="nameUserMessag">${message.authorName}</p>
    </div>
    <div class="messageText">${message.text}</div>
  `;

  newMsg.addEventListener('click', () => {
    localStorage.setItem('redirectToChatId', message.chatRoomId);
    window.location.href = 'messages.html';
  });

  messageMod.prepend(newMsg);
}

document.addEventListener('DOMContentLoaded', () => {
    const redirectChatId = localStorage.getItem('redirectToChatId');
    if (redirectChatId) {
        localStorage.removeItem('redirectToChatId');
        setTimeout(async () => {
            const target = document.querySelector(`.chat[data-chat-id="${redirectChatId}"]`);
            if (target) {
                target.click();
                const user = JSON.parse(localStorage.getItem('user'));
                await fetch(`http://localhost:3000/unread/${user.id}/${redirectChatId}`, { method: 'DELETE' });
                document.getElementById('notifDot').style.display = 'none';
            }
        }, 500);
    }
});

async function fetchUnreadMessages() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return;

  const res = await fetch(`http://localhost:3000/unread/${user.id}`);
  const messages = await res.json();

  if (messages.length) {
    const bell = document.getElementById('bell');
    const notifDot = document.getElementById('notifDot');
    const messageMod = document.getElementById('messageMod');

    bell?.classList.add("shake");
    notifDot.style.display = "block";

    messageMod.innerHTML = '';

    messages.forEach((msg) => {
      const div = document.createElement('div');
      div.className = 'wholeMessage';
      div.innerHTML = `
        <div class="iconUserMessag">
            <img src="usericon.png" alt="user">
            <p class="nameUserMessag">${msg.authorName}</p>
        </div>
        <div class="messageText">${msg.text}</div>
      `;

      div.addEventListener('click', () => {
        localStorage.setItem('redirectToChatId', msg.chatRoomId);
        window.location.href = 'messages.html';
      });

      messageMod.appendChild(div);
    });
  }
}

window.addEventListener('beforeunload', () => {
  localStorage.removeItem('activeChatId');
});
