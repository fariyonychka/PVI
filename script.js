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
        });

