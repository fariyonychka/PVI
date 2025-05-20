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

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
        .then(() => console.log("Service Worker зареєстровано"))
        .catch(err => console.error("Помилка реєстрації Service Worker", err));
}

const socket = io('http://localhost:3000');
