const itemsPerPage = 100;
let pageIndex = 0;

const nav = document.getElementById('nav');
let grid = document.querySelector(".products");
let imageBox = document.getElementById('imageBox');
var acc = document.getElementsByClassName("accordion");
var z;

let items;
let mintedNumber = 0;

async function fetchData() {
    try {
        const itemsResponse = await fetch('data/items.json');
        if (!itemsResponse.ok) {
            throw new Error('Network response for items.json was not ok');
        }
        const itemsData = await itemsResponse.json();

        let statusData = {
            mintedNumber: 0,
            data: [null]
        };

        try {
            const statusResponse = await fetch('data/status.json');

            if (statusResponse.ok) {
                const newStatusData = await statusResponse.json();

                if ('mintedNumber' in newStatusData) {
                    mintedNumber = newStatusData.mintedNumber;
                    delete newStatusData.mintedNumber;
                }

                statusData = { ...statusData, ...newStatusData };
            }
        } catch (error) {
            console.error('Error fetching status.json:', error);
        }

        items = itemsData.map((item, index) => {
            return { ...item, inscriptionid: statusData.data[index] || null };
        });

        sortOutData();
        updatePageWithData()
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

fetchData();

for (z = 0; z < acc.length; z++) {
    acc[z].addEventListener("click", function () {
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel.style.display === "block") {
            panel.style.display = "none";
        } else {
            panel.style.display = "block";
        }
    });
}

function sortOutData() {
    grid.innerHTML = "";
    for (let i = pageIndex * itemsPerPage; i < (pageIndex * itemsPerPage) + itemsPerPage; i++) {
        if (!items[i]) { break; }
        addElement(grid, i);
        addListener(i);
    }
    loadPageNav();
}

function loadPageNav() {
    nav.innerHTML = "";
    for (let i = 0; i < (items.length / itemsPerPage); i++) {
        const span = document.createElement('span');
        span.innerHTML = `
            <button class="pageButton text-xl">${i + 1}</button>
        `;
        span.addEventListener('click', (e) => {
            pageIndex = e.target.innerHTML - 1;
            sortOutData();
        });
        if (i === pageIndex) {
            span.style.color = "rgb(255, 255, 255, 0.5)";
        }
        nav.append(span);
    }
    topFunction();
}

function addElement(appendIn, i) {
    let div = document.createElement('div');
    let { hash, image, name, inscriptionid } = items[i];

    if (inscriptionid == null) {
        div.className = "card item justify-self-center";
        div.innerHTML = `
            <div class="card item justify-self-center">
                <a href="${image}" target="_blank" download>
                    <img src ="${image}" class="bg-cover img" alt="img1">
                </a>
                <div class="container text-center ">
                    <a href="${image}" target="_blank" download>
                        <h1 class="title text-sm py-1 ">${name}</h1>  
                    </a>
                    <hr>
                    <button class="checkButton text-sm text-white" id="${hash}">Check</button>
                </div>
            </div>`;
    } else {
        div.className = "cardTaken item justify-self-center";
        div.innerHTML = `
            <div class="cardTaken item justify-self-center">
                <img src = "${image}" class="bg-cover img na" alt="img1">
                <div class="container text-center ">
                    <h1 class="title py-1 text-sm text-gray-500">${name}</h1>
                    <hr class = "na">                  
                    <button class="doneButton text-gray-500 text-sm" id="${hash}">TAKEN</button>        
                </div>
            </div>`;
    }
    appendIn.appendChild(div);
}

function addListener(i) {
    let { hash, name } = items[i];
    var button = document.getElementById(`${hash}`);
    button.addEventListener('click', function () {
        imClicked(i);
    });
}

async function imClicked(index) {
    if (items[index].inscriptionid === null) {
        const response = await fetch(`https://api2.ordinalsbot.com/search?hash=${items[index].hash}`);

        if (!response.ok) {
            showError();
            throw new Error("Bad Response", {
                cause: {
                    response,
                }
            });
        } else {
            const res = await response.json();
            showImage(res);
        }
    } else {
        let myNFT = document.createElement('div');
        myNFT.classList.add('alert');
        let earliestInscriptionId = items[index].inscriptionid;
        myNFT.classList.add('taken');
        myNFT.innerHTML = `
            <h1 class="text-lg font-large">Too Slow!</h1>
            <p>Already inscribed with the ID </p> 
            <a href="https://www.ord.io/${earliestInscriptionId}" target="_blank"> <u>${earliestInscriptionId}</u> </a>
        `;
        imageBox.appendChild(myNFT);
        setTimeout(() => {
            myNFT.remove();
        }, 6000);
    }

    function showImage(res) {
        let myNFT = document.createElement('div');
        myNFT.classList.add('alert');
        if (res.count >= 1) {
            let earliestInscriptionId = getEarliestInscriptionId(res);
            myNFT.classList.add('taken');
            myNFT.innerHTML = `
                <h1 class="text-lg font-large">Too Slow!</h1>
                <p>Already inscribed with the ID </p> 
                <a href="https://www.ord.io/${earliestInscriptionId}" target="_blank"> <u>${earliestInscriptionId}</u> </a>
            `;
        } else if (res.count === 0) {
            myNFT.classList.add('ok');
            myNFT.innerHTML = `
                <h1 class="text-lg font-large">Looks Good!</h1>
                <p>No confirmed inscriptions found</p> 
                <p style="color:#d43737;">NOTE: always double check <a href="https://unisat.io/" target="_blank"><u>Unisat</u></a> for unconfirmed inscriptions</p>
            `;
        }
        imageBox.appendChild(myNFT);
        setTimeout(() => {
            myNFT.remove();
        }, 6000);
    }

    function getEarliestInscriptionId(res) {
        let results = res.results;

        if (!results || results.length === 0) {
            return null;
        }

        let earliestDate = new Date(results[0].createdat);
        let earliestInscriptionId = results[0].inscriptionid;

        for (let i = 1; i < results.length; i++) {
            let currentDate = new Date(results[i].createdat);

            if (currentDate < earliestDate) {
                earliestDate = currentDate;
                earliestInscriptionId = results[i].inscriptionid;
            }
        }

        return earliestInscriptionId;
    }
}

function showError() {
    let myNFT = document.createElement('div');
    myNFT.classList.add('alert');
    myNFT.classList.add('taken');
    myNFT.innerHTML = `
        <h1 class="text-lg font-large">Whoops!</h1>
        <p>Issue checking the status, try again later</p> 
    `;
    imageBox.appendChild(myNFT);
    setTimeout(() => {
        myNFT.remove();
    }, 6000);
}

function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

function updatePageWithData() {
    fetch('data/meta.json')
        .then(response => response.json())
        .then(data => {
            document.getElementById('pageTitle').innerText = `${data.name} - OMINT Collection`;
            document.getElementById('collectionInfo').innerText = `${data.supply} ${data.name}, FIRST IS FIRST!`;
            document.getElementById('mintInfo').innerText = `${mintedNumber}+ Minted!`;
            document.getElementById('twitterLink').href = data.twitter_link;
        })
        .catch(error => console.error('Error fetching meta.json:', error));
}