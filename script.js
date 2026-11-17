const NOMOR_WA = "6287877611218";

let storeIdentity = JSON.parse(localStorage.getItem("umkm_store_identity")) || {
  name: "Caffe Santai HAHAHA",
  logo: "CS",
  qrisImg: ""
};

// DAFTAR SELURUH MENU LENGKAP SESUAI DARI PANEL ADMIN
let menuCustom = JSON.parse(localStorage.getItem("umkm_client_menu_custom")) || [
  { id: 1, nama: "Roti Bakar", kategori: "bakaran", labelKategori: "Bakaran", harga: 16000, deskripsi: "ENAK", gambar: "https://placehold.co/400x300/1f1f24/f59e0b?text=Roti+Bakar" },
  { id: 2, nama: "Red Velvet", kategori: "kopi", labelKategori: "Kopi", harga: 25000, deskripsi: "Segarrr", gambar: "https://placehold.co/400x300/1f1f24/f59e0b?text=Red+Velvet" },
  { id: 3, nama: "Kentang Goreng", kategori: "tambahan", labelKategori: "Tambahan / Topping", harga: 20000, deskripsi: "Gurih & Enak", gambar: "https://placehold.co/400x300/1f1f24/f59e0b?text=Kentang+Goreng" },
  { id: 4, nama: "Es Alpukat", kategori: "non-kopi", labelKategori: "Non-Kopi", harga: 15000, deskripsi: "Segar", gambar: "https://placehold.co/400x300/1f1f24/f59e0b?text=Es+Alpukat" }
];

let DATA_MENU = [...menuCustom];
let keranjang = JSON.parse(localStorage.getItem("umkm_keranjang")) || [];
let kategoriAktif = localStorage.getItem("umkm_kategori_aktif") || "semua";
let itemDipilih = null;
let qtyModal = 1;
let kataKunciCari = "";
let metodePembayaran = "tunai"; // tunai atau qris
let base64BuktiBayar = "";

const DAFTAR_KATEGORI = [
  { id: "semua", nama: "Semua Menu" },
  { id: "kopi", nama: "Kopi" },
  { id: "non-kopi", nama: "Non-Kopi" },
  { id: "makanan-berat", nama: "Makanan Berat" },
  { id: "camilan", nama: "Camilan" },
  { id: "bakaran", nama: "Bakaran" },
  { id: "kue-dessert", nama: "Kue & Dessert" },
  { id: "menu-paket", nama: "Menu Paket" },
  { id: "tambahan", nama: "Tambahan / Topping" }
];

function applyClientIdentity() {
  if (storeIdentity.name) {
    document.title = `${storeIdentity.name} - Menu Digital`;
    document.querySelectorAll("#navBrandTitle").forEach(el => el.textContent = storeIdentity.name);
    document.querySelectorAll("#navBrandLogo").forEach(el => el.textContent = storeIdentity.logo);
  }
}

function formatRupiah(angka) {
  return "Rp " + angka.toLocaleString("id-ID");
}

function simpanStateLocal() {
  localStorage.setItem("umkm_keranjang", JSON.stringify(keranjang));
  localStorage.setItem("umkm_kategori_aktif", kategoriAktif);
}

function tampilkanToast(pesan) {
  const toast = document.getElementById("toastNotif");
  if (!toast) return;
  toast.textContent = pesan;
  toast.classList.add("show");
  setTimeout(() => { toast.classList.remove("show"); }, 2200);
}

function renderKategoriDrawer() {
  const listEl = document.getElementById("categoryList");
  if (!listEl) return;
  listEl.innerHTML = "";

  DAFTAR_KATEGORI.forEach((kat) => {
    const jumlah = kat.id === "semua" ? DATA_MENU.length : DATA_MENU.filter((m) => m.kategori === kat.id).length;
    const li = document.createElement("li");
    const btn = document.createElement("button");
    if (kat.id === kategoriAktif) btn.classList.add("active");

    btn.innerHTML = `<span>${kat.nama}</span><span class="cat-count">${jumlah}</span>`;
    btn.addEventListener("click", () => {
      kategoriAktif = kat.id;
      simpanStateLocal();
      renderKategoriDrawer();
      renderMenu();
      tutupDrawer();
    });
    li.appendChild(btn);
    listEl.appendChild(li);
  });
}

function renderMenu() {
  const container = document.getElementById("menuContainer");
  const titleEl = document.getElementById("activeCategoryTitle");
  const counterEl = document.getElementById("menuCounter");
  if (!container) return;

  const katObj = DAFTAR_KATEGORI.find((k) => k.id === kategoriAktif);
  const namaKategori = katObj ? katObj.nama : "Semua Menu";
  let menuTersaring = kategoriAktif === "semua" ? DATA_MENU : DATA_MENU.filter((item) => item.kategori === kategoriAktif);

  if (kataKunciCari !== "") {
    const keyword = kataKunciCari.toLowerCase();
    menuTersaring = menuTersaring.filter((item) =>
      item.nama.toLowerCase().includes(keyword) || item.deskripsi.toLowerCase().includes(keyword)
    );
    titleEl.textContent = `Pencarian: "${kataKunciCari}"`;
  } else {
    titleEl.textContent = namaKategori;
  }

  counterEl.textContent = `${menuTersaring.length} Menu`;
  container.innerHTML = "";

  if (menuTersaring.length === 0) {
    container.innerHTML = `<div class="empty-search-state"><p>Menu "<strong>${kataKunciCari}</strong>" tidak ditemukan.</p></div>`;
    return;
  }

  menuTersaring.forEach((item) => {
    const card = document.createElement("article");
    card.className = "menu-card";
    card.innerHTML = `
      <div class="card-img-box" onclick="bukaModalItem(${item.id})">
        <img src="${item.gambar}" alt="${item.nama}" onerror="this.src='https://placehold.co/400x300/1f1f24/f59e0b?text=${encodeURIComponent(item.nama)}'">
        <span class="card-cat-label">${item.labelKategori}</span>
      </div>
      <div class="card-content">
        <h4 onclick="bukaModalItem(${item.id})" style="cursor:pointer;">${item.nama}</h4>
        <p class="card-desc">${item.deskripsi}</p>
        <div class="card-footer">
          <span class="price-text">${formatRupiah(item.harga)}</span>
          <button class="btn-pesan" onclick="bukaModalItem(${item.id})">Pesan +</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function bukaModalItem(id) {
  itemDipilih = DATA_MENU.find((m) => m.id === id);
  if (!itemDipilih) return;

  qtyModal = 1;
  document.getElementById("modalItemImg").src = itemDipilih.gambar;
  document.getElementById("modalItemCat").textContent = itemDipilih.labelKategori;
  document.getElementById("modalItemName").textContent = itemDipilih.nama;
  document.getElementById("modalItemDesc").textContent = itemDipilih.deskripsi;
  document.getElementById("inputCatatan").value = "";
  document.getElementById("modalQtyValue").textContent = qtyModal;
  document.getElementById("modalUnitPrice").textContent = formatRupiah(itemDipilih.harga);
  document.getElementById("modalTotalPrice").textContent = formatRupiah(itemDipilih.harga * qtyModal);

  document.getElementById("itemModal").classList.add("active");
}

function tutupModalItem() {
  document.getElementById("itemModal").classList.remove("active");
}

function tambahKeKeranjang() {
  if (!itemDipilih) return;
  const catatan = document.getElementById("inputCatatan").value.trim();

  const indexSama = keranjang.findIndex((k) => k.id === itemDipilih.id && k.catatan.toLowerCase() === catatan.toLowerCase());
  if (indexSama !== -1) {
    keranjang[indexSama].qty += qtyModal;
  } else {
    keranjang.push({
      id: itemDipilih.id,
      nama: itemDipilih.nama,
      harga: itemDipilih.harga,
      qty: qtyModal,
      catatan: catatan
    });
  }

  simpanStateLocal();
  updateTampilanKeranjang();
  tutupModalItem();
  tampilkanToast(`✓ ${itemDipilih.nama} masuk keranjang!`);
}

function pilihMetodeBayar(metode) {
  metodePembayaran = metode;
  const btnTunai = document.getElementById("btnMethodTunai");
  const btnQris = document.getElementById("btnMethodQris");
  const qrisContainer = document.getElementById("qrisSectionContainer");
  const displayQrisImg = document.getElementById("displayQrisImage");
  const noQrisText = document.getElementById("noQrisPlaceholder");

  if (metode === "tunai") {
    btnTunai.classList.add("active");
    btnQris.classList.remove("active");
    qrisContainer.style.display = "none";
  } else {
    btnQris.classList.add("active");
    btnTunai.classList.remove("active");
    qrisContainer.style.display = "block";

    if (storeIdentity.qrisImg) {
      displayQrisImg.src = storeIdentity.qrisImg;
      displayQrisImg.style.display = "inline-block";
      noQrisText.style.display = "none";
    } else {
      displayQrisImg.style.display = "none";
      noQrisText.style.display = "block";
    }
  }
}

function updateTampilanKeranjang() {
  const totalQty = keranjang.reduce((acc, item) => acc + item.qty, 0);
  const totalHarga = keranjang.reduce((acc, item) => acc + item.harga * item.qty, 0);

  document.getElementById("cartCountBadge").textContent = totalQty;
  const floatingBar = document.getElementById("floatingCart");
  if (totalQty > 0) {
    floatingBar.style.display = "flex";
    document.getElementById("floatingQty").textContent = `${totalQty} Item di Keranjang`;
    document.getElementById("floatingTotal").textContent = formatRupiah(totalHarga);
  } else {
    floatingBar.style.display = "none";
  }

  const listContainer = document.getElementById("cartItemsList");
  const checkoutSection = document.getElementById("checkoutFormSection");
  if (!listContainer) return;

  if (keranjang.length === 0) {
    listContainer.innerHTML = `<div class="empty-cart">Keranjang masih kosong.<br>Silakan pilih menu terlebih dahulu.</div>`;
    if (checkoutSection) checkoutSection.style.display = "none";
    return;
  }

  if (checkoutSection) checkoutSection.style.display = "block";
  listContainer.innerHTML = "";

  keranjang.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <div class="cart-item-info">
        <h4>${item.nama}</h4>
        ${item.catatan ? `<span class="cart-item-note">Catatan: ${item.catatan}</span>` : ""}
        <span class="cart-item-price">${formatRupiah(item.harga)} x ${item.qty} = <strong>${formatRupiah(item.harga * item.qty)}</strong></span>
      </div>
      <div class="cart-item-actions">
        <button class="btn-mini" onclick="ubahQtyKeranjang(${idx}, -1)">−</button>
        <span>${item.qty}</span>
        <button class="btn-mini" onclick="ubahQtyKeranjang(${idx}, 1)">+</button>
        <button class="btn-del" onclick="hapusItemKeranjang(${idx})">Hapus</button>
      </div>
    `;
    listContainer.appendChild(div);
  });

  document.getElementById("cartGrandTotal").textContent = formatRupiah(totalHarga);
}

function ubahQtyKeranjang(index, delta) {
  keranjang[index].qty += delta;
  if (keranjang[index].qty <= 0) keranjang.splice(index, 1);
  simpanStateLocal();
  updateTampilanKeranjang();
}

function hapusItemKeranjang(index) {
  keranjang.splice(index, 1);
  simpanStateLocal();
  updateTampilanKeranjang();
}

function kirimKeWhatsApp() {
  const inputNama = document.getElementById("customerName");
  const inputMeja = document.getElementById("tableNumber");
  const namaPemesan = inputNama.value.trim();
  const nomorMeja = inputMeja.value.trim();

  if (!namaPemesan) {
    alert("Mohon isi Nama Lengkap pemesan.");
    inputNama.focus();
    return;
  }
  if (keranjang.length === 0) {
    alert("Keranjang pesanan masih kosong.");
    return;
  }
  if (metodePembayaran === "qris" && !base64BuktiBayar) {
    alert("Anda memilih QRIS. Mohon unggah foto bukti pembayaran terlebih dahulu.");
    return;
  }

  const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
  const keteranganMeja = nomorMeja !== "" ? nomorMeja : "Take Away";
  const labelBayar = metodePembayaran === "qris" ? "QRIS / Transfer (Bukti Terlampir)" : "Tunai (Bayar di Kasir)";

  let pesanWA = `*HALO, SAYA MAU PESAN MENU*\n==============================\n`;
  pesanWA += `*No. Order:* ${orderId}\n`;
  pesanWA += `*Nama Pemesan:* ${namaPemesan}\n`;
  pesanWA += `*No. Meja:* ${keteranganMeja}\n`;
  pesanWA += `*Pembayaran:* ${labelBayar}\n`;
  if (metodePembayaran === "qris") {
    pesanWA += `*Status:* [Bukti Pembayaran QRIS Telah Diunggah Client]\n`;
  }
  pesanWA += `==============================\n\n*DAFTAR PESANAN:*\n`;

  let grandTotal = 0;
  keranjang.forEach((item, i) => {
    const subtotal = item.harga * item.qty;
    grandTotal += subtotal;
    pesanWA += `${i + 1}. *${item.nama}* (${item.qty}x) - ${formatRupiah(subtotal)}\n`;
    if (item.catatan) pesanWA += `   _Catatan: ${item.catatan}_\n`;
  });

  pesanWA += `\n==============================\n*TOTAL BAYAR: ${formatRupiah(grandTotal)}*\n==============================\nTerima kasih!`;

  window.open(`https://wa.me/${NOMOR_WA}?text=${encodeURIComponent(pesanWA)}`, "_blank");

  inputNama.value = "";
  inputMeja.value = "";
  keranjang = [];
  base64BuktiBayar = "";
  simpanStateLocal();
  updateTampilanKeranjang();
  document.getElementById("cartModal").classList.remove("active");
  tampilkanToast("✓ Pesanan berhasil dikirim ke WhatsApp!");
}

document.addEventListener("DOMContentLoaded", () => {
  applyClientIdentity();
  renderKategoriDrawer();
  renderMenu();
  updateTampilanKeranjang();

  const searchInput = document.getElementById("searchMenuInput");
  const btnClearSearch = document.getElementById("btnClearSearch");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      kataKunciCari = e.target.value.trim();
      btnClearSearch.style.display = kataKunciCari !== "" ? "flex" : "none";
      renderMenu();
    });
  }

  if (btnClearSearch) {
    btnClearSearch.addEventListener("click", () => {
      kataKunciCari = "";
      searchInput.value = "";
      btnClearSearch.style.display = "none";
      renderMenu();
    });
  }

  document.getElementById("btnOpenDrawer").addEventListener("click", () => {
    document.getElementById("categoryDrawer").classList.add("active");
    document.getElementById("drawerOverlay").classList.add("active");
  });

  const tutupDrawer = () => {
    document.getElementById("categoryDrawer").classList.remove("active");
    document.getElementById("drawerOverlay").classList.remove("active");
  };
  document.getElementById("btnCloseDrawer").addEventListener("click", tutupDrawer);
  document.getElementById("drawerOverlay").addEventListener("click", tutupDrawer);

  document.getElementById("btnCloseItemModal").addEventListener("click", tutupModalItem);
  document.getElementById("btnMinusQty").addEventListener("click", () => {
    if (qtyModal > 1) { qtyModal--; document.getElementById("modalQtyValue").textContent = qtyModal; document.getElementById("modalTotalPrice").textContent = formatRupiah(itemDipilih.harga * qtyModal); }
  });
  document.getElementById("btnPlusQty").addEventListener("click", () => {
    qtyModal++; document.getElementById("modalQtyValue").textContent = qtyModal; document.getElementById("modalTotalPrice").textContent = formatRupiah(itemDipilih.harga * qtyModal);
  });
  document.getElementById("btnAddToCart").addEventListener("click", tambahKeKeranjang);

  document.getElementById("btnOpenCart").addEventListener("click", () => document.getElementById("cartModal").classList.add("active"));
  document.getElementById("btnFloatingOpenCart").addEventListener("click", () => document.getElementById("cartModal").classList.add("active"));
  document.getElementById("btnCloseCartModal").addEventListener("click", () => document.getElementById("cartModal").classList.remove("active"));

  document.getElementById("clientPaymentProofFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        base64BuktiBayar = evt.target.result;
        const preview = document.getElementById("clientProofPreview");
        preview.src = base64BuktiBayar;
        document.getElementById("proofPreviewContainer").style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById("btnSendWhatsApp").addEventListener("click", kirimKeWhatsApp);
});
