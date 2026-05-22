import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    deleteDoc,
    doc,
    updateDoc,
    query,
    where,
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
        const currentUser = auth.currentUser;

         if (!currentUser) {
         alert("Please login before placing an order.");
         window.location.href = "login.html";
         return;
        }
        const customerEmail = currentUser.email;
        const deliveryAddress = inputs[2].value.trim();
        const city = inputs[3].value.trim();
        const phoneNumber = inputs[4].value.trim();

        let total = 0;

        cart.forEach(item => {
            total += item.price * item.quantity;
        });

        const order = {
            userId: currentUser.uid,
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
function filterProducts() {
    const searchInput = document.getElementById("searchInput");
    const categoryFilter = document.getElementById("categoryFilter");
    const cards = document.querySelectorAll(".product-card");

    if (!searchInput || !categoryFilter) return;

    const searchText = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;

    cards.forEach(card => {
        const productName = card.dataset.name.toLowerCase();
        const productCategory = card.dataset.category;

        const matchesSearch = productName.includes(searchText);
        const matchesCategory =
            selectedCategory === "all" || productCategory === selectedCategory;

        card.style.display = matchesSearch && matchesCategory ? "block" : "none";
    });
}

window.filterProducts = filterProducts;

document.addEventListener("input", function(e) {
    if (e.target.id === "searchInput") {
        filterProducts();
    }
});

document.addEventListener("change", function(e) {
    if (e.target.id === "categoryFilter") {
        filterProducts();
    }
});

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

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

            await sendEmailVerification(userCredential.user);

            alert("Account created successfully! Please check your email and verify your account.");

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
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            //if (!userCredential.user.emailVerified) {
               // alert("Please verify your email before logging in.");
               // await signOut(auth);
               // return;
            //}

            alert("Login successful!");
            window.location.href = "index.html";

        } catch (error) {
            alert(error.message);
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

            displayCustomerOrders(user);

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

        let deleteOrderButton = "";

        if (order.status === "Cancelled by Customer") {
           deleteOrderButton = `
              <button class="delete-order-btn"
                  onclick="deleteCancelledOrder('${orderDoc.id}')">
                  Delete Cancelled Order
              </button>
            `;
        }

        adminOrdersList.innerHTML += `
            <div class="admin-order-card">
                <h3>Order ID: ${orderDoc.id}</h3>
                <p><strong>Name:</strong> ${order.customerName}</p>
                <p><strong>Email:</strong> ${order.customerEmail}</p>
                <p><strong>Phone:</strong> ${order.phoneNumber}</p>
                <p><strong>Address:</strong> ${order.deliveryAddress}, ${order.city}</p>
                <p><strong>Payment:</strong> ${order.paymentMethod}</p>
                <p><strong>Status:</strong><span class="order-status ${order.status === 'Pending' ? 'pending-status' : ''} ${order.status === 'Cancelled by Customer' ? 'cancelled-status' : ''}">${order.status}</span></p>

                <div class="order-actions">
                   <select onchange="updateOrderStatus('${orderDoc.id}', this.value)">
                      <option value="Pending" ${order.status === "Pending" ? "selected" : ""}>Pending</option>
                      <option value="Processing" ${order.status === "Processing" ? "selected" : ""}>Processing</option>
                      <option value="Ready for Collection" ${order.status === "Ready for Collection" ? "selected" : ""}>Ready for Collection</option>
                      <option value="Delivered" ${order.status === "Delivered" ? "selected" : ""}>Delivered</option>
                      <option value="Cancelled by Customer" ${order.status === "Cancelled by Customer" ? "selected" : ""}>Cancelled by Customer</option>
                   </select>
                </div>

                <h4>Items:</h4>
                <ul>${itemsHTML}</ul>

                <h3>Total: R${order.total}</h3>
                ${deleteOrderButton}
            </div>
        `;
    });
}

displayFirebaseOrders();

// ADMIN UPDATE ORDER STATUS
window.updateOrderStatus = async function(orderId, newStatus) {

    await updateDoc(doc(db, "orders", orderId), {
        status: newStatus
    });

    alert("Order status updated.");

    displayFirebaseOrders();
};

// ADMIN PAGE PROTECTION
const adminPage = document.getElementById("adminProductForm");

if (adminPage) {

    onAuthStateChanged(auth, function(user) {

        const adminEmails = [
            "neonkoane71@gmail.com",
            "parmjeet122@gmail.com"
        ];

        if (!user) {

            alert("Please login as admin first.");

            window.location.href = "login.html";

            return;
        }

        if (!adminEmails.includes(user.email)) {

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

window.filterByCategory = function(category) {
    const cards = document.querySelectorAll(".product-card");

    cards.forEach(card => {
        const productCategory = card.dataset.category;

        if (category === "all" || productCategory === category) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
};

// SETTINGS DROPDOWN
window.toggleSettingsMenu = function() {
    const dropdown = document.getElementById("settingsDropdown");

    if (dropdown) {
        dropdown.classList.toggle("show");
    }
};

document.addEventListener("click", function(e) {
    const menu = document.querySelector(".settings-menu");

    if (menu && !menu.contains(e.target)) {
        const dropdown = document.getElementById("settingsDropdown");

        if (dropdown) {
            dropdown.classList.remove("show");
        }
    }
});

// THEME SYSTEM

window.setTheme = function(mode) {

    if (mode === "light") {

        document.body.classList.add("light-mode");

        localStorage.setItem("theme", "light");
    }

    else if (mode === "dark") {

        document.body.classList.remove("light-mode");

        localStorage.setItem("theme", "dark");
    }

    else {

        localStorage.setItem("theme", "device");

        applyDeviceTheme();
    }
};

// APPLY DEVICE THEME
function applyDeviceTheme() {

    const prefersDark =
        window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (prefersDark) {

        document.body.classList.remove("light-mode");

    } else {

        document.body.classList.add("light-mode");
    }
}

// LOAD SAVED THEME
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "light") {

    document.body.classList.add("light-mode");

}

else if (savedTheme === "dark") {

    document.body.classList.remove("light-mode");

}

else {

    applyDeviceTheme();
}

// NAVBAR PRODUCT SEARCH
const navSearchInput = document.getElementById("navSearchInput");

if (navSearchInput) {
    navSearchInput.addEventListener("input", function() {
        const searchValue = navSearchInput.value.toLowerCase().trim();
        const productCards = document.querySelectorAll(".product-card");

        productCards.forEach(card => {
            const productName = card.dataset.name
                ? card.dataset.name.toLowerCase()
                : card.textContent.toLowerCase();

            if (productName.includes(searchValue)) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });
    });
}
// TOGGLE SEARCH BAR
window.toggleSearchBar = function() {

    const searchInput =
        document.getElementById("navSearchInput");

    if (searchInput) {

        searchInput.classList.toggle("show");

        searchInput.focus();
    }
};

// DYNAMIC CATEGORY HERO + FILTER
window.changeCategory = function(category) {

    const hero = document.getElementById("categoryHero");
    const title = document.getElementById("categoryTitle");
    const subtitle = document.getElementById("categorySubtitle");
    const cards = document.querySelectorAll(".product-card");

    if (!hero || !title || !subtitle) return;

    hero.className = "category-hero " + category;

    const categoryText = {
        all: {
            title: "Shop All Gaming Products",
            subtitle: "Explore consoles, PCs, accessories, repairs and gaming gear."
        },

        playstation: {
            title: "PlayStation Zone",
            subtitle: "Shop PlayStation consoles, controllers, games and accessories."
        },

        xbox: {
            title: "Xbox Gaming Hub",
            subtitle: "Explore Xbox consoles, controllers, accessories and gaming gear."
        },

        pc: {
            title: "PC & Laptop Gaming",
            subtitle: "Find gaming laptops, PCs, monitors and performance accessories."
        },

        nintendo: {
            title: "Nintendo World",
            subtitle: "Discover Nintendo consoles, accessories and fun family gaming."
        },

        accessories: {
            title: "Gaming Accessories",
            subtitle: "Upgrade your setup with headsets, keyboards, controllers and more."
        }
    };

    title.innerText = categoryText[category].title;
    subtitle.innerText = categoryText[category].subtitle;

    cards.forEach(card => {
        const productCategory = card.dataset.category;

        if (category === "all" || productCategory === category) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
};

// CUSTOMER ORDER HISTORY + CANCEL ORDER
const customerOrdersList = document.getElementById("customerOrdersList");

async function displayCustomerOrders(user) {

    if (!customerOrdersList) return;

    customerOrdersList.innerHTML = "<p>Loading your orders...</p>";

    if (!user) {
        customerOrdersList.innerHTML = "<p>Please login to view your orders.</p>";
        return;
    }

    const ordersQuery = query(
    collection(db, "orders"),
    where("userId", "==", user.uid)
);

const querySnapshot = await getDocs(ordersQuery);

    customerOrdersList.innerHTML = "";

    let hasOrders = false;

    querySnapshot.forEach(orderDoc => {

        const order = orderDoc.data();

        const orderEmail = order.customerEmail
            ? order.customerEmail.toLowerCase().trim()
            : "";

        const userEmail = user.email
            ? user.email.toLowerCase().trim()
            : "";

        const matchesByEmail = orderEmail === userEmail;
        const matchesByUserId = order.userId && order.userId === user.uid;

        if (matchesByEmail || matchesByUserId) {

            hasOrders = true;

            let itemsHTML = "";

            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    itemsHTML += `
                        <li>
                            ${item.name} - R${item.price} x ${item.quantity}
                        </li>
                    `;
                });
            }

            let cancelButton = "";

            if (order.status === "Pending") {
                cancelButton = `
                    <button class="cancel-order-btn"
                            onclick="cancelCustomerOrder('${orderDoc.id}')">
                        Cancel Order
                    </button>
                `;
            }

            customerOrdersList.innerHTML += `
                <div class="customer-order-card">

                    <h3>Order ID: ${orderDoc.id}</h3>

                    <p>
                        <strong>Status:</strong>
                        <span class="${order.status === 'Cancelled by Customer' ? 'cancelled-status' : ''}">
                            ${order.status || "Pending"}
                        </span>
                    </p>

                    <p><strong>Total:</strong> R${order.total || 0}</p>

                    <p><strong>Payment:</strong> ${order.paymentMethod || "Not selected"}</p>

                    <h4>Items:</h4>

                    <ul>
                        ${itemsHTML}
                    </ul>

                    ${cancelButton}

                </div>
            `;
        }
    });

    if (!hasOrders) {
        customerOrdersList.innerHTML = "<p>You have no orders yet.</p>";
    }
}

window.cancelCustomerOrder = async function(orderId) {

    const confirmCancel = confirm("Are you sure you want to cancel this order?");

    if (!confirmCancel) return;

    await updateDoc(doc(db, "orders", orderId), {
        status: "Cancelled by Customer"
    });

    alert("Order cancelled successfully.");

    displayCustomerOrders(auth.currentUser);
};

window.deleteCancelledOrder = async function(orderId) {

    const confirmDelete = confirm("Delete this cancelled order permanently?");

    if (!confirmDelete) return;

    await deleteDoc(doc(db, "orders", orderId));

    alert("Cancelled order deleted.");

    displayFirebaseOrders();
};

// MOBILE MENU
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileNav = document.getElementById("mobileNav");

if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener("click", function() {
        mobileNav.classList.toggle("active");
    });
}