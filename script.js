async function loadHeader() {
    let response = await fetch("header.html");
    let data = await response.text();
    document.getElementById("header-placeholder").innerHTML = data;
    attachHeaderEvents();

}

function attachHeaderEvents() {
    const userBtn = document.querySelector(".userInfo");
    const userAccount = document.getElementById("useraccount");
    const overlay = document.getElementById("overlay");
    const messagBtn=document.querySelector(".message-icon");
    const messageMod=document.getElementById("messageMod");
    if (userBtn) {
        userBtn.addEventListener("mouseenter", function () {
            userAccount.classList.toggle("active");
           //overlay.classList.add("active");
        });
        userAccount.addEventListener("mouseleave", function () {
            userAccount.classList.remove("active");
          // overlay.classList.remove("active");
        });
    }
    if(messagBtn){
        messagBtn.addEventListener("mouseenter", function(){
            messageMod.classList.toggle("active");
        });
        messageMod.addEventListener("mouseleave", function(){
            messageMod.classList.remove("active");
        });
    }
}

document.addEventListener("dblclick", function (event) {
    if (event.target.closest("#message-icon")) {
        let bell = document.getElementById("bell");
        let notifDot = document.getElementById("notifDot");

        bell.classList.add("shake");
        setTimeout(() => {
            bell.classList.remove("shake");
            notifDot.style.display = "block";
        }, 500);
    }
});

async function loadNav(params) {
    let response=await fetch("navigation.html");
    let data = await response.text();
    document.getElementById("navigation-placeholder").innerHTML=data;
    highlightActivePage();
}
function highlightActivePage() {
    let links = document.querySelectorAll("nav ul li a");
    let currentPage = window.location.pathname.split("/").pop(); 
    
    for(let i=0; i<links.length; i++)
    {
        if(links[i].getAttribute("href")==currentPage)
        {
            links[i].classList.add("active");
        }
    }
}
loadHeader();
loadNav();

document.addEventListener("DOMContentLoaded", function () {
    loadHeader();
    loadNav();
    
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
    let editedRow = null;

    document.querySelectorAll(".closeMod").forEach((btn) => {
        btn.addEventListener("click", function () {
            modal.classList.remove("active");
            warningModal.classList.remove("active");
            overlay.classList.remove("active");
        });
    });
    function attachEditEvent(button) {
        button.addEventListener("click", function () {
            editedRow = this.closest("tr"); 
            const cells = editedRow.getElementsByTagName("td");

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

    
    addNewBtn.addEventListener("click", function () {
        editedRow = null; 
        document.getElementById("h2Text").textContent = "Add Student";
        createBtn.textContent = "Create";
        modal.classList.add("active");
        overlay.classList.add("active");

        groupInput.value = "";
        firstNameInput.value = "";
        lastNameInput.value = "";
        birthdayInput.value = "";
    });

    cancelBtn.addEventListener("click", function () {
        modal.classList.remove("active");
        overlay.classList.remove("active");
    });
    cancelWarMod.addEventListener("click", function(){
        warningModal.classList.remove("active");
        overlay.classList.remove("active");
    });
    overlay.addEventListener("click", function () {
        modal.classList.remove("active");
        overlay.classList.remove("active");
        warningModal.classList.remove("active");

    });

    okWarMod.addEventListener("click", function () {
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

    createBtn.addEventListener("click", function () {
        const group = groupInput.value;
        const firstName = firstNameInput.value;
        const lastName = lastNameInput.value;
        const gender = genderInput.value;
        const birthday = birthdayInput.value;

        if (!group || !firstName || !lastName || !birthday) {
            alert("Please fill in all fields.");
            return;
        }

        if (createBtn.textContent === "Create") {
            // Додаємо нового студента
            const table = document.getElementById("studentTable");
            const row = document.createElement("tr");

            row.innerHTML = `
                <td><input type="checkbox"></td>
                <td>${group}</td>
                <td>${firstName} ${lastName}</td>
                <td>${gender}</td>
                <td>${birthday}</td>
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

        } else if (createBtn.textContent === "Save" && editedRow) {
            const cells = editedRow.getElementsByTagName("td");
            cells[1].textContent = group;
            cells[2].textContent = `${firstName} ${lastName}`;
            cells[3].textContent = gender;
            cells[4].textContent = birthday;
        }

        modal.classList.remove("active");
        overlay.classList.remove("active");

        groupInput.value = "";
        firstNameInput.value = "";
        lastNameInput.value = "";
        birthdayInput.value = "";
    });

    function updateSelectAllCheckbox() {
        const allCheckboxes = studentTable.querySelectorAll("tr td input[type='checkbox']");
        const checkedCheckboxes = studentTable.querySelectorAll("tr td input[type='checkbox']:checked");
        selectAllCheckbox.checked = allCheckboxes.length > 0 && allCheckboxes.length === checkedCheckboxes.length;
    }

    selectAllCheckbox.addEventListener("change", function () {
        const checkboxes = studentTable.querySelectorAll("tr td input[type='checkbox']");
        checkboxes.forEach(checkbox => checkbox.checked = selectAllCheckbox.checked);
    });

    studentTable.addEventListener("change", function (event) {
        if (event.target.type === "checkbox") {
            updateSelectAllCheckbox();
        }
    });
});


