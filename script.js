import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

window.increaseQuantity = function(index) {
    cart[index].quantity++;
    saveCart();
    displayCart();
}

window.decreaseQuantity = function(index) {
    if (cart[index].quantity > 1) {
        cart[index].quantity--;
    } else {
        cart.splice(index, 1);
    }

    saveCart();
    displayCart();
}

window.removeFromCart = function(index) {
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

// FIREBASE CHECKOUT / ORDERS
const checkoutForm = document.getElementById("checkoutForm");

if (checkoutForm) {
    checkoutForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        if (cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        const inputs = checkoutForm.querySelectorAll("input");
        const paymentMethod = checkoutForm.querySelector("select").value;

        const customerName = inputs[0].value.trim();
        const customerEmail = inputs[1].value.trim();
        const deliveryAddress = inputs[2].value.trim();
        const city = inputs[3].value.trim();
        const phoneNumber = inputs[4].value.trim();

        let total = 0;

        cart.forEach(item => {
            total += item.price * item.quantity;
        });

        const order = {
            customerName: customerName,
            customerEmail: customerEmail,
            deliveryAddress: deliveryAddress,
            city: city,
            phoneNumber: phoneNumber,
            paymentMethod: paymentMethod,
            items: cart,
            total: total,
            status: "Pending",
            createdAt: serverTimestamp()
        };

        try {
            await addDoc(collection(db, "orders"), order);

            alert("Order placed successfully!");

            cart = [];
            saveCart();

            window.location.href = "index.html";

        } catch (error) {
            alert("Order failed: " + error.message);
        }
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

let editingProductId = null;

// FIREBASE ADMIN PRODUCT SYSTEM
const adminProductForm = document.getElementById("adminProductForm");
const adminProductList = document.getElementById("adminProductList");

async function addFirebaseProduct(product) {
    await addDoc(collection(db, "products"), {
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        description: product.description,
        createdAt: serverTimestamp()
    });
}

async function displayFirebaseAdminProducts() {

    if (!adminProductList) return;

    adminProductList.innerHTML = "";

    const querySnapshot = await getDocs(collection(db, "products"));

    if (querySnapshot.empty) {
        adminProductList.innerHTML = "<p>No products added yet.</p>";
        return;
    }

    querySnapshot.forEach((productDoc) => {

        const product = productDoc.data();

        adminProductList.innerHTML += `
            <div class="admin-product-card">

                <img src="${product.image}" alt="${product.name}">

                <div>
                    <h3>${product.name}</h3>

                    <p>${product.description}</p>

                    <p>Category: ${product.category}</p>

                    <h4>R${product.price}</h4>

                    <button onclick="editFirebaseProduct('${productDoc.id}')">
                        Edit
                    </button>

                    <button onclick="deleteFirebaseProduct('${productDoc.id}')">
                        Delete
                    </button>
                </div>

            </div>
        `;
    });

    document.querySelectorAll(".edit-product-btn").forEach(button => {
        button.addEventListener("click", function() {

            const productId = this.dataset.id;

            const selectedDoc = querySnapshot.docs.find(docItem => docItem.id === productId);

            if (!selectedDoc) return;

            const product = selectedDoc.data();

            window.editFirebaseProduct(
                selectedDoc.id,
                product.name,
                product.price,
                product.image,
                product.category,
                product.description
            );
        });
    });
}

window.deleteFirebaseProduct = async function(productId) {
    await deleteDoc(doc(db, "products", productId));
    alert("Product deleted.");
    displayFirebaseAdminProducts();
};

window.editFirebaseProduct = async function(id) {

    const productRef = doc(db, "products", id);

    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {

        alert("Product not found.");

        return;
    }

    const product = productSnap.data();

    editingProductId = id;

    document.getElementById("adminProductName").value = product.name;

    document.getElementById("adminProductPrice").value = product.price;

    document.getElementById("adminProductImage").value = product.image;

    document.getElementById("adminProductCategory").value = product.category;

    document.getElementById("adminProductDescription").value = product.description;

    adminProductForm.querySelector("button").innerText = "Update Product";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
};

if (adminProductForm) {
    adminProductForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const product = {
            name: document.getElementById("adminProductName").value.trim(),
            price: Number(document.getElementById("adminProductPrice").value),
            image: document.getElementById("adminProductImage").value.trim(),
            category: document.getElementById("adminProductCategory").value,
            description: document.getElementById("adminProductDescription").value.trim()
        };

        if (editingProductId) {
            await updateDoc(doc(db, "products", editingProductId), product);

            alert("Product updated successfully.");

            editingProductId = null;
            adminProductForm.querySelector("button").innerText = "Add Product";

        } else {
            await addFirebaseProduct(product);

            alert("Product added successfully.");
        }

        adminProductForm.reset();
        displayFirebaseAdminProducts();
    });
}

displayFirebaseAdminProducts();

// FIREBASE SIGNUP
const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value.trim();

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            await updateProfile(userCredential.user, {
                displayName: name
            });

            alert("Account created successfully!");

            window.location.href = "login.html";

        } catch (error) {
            alert(error.message);
        }
    });
}

// FIREBASE LOGIN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();

        try {
            await signInWithEmailAndPassword(auth, email, password);

            alert("Login successful!");

            window.location.href = "index.html";

        } catch (error) {
            alert("Invalid email or password.");
        }
    });
}

// FIREBASE LOGOUT + PROFILE
const logoutBtn = document.getElementById("logoutBtn");

onAuthStateChanged(auth, function(user) {
    
    const adminNav = document.getElementById("adminNav");

    if (adminNav) {

      const adminEmail = "neonkoane71@gmail.com";

      if (user && user.email === adminEmail) {

        adminNav.style.display = "block";

      } else {

        adminNav.style.display = "none";
      }
    }


    // LOGOUT BUTTON
    if (logoutBtn) {

        if (user) {

            logoutBtn.style.display = "inline";

            logoutBtn.onclick = async function(e) {

                e.preventDefault();

                await signOut(auth);

                alert("You have logged out.");

                window.location.href = "index.html";
            };

        } else {

            logoutBtn.style.display = "none";
        }
    }

    // PROFILE PAGE
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const profileStatus = document.getElementById("profileStatus");

    if (profileName && profileEmail && profileStatus) {

        if (user) {

            profileName.innerText = "Name: " + (user.displayName || "User");

            profileEmail.innerText = "Email: " + user.email;

            profileStatus.innerText = "Status: Logged In";

        } else {

            alert("Please login first.");

            window.location.href = "login.html";
        }
    }
});

// FIREBASE PRODUCTS DISPLAY
const firebaseProducts = document.getElementById("firebaseProducts");

async function loadFirebaseProducts() {

    if (!firebaseProducts) return;

    firebaseProducts.innerHTML = "";

    const querySnapshot = await getDocs(collection(db, "products"));

    if (querySnapshot.empty) {
        firebaseProducts.innerHTML = "<p>No products available.</p>";
        return;
    }

    querySnapshot.forEach((productDoc) => {

        const product = productDoc.data();

        firebaseProducts.innerHTML += `

            <div class="card product-card"
                 data-name="${product.name}"
                 data-category="${product.category}">

                <img src="${product.image}" alt="${product.name}">

                <h3>${product.name}</h3>

                <p>${product.description}</p>

                <h4>R${product.price}</h4>

                <button class="add-cart-btn"
                        data-name="${product.name}"
                        data-price="${product.price}">
                    Add to Cart
                </button>

            </div>

        `;
    });

    const addCartButtons = document.querySelectorAll(".add-cart-btn");

    addCartButtons.forEach(button => {

        button.addEventListener("click", function() {

            const name = this.dataset.name;

            const price = Number(this.dataset.price);

            addToCart(name, price);
        });
    });

    filterProducts();
}

loadFirebaseProducts();
// FIREBASE ADMIN ORDERS DISPLAY
const adminOrdersList = document.getElementById("adminOrdersList");

async function displayFirebaseOrders() {
    if (!adminOrdersList) return;

    adminOrdersList.innerHTML = "";

    const querySnapshot = await getDocs(collection(db, "orders"));

    if (querySnapshot.empty) {
        adminOrdersList.innerHTML = "<p>No orders yet.</p>";
        return;
    }

    querySnapshot.forEach((orderDoc) => {
        const order = orderDoc.data();

        let itemsHTML = "";

        order.items.forEach(item => {
            itemsHTML += `
                <li>
                    ${item.name} - R${item.price} x ${item.quantity}
                </li>
            `;
        });

        adminOrdersList.innerHTML += `
            <div class="admin-order-card">
                <h3>Order ID: ${orderDoc.id}</h3>
                <p><strong>Name:</strong> ${order.customerName}</p>
                <p><strong>Email:</strong> ${order.customerEmail}</p>
                <p><strong>Phone:</strong> ${order.phoneNumber}</p>
                <p><strong>Address:</strong> ${order.deliveryAddress}, ${order.city}</p>
                <p><strong>Payment:</strong> ${order.paymentMethod}</p>
                <p><strong>Status:</strong> ${order.status}</p>

                <h4>Items:</h4>
                <ul>${itemsHTML}</ul>

                <h3>Total: R${order.total}</h3>
            </div>
        `;
    });
}

displayFirebaseOrders();

// ADMIN PAGE PROTECTION
const adminPage = document.getElementById("adminProductForm");

if (adminPage) {
    onAuthStateChanged(auth, function(user) {
        const adminEmail = "neonkoane71@gmail.com";

        if (!user) {
            alert("Please login as admin first.");
            window.location.href = "login.html";
            return;
        }

        if (user.email !== adminEmail) {
            alert("Access denied. Admin only.");
            window.location.href = "index.html";
            return;
        }
    });
}
// WHATSAPP SERVICE MESSAGE
window.sendWhatsApp = function(serviceName) {

    const message =
        `Hello Digi Game World, I need help with: ${serviceName}. Please send me more information.`;

    const whatsappURL =
        `https://wa.me/27687621416?text=${encodeURIComponent(message)}`;

    window.open(whatsappURL, "_blank");
};