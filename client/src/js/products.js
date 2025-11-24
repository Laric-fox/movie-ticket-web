let currentTab = 'all';
let qty = 1;
let currentPrice = 0;
let productsData = [];

async function fetchProduct() {
    try {
        const res = await fetch("./data/data.json");
        productsData = await res.json();
        renderSidebar();
        renderTab("all");
    } catch (err) {
        console.error("Không thể load data.json:", err);
    }
}

function renderSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.innerHTML = `<h2>Danh mục</h2>`;

    const tabs = [
        { key: "all", label: "Tất cả" },
        { key: "hot", label: "Hot" },
        ...productsData.map(d => ({ key: d.category, label: d.category }))
    ];

    tabs.forEach((t, i) => {
        const btn = document.createElement("button");
        btn.textContent = t.label;
        if (i === 0) btn.classList.add("active");
        btn.onclick = () => changeTab(t.key, btn);
        sidebar.appendChild(btn);
    });
}

function changeTab(tab, btn) {
    document.querySelectorAll(".sidebar button")
        .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
    currentTab = tab;

    renderTab(tab);
}

function renderTab(tab) {
    const content = document.getElementById("content");
    const oldSlide = content.querySelector(".slide-page.active");

    let list = [];

    if (tab === "all") {
        productsData.forEach(d => list.push(...d.products));
    } else if (tab === "hot") {
        productsData.forEach(d => list.push(...d.products.filter(p => p.hot)));
    } else {
        const cat = productsData.find(d => d.category === tab);
        if (cat) list = cat.products;
    }

    const slide = document.createElement("div");
    slide.className = "slide-page";
    slide.innerHTML = `
        <h2>${tab === "all" ? "Tất cả" : tab === "hot" ? "Hot" : tab}</h2>
        <div class="products"></div>
    `;
    content.appendChild(slide);

    const grid = slide.querySelector(".products");

    list.forEach(p => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <img src="${p.img}">
            <p>${p.name}</p>
            <p>${p.price.toLocaleString()}₫</p>
            <button onclick="openPopup('${p.name}',${p.price})">Đặt mua</button>
        `;
        grid.appendChild(card);
    });

    slide.style.display = "block";
    setTimeout(() => slide.classList.add("active"), 10);

    if (oldSlide) {
        oldSlide.classList.remove("active");
        setTimeout(() => oldSlide.remove(), 350);
    }
}

function openPopup(name, price) {
    document.getElementById("popup").style.display = "flex";
    document.getElementById("popup-title").textContent = name;
    qty = 1;
    currentPrice = price;

    document.getElementById("qty").textContent = qty;
    document.getElementById("total-price-btn").textContent =
        "Mua với giá " + (qty * price).toLocaleString() + "₫";
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
}

function changeQty(n) {
    qty += n;
    if (qty < 1) qty = 1;

    document.getElementById("qty").textContent = qty;
    document.getElementById("total-price-btn").textContent =
        "Mua với giá " + (qty * currentPrice).toLocaleString() + "₫";
}

function addToCart() {
    alert(`Đã thêm ${qty} SP (${(qty * currentPrice).toLocaleString()}₫)`);
}

fetchProduct();
