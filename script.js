async function loadHeader() {
    let response = await fetch("header.html");
    let data = await response.text();
    document.getElementById("header-placeholder").innerHTML = data;
}

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

document.addEventListener("DOMContentLoaded", function () {
    loadHeader();
    loadNav();
    
    const addNewBtn = document.querySelector(".addnew img");
    const modal = document.getElementById("modal");
    const overlay = document.getElementById("overlay");
    const cancelBtn = document.getElementById("cancel");
    const createBtn = document.getElementById("create");

    const groupInput = document.getElementById("group");
    const firstNameInput = document.getElementById("firstName");
    const lastNameInput = document.getElementById("lastName");
    const genderInput = document.getElementById("gender");
    const birthdayInput = document.getElementById("birthday"); 

    let editedRow = null;

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

    document.querySelectorAll(".editbutton img[alt='edit']").forEach(attachEditEvent);

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

    overlay.addEventListener("click", function () {
        modal.classList.remove("active");
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
                        <img src="trash.png" alt="delete person">
                    </div>
                </td>
            `;

            table.appendChild(row);

            attachEditEvent(row.querySelector(".editbutton img[alt='edit']"));

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
});


