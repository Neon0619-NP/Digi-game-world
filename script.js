console.log("Digi Game World Loaded");

// LOADING SCREEN
window.addEventListener("load", () => {
    const loader = document.getElementById("loader");

    if (loader) {
        setTimeout(() => {
            loader.style.display = "none";
        }, 800);
    }
});

// ACTIVE NAV LINK
const links = document.querySelectorAll("nav ul li a");

links.forEach(link => {
    if (link.href === window.location.href) {
        link.style.color = "#00f7ff";
        link.style.fontWeight = "700";
    }
});

// BUTTON CLICK EFFECT
const buttons = document.querySelectorAll("button");

buttons.forEach(button => {
    button.addEventListener("click", () => {
        button.style.transform = "scale(0.95)";

        setTimeout(() => {
            button.style.transform = "scale(1)";
        }, 150);
    });
});

// CART SYSTEM
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const cartCount = document.getElementById("cart-count");

    if (!cartCount) return;

    let totalItems = 0;

    cart.forEach(item => {
        totalItems += item.quantity;
    });

    cartCount.innerText = totalItems;
}

function addToCart(productName, productPrice) {
    const existingProduct = cart.find(item => item.name === productName);

    if (existingProduct) {
        existingProduct.quantity++;
    } else {
        cart.push({
            name: productName,
            price: productPrice,
            quantity: 1
        });
    }

    saveCart();

    alert(productName + " added to cart!");
}

function displayCart() {
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");

    if (!cartItems || !cartTotal) return;

    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartItems.innerHTML = "<p>Your cart is empty.</p>";
        cartTotal.innerText = "Total: R0";
        return;
    }

    let total = 0;

    cart.forEach((item, index) => {
        total += item.price * item.quantity;

        cartItems.innerHTML += `
            <div class="cart-item">
                <h3>${item.name}</h3>
                <p>Price: R${item.price}</p>
                <p>Subtotal: R${item.price * item.quantity}</p>

                <div class="quantity-controls">
                    <button onclick="decreaseQuantity(${index})">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="increaseQuantity(${index})">+</button>
                </div>

                <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
            </div>
        `;
    });

    cartTotal.innerText = "Total: R" + total;
}

function increaseQuantity(index) {
    cart[index].quantity++;
    saveCart();
    displayCart();
}

function decreaseQuantity(index) {
    if (cart[index].quantity > 1) {
        cart[index].quantity--;
    } else {
        cart.splice(index, 1);
    }

    saveCart();
    displayCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    displayCart();
}

function clearCart() {
    cart = [];
    saveCart();
    displayCart();
}

displayCart();
updateCartCount();

// CHECKOUT TOTAL
const checkoutTotal = document.getElementById("checkoutTotal");

if (checkoutTotal) {
    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
    });

    checkoutTotal.innerText = "Total: R" + total;
}

// CHECKOUT FORM
const checkoutForm = document.getElementById("checkoutForm");

if (checkoutForm) {
    checkoutForm.addEventListener("submit", function(e) {
        e.preventDefault();

        if (cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        alert("Order placed successfully! Thank you for shopping with Digi Game World.");

        cart = [];
        saveCart();

        window.location.href = "index.html";
    });
}

// PRODUCT SEARCH AND FILTER
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const productCards = document.querySelectorAll(".product-card");

function filterProducts() {
    const searchText = searchInput ? searchInput.value.toLowerCase() : "";
    const selectedCategory = categoryFilter ? categoryFilter.value : "all";

    productCards.forEach(card => {
        const productName = card.dataset.name.toLowerCase();
        const productCategory = card.dataset.category;

        const matchesSearch = productName.includes(searchText);
        const matchesCategory = selectedCategory === "all" || productCategory === selectedCategory;

        if (matchesSearch && matchesCategory) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

if (searchInput) {
    searchInput.addEventListener("input", filterProducts);
}

if (categoryFilter) {
    categoryFilter.addEventListener("change", filterProducts);
}
// USER SIGNUP SYSTEM
const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", function(e) {
        e.preventDefault();

        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value.trim();

        let users = JSON.parse(localStorage.getItem("users")) || [];

        const userExists = users.find(user => user.email === email);

        if (userExists) {
            alert("This email is already registered.");
            return;
        }

        const newUser = {
            name: name,
            email: email,
            password: password
        };

        users.push(newUser);

        localStorage.setItem("users", JSON.stringify(users));

        alert("Account created successfully! Please login.");

        window.location.href = "login.html";
    });
}

// USER LOGIN SYSTEM
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();

        let users = JSON.parse(localStorage.getItem("users")) || [];

        const validUser = users.find(user => user.email === email && user.password === password);

        if (!validUser) {
            alert("Invalid email or password.");
            return;
        }

        localStorage.setItem("loggedInUser", JSON.stringify(validUser));

        alert("Welcome back, " + validUser.name + "!");

        window.location.href = "index.html";
    });
}

// LOGOUT SYSTEM
const logoutBtn = document.getElementById("logoutBtn");
const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

if (logoutBtn && loggedInUser) {
    logoutBtn.style.display = "inline";

    logoutBtn.addEventListener("click", function(e) {
        e.preventDefault();

        localStorage.removeItem("loggedInUser");

        alert("You have logged out.");

        window.location.href = "index.html";
    });
}
// PROFILE PAGE
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileStatus = document.getElementById("profileStatus");

if (profileName && profileEmail && profileStatus) {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));

    if (user) {
        profileName.innerText = "Name: " + user.name;
        profileEmail.innerText = "Email: " + user.email;
        profileStatus.innerText = "Status: Logged In";
    } else {
        alert("Please login first.");
        window.location.href = "login.html";
    }
}
// ADMIN PRODUCT SYSTEM
const adminProductForm = document.getElementById("adminProductForm");
const adminProductList = document.getElementById("adminProductList");

let adminProducts = JSON.parse(localStorage.getItem("adminProducts")) || [];

function saveAdminProducts() {
    localStorage.setItem("adminProducts", JSON.stringify(adminProducts));
}

function displayAdminProducts() {
    if (!adminProductList) return;

    adminProductList.innerHTML = "";

    if (adminProducts.length === 0) {
        adminProductList.innerHTML = "<p>No admin products added yet.</p>";
        return;
    }

    adminProducts.forEach((product, index) => {
        adminProductList.innerHTML += `
            <div class="admin-product-card">
                <img src="${product.image}" alt="${product.name}">
                <div>
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <p>Category: ${product.category}</p>
                    <h4>R${product.price}</h4>
                    <button onclick="deleteAdminProduct(${index})">Delete</button>
                </div>
            </div>
        `;
    });
}

function deleteAdminProduct(index) {
    adminProducts.splice(index, 1);
    saveAdminProducts();
    displayAdminProducts();
}

if (adminProductForm) {
    adminProductForm.addEventListener("submit", function(e) {
        e.preventDefault();

        const product = {
            name: document.getElementById("adminProductName").value.trim(),
            price: Number(document.getElementById("adminProductPrice").value),
            image: document.getElementById("adminProductImage").value.trim(),
            category: document.getElementById("adminProductCategory").value,
            description: document.getElementById("adminProductDescription").value.trim()
        };

        adminProducts.push(product);
        saveAdminProducts();

        alert("Product added successfully.");

        adminProductForm.reset();
        displayAdminProducts();
    });
}

displayAdminProducts();