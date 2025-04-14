loadHeader();
loadNav();
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
            console.log("🔧 renderUserUI викликано з: null");
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
        if (userLoginText) {
            userLoginText.textContent = user.login;
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

async function fetchStudents() {
    try {
        const response = await fetch('/PVI/server/index.php/api/students');
        const students = await response.json();
        renderStudentsTable(students);
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
        <td><input type="checkbox"></td>
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
    });
}
document.addEventListener("dblclick", function (event) {
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

let editedRow = null;
document.addEventListener("DOMContentLoaded", function () {
    
    const addNewBtn = document.querySelector(".addnew img");
    const modal = document.getElementById("modal");
    const overlay = document.getElementById("overlay");
    const cancelBtn = document.getElementById("cancel");
    const createBtn = document.getElementById("create");
    const warningModal = document.getElementById("warningModal");
    const groupInput = document.getElementById("group");
    const firstNameInput = document.getElementById("firstName");
    const lastNameInput = document.getElementById("lastName");
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


    document.querySelectorAll(".closeMod").forEach((btn) => {
        btn.addEventListener("click", function () {
            modal.classList.remove("active");
            warningModal.classList.remove("active");
            overlay.classList.remove("active");
        });
    });

    function resetValidation() {
        document.querySelectorAll(".error-span").forEach(span => {
            span.style.visibility = "hidden";
        });
        document.querySelectorAll("input").forEach(input => {
            input.classList.remove("invalid");
        });
    }
    function attachEditEvent(button) {
        button.addEventListener("click", function () {
            editedRow = this.closest("tr"); 
            const cells = editedRow.getElementsByTagName("td");
            
            resetValidation();

            groupInput.value = cells[1].textContent;
            const nameParts = cells[2].textContent.split(" ");
            firstNameInput.value = nameParts[0] || "";
            lastNameInput.value = nameParts[1] || "";
            genderInput.value = cells[3].textContent;

            const dateParts = cells[4].textContent.split(".");
            if (dateParts.length === 3) {
                birthdayInput.value = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
            } else {
                birthdayInput.value = cells[4].textContent;
            }

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
    document.querySelectorAll(".editbutton img[alt='edit']").forEach(attachEditEvent);
    document.querySelectorAll(".editbutton img[alt='delete']").forEach(attachDeleteStudentEvent);

    document.getElementById("studentForm")?.addEventListener("submit", function (event) {
        if (useJSValidation) {
            event.preventDefault(); 
            if (!validateStudent({
                group: groupInput.value.trim(),
                firstName: firstNameInput.value.trim(),
                lastName: lastNameInput.value.trim(),
                gender: genderInput.value,
                birthday: birthdayInput.value
            })) {
                return; 
            }
        } else {
            event.preventDefault(); 
        }
    
        const student = {
            group: groupInput.value.trim(),
            firstName: firstNameInput.value.trim(),
            lastName: lastNameInput.value.trim(),
            gender: genderInput.value,
            birthday: birthdayInput.value
        };
    
        if (createBtn.textContent === "Create") {
            addStudentToTable(student);
        } else if (createBtn.textContent === "Save" && editedRow) {
            const cells = editedRow.getElementsByTagName("td");
            cells[1].textContent = student.group;
            cells[2].textContent = `${student.firstName} ${student.lastName}`;
            cells[3].textContent = student.gender;
            cells[4].textContent = student.birthday;
            console.log("Updated Student:", JSON.stringify(student, null, 2));

        }
    
        modal.classList.remove("active");
        overlay.classList.remove("active");
    
        document.getElementById("studentForm").reset();
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
    
        if (checkedCheckboxes.length > 0) {
            checkedCheckboxes.forEach(checkbox => checkbox.closest("tr").remove());
        } else if (editedRow) {
            editedRow.remove();
            editedRow = null;
        }
    
        warningModal.classList.remove("active");
        overlay.classList.remove("active");
    });

    function validateStudent(student) {
        let isValid = true;
    
        document.querySelectorAll(".error-span").forEach(span => span.style.visibility = "hidden");
        document.querySelectorAll("input").forEach(input => input.classList.remove("invalid"));
    
        let groupInput = document.getElementById("group");
        let firstNameInput = document.getElementById("firstName");
        let lastNameInput = document.getElementById("lastName");
        let genderInput = document.getElementById("gender");
        let birthdayInput = document.getElementById("birthday");
    
        if (typeof useJSValidation !== "undefined" && !useJSValidation) {
            return true; 
        }
    
        const groupPattern = /^[A-Z]{2}-\d{2}$/;
        if (!groupPattern.test(student.group)) {
            document.getElementById("error-span-group").style.visibility = "visible";
            groupInput.classList.add("invalid");
            isValid = false;
        }
    
        const namePattern = /^[A-Z][a-z]+([-'’][A-Z]?[a-z]+)*$/;
        if (!namePattern.test(student.firstName)) {
            document.getElementById("error-span-name").style.visibility = "visible";
            firstNameInput.classList.add("invalid");
            isValid = false;
        } 
    
        if (!namePattern.test(student.lastName)) {
            document.getElementById("error-span-surname").style.visibility = "visible";
            lastNameInput.classList.add("invalid");
            isValid = false;
        }
    
        if (!student.gender) {
            document.getElementById("error-span-gender").style.visibility = "visible";
            genderInput.classList.add("invalid");
            isValid = false;
        }
    
        const today = new Date();
        const minAge = 16; 
        const maxAge = 100; 
        const birthday = new Date(student.birthday);
    
        if (!student.birthday || isNaN(birthday.getTime())) {
            document.getElementById("error-span-date").style.visibility = "visible";
            birthdayInput.classList.add("invalid");
            isValid = false;
        } else {
            let age = today.getFullYear() - birthday.getFullYear();
            let monthDiff = today.getMonth() - birthday.getMonth();
            let dayDiff = today.getDate() - birthday.getDate();
    
            if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                age--; 
            }
    
            if (age < minAge || age > maxAge) {
                document.getElementById("error-span-date").style.visibility = "visible";
                birthdayInput.classList.add("invalid");
                isValid = false;
            }
        }
    
        return isValid;
    }
    
    function addStudentToTable(student) {
        const table = document.getElementById("studentTable");
        const row = document.createElement("tr");
    
        row.innerHTML = `
            <td><input type="checkbox"></td>
            <td>${student.group}</td>
            <td>${student.firstName} ${student.lastName}</td>
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
