let NOMOR_WA = "6287877611218";

let storeIdentity = JSON.parse(localStorage.getItem("umkm_store_identity")) || {
  name: "Kedai Nusantara",
  logo: "KN",
  wa: "6287877611218",
  qrisText: "OLAN MAULANA Bank Mandiri 1630011235432"
};

let defaultMenuList = [
  { 
    id: 1718000001, 
    nama: "Roti Bakar", 
    kategori: "bakaran", 
    labelKategori: "BAKARAN", 
    harga: 16000, 
    deskripsi: "ENAK", 
    gambar: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80" 
  },
  { 
    id: 1718000002, 
    nama: "Red Velvet", 
    kategori: "kopi", 
    labelKategori: "KOPI", 
    harga: 25000, 
    deskripsi: "Segarrr", 
    gambar: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=400&q=80" 
  },
  { 
    id: 1718000003, 
    nama: "Kentang Goreng", 
    kategori: "tambahan", 
    labelKategori: "TAMBAHAN / TOPPING", 
    harga: 20000, 
    deskripsi: "Gurih & Enak", 
    gambar: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80" 
  },
  { 
    id: 1718000004, 
    nama: "Es Alpukat", 
    kategori: "non-kopi", 
    labelKategori: "NON-KOPI", 
    harga: 15000, 
    deskripsi: "Segar", 
    gambar: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80" 
  }
];

// Tangkap data sinkronisasi dari parameter URL (?data=...) saat Barcode dari Panel Admin di-scan
function sinkronisasiDariUrlBarcode() {
  try {
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get("data");
    if (!encodedData) return;

    let jsonStr = "";
    if (typeof LZString !== "undefined") {
      jsonStr = LZString.decompressFromEncodedURIComponent(encodedData);
    }
    if (!jsonStr) {
      jsonStr = decodeURIComponent(escape(atob(encodedData)));
    }

    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.s) {
      storeIdentity = {
        name: parsed.s.n || storeIdentity.name,
        logo: parsed.s.l || storeIdentity.logo,
        wa: parsed.s.w || storeIdentity.wa || "6287877611218",
        qrisText: parsed.s.q !== undefined ? parsed.s.q : storeIdentity.qrisText
      };
      localStorage.setItem("umkm_store_identity", JSON.stringify(storeIdentity));
    }

    if (parsed && Array.isArray(parsed.m)) {
      const syncedMenus = parsed.m.map(item => ({
        id: item.i || Date.now() + Math.random(),
        nama: item.n,
        kategori: item.k,
        labelKategori: item.lk,
        harga: Number(item.h),
        deskripsi: item.d || "",
        gambar: item.g || `https://placehold.co/400x300/1f1f24/f59e0b?text=${encodeURIComponent(item.n)}`
      }));
      localStorage.setItem("umkm_menu_custom", JSON.stringify(syncedMenus));
    }
  } catch (err) {
    console.error("Gagal membaca data sinkronisasi dari Barcode:", err);
  }
}

sinkronisasiDariUrlBarcode();

storeIdentity = JSON.parse(localStorage.getItem("umkm_store_identity")) || storeIdentity;
NOMOR_WA = storeIdentity.wa || "6287877611218";

let savedMenuCustom = JSON.parse(localStorage.getItem("umkm_menu_custom"));
let DATA_MENU = Array.isArray(savedMenuCustom) ? savedMenuCustom : [...defaultMenuList];

let keranjang = JSON.parse(localStorage.getItem("umkm_keranjang")) || [];
let kategoriAktif = localStorage.getItem("umkm_kategori_aktif") || "semua";
let itemDipilih = null;
let qtyModal = 1;
let kataKunciCari = "";
let metodePembayaran = "tunai"; 

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
  const currentStore = JSON.parse(localStorage.getItem("umkm_store_identity")) || storeIdentity;
  NOMOR_WA = currentStore.wa || "6287877611218";
  if (currentStore.name) {
    document.title = `${currentStore.name} - Menu Digital`;
    document.querySelectorAll("#navBrandTitle").forEach(el => el.textContent = currentStore.name);
    document.querySelectorAll("#navBrandLogo").forEach(el => el.textContent = currentStore.logo);
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

function muatDataMenuTerbaru() {
  const latestCustomMenu = JSON.parse(localStorage.getItem("umkm_menu_custom"));
  if (Array.isArray(latestCustomMenu)) {
    DATA_MENU = [...latestCustomMenu];
  } else {
    DATA_MENU = [...defaultMenuList];
  }
}

function renderKategoriDrawer() {
  const listEl = document.getElementById("categoryList");
  if (!listEl) return;
  listEl.innerHTML = "";

  muatDataMenuTerbaru();

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
      const drawer = document.getElementById("categoryDrawer");
      const overlay = document.getElementById("drawerOverlay");
      if (drawer) drawer.classList.remove("active");
      if (overlay) overlay.classList.remove("active");
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

  muatDataMenuTerbaru();

  const katObj = DAFTAR_KATEGORI.find((k) => k.id === kategoriAktif);
  const namaKategori = katObj ? katObj.nama : "Semua Menu";
  let menuTersaring = kategoriAktif === "semua" ? DATA_MENU : DATA_MENU.filter((item) => item.kategori === kategoriAktif);

  if (kataKunciCari !== "") {
    const keyword = kataKunciCari.toLowerCase();
    menuTersaring = menuTersaring.filter((item) =>
      item.nama.toLowerCase().includes(keyword) || item.deskripsi.toLowerCase().includes(keyword)
    );
    if (titleEl) titleEl.textContent = `Pencarian: "${kataKunciCari}"`;
  } else {
    if (titleEl) titleEl.textContent = namaKategori;
  }

  if (counterEl) counterEl.textContent = `${menuTersaring.length} Menu`;
  container.innerHTML = "";

  if (menuTersaring.length === 0) {
    const emptyMsg = kataKunciCari !== ""
      ? `Menu "<strong>${kataKunciCari}</strong>" tidak ditemukan.`
      : "Belum ada menu yang tersedia di kategori ini.";
    container.innerHTML = `<div class="empty-search-state" style="text-align:center; padding:30px; color:var(--text-muted);"><p>${emptyMsg}</p></div>`;
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
        <h4 onclick="bukaModalItem(${item.id})">${item.nama}</h4>
        <p class="card-desc">${item.deskripsi}</p>
        <div class="card-footer">
          <span class="price-text">${formatRupiah(item.harga)}</span>
          <button type="button" class="btn-pesan" onclick="bukaModalItem(${item.id})">Pesan +</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function bukaModalItem(id) {
  muatDataMenuTerbaru();
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
  const displayQrisText = document.getElementById("displayQrisText");

  const currentStore = JSON.parse(localStorage.getItem("umkm_store_identity")) || storeIdentity;

  if (metode === "tunai") {
    if (btnTunai) btnTunai.classList.add("active");
    if (btnQris) btnQris.classList.remove("active");
    if (qrisContainer) qrisContainer.style.display = "none";
  } else {
    if (btnQris) btnQris.classList.add("active");
    if (btnTunai) btnTunai.classList.remove("active");
    if (qrisContainer) qrisContainer.style.display = "block";

    if (displayQrisText) {
      displayQrisText.textContent = currentStore.qrisText || "OLAN MAULANA Bank Mandiri 1630011235432";
    }
  }
}

function updateTampilanKeranjang() {
  const totalQty = keranjang.reduce((acc, item) => acc + item.qty, 0);
  const totalHarga = keranjang.reduce((acc, item) => acc + item.harga * item.qty, 0);

  const badge = document.getElementById("cartCountBadge");
  if (badge) badge.textContent = totalQty;
  const floatingBar = document.getElementById("floatingCart");
  if (floatingBar) {
    if (totalQty > 0) {
      floatingBar.style.display = "flex";
      document.getElementById("floatingQty").textContent = `${totalQty} Item di Keranjang`;
      document.getElementById("floatingTotal").textContent = formatRupiah(totalHarga);
    } else {
      floatingBar.style.display = "none";
    }
  }

  const listContainer = document.getElementById("cartItemsList");
  const checkoutSection = document.getElementById("checkoutFormSection");
  if (!listContainer) return;

  if (keranjang.length === 0) {
    listContainer.innerHTML = `<div class="empty-cart" style="text-align:center; padding:20px; color:var(--text-muted);">Keranjang masih kosong.<br>Silakan pilih menu terlebih dahulu.</div>`;
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
        <button type="button" class="btn-mini" onclick="ubahQtyKeranjang(${idx}, -1)">−</button>
        <span>${item.qty}</span>
        <button type="button" class="btn-mini" onclick="ubahQtyKeranjang(${idx}, 1)">+</button>
        <button type="button" class="btn-del" onclick="hapusItemKeranjang(${idx})">Hapus</button>
      </div>
    `;
    listContainer.appendChild(div);
  });

  const grandTotalEl = document.getElementById("cartGrandTotal");
  if (grandTotalEl) grandTotalEl.textContent = formatRupiah(totalHarga);
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
  const namaPemesan = inputNama ? inputNama.value.trim() : "Tamu";
  const nomorMeja = inputMeja ? inputMeja.value.trim() : "";

  if (!namaPemesan) {
    alert("Mohon isi Nama Lengkap pemesan.");
    if (inputNama) inputNama.focus();
    return;
  }
  if (keranjang.length === 0) {
    alert("Keranjang pesanan masih kosong.");
    return;
  }

  const currentStore = JSON.parse(localStorage.getItem("umkm_store_identity")) || storeIdentity;
  const targetWa = currentStore.wa || NOMOR_WA;

  const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
  const keteranganMeja = nomorMeja !== "" ? nomorMeja : "Take Away";
  
  // Menyesuaikan teks metode pembayaran dan status sesuai permintaan
  let labelBayar = "Tunai (Bayar di Kasir)";
  let statusBayar = "Selesai";
  
  if (metodePembayaran === "qris") {
    labelBayar = "QRIS / Transfer (Kirim Bukti Pembayaran segera ya)";
  }

  let pesanWA = `*HALO ${currentStore.name.toUpperCase()}, SAYA MAU PESAN MENU*\n==============================\n`;
  pesanWA += `*No. Order:* ${orderId}\n`;
  pesanWA += `*Nama Pemesan:* ${namaPemesan}\n`;
  pesanWA += `*No. Meja:* ${keteranganMeja}\n`;
  pesanWA += `*Pembayaran:* ${labelBayar}\n`;
  pesanWA += `*Status:* ${statusBayar}\n`;
  pesanWA += `==============================\n\n*DAFTAR PESANAN:*\n`;

  let grandTotal = 0;
  keranjang.forEach((item, i) => {
    const subtotal = item.harga * item.qty;
    grandTotal += subtotal;
    pesanWA += `${i + 1}. *${item.nama}* (${item.qty}x) - ${formatRupiah(subtotal)}\n`;
    if (item.catatan) pesanWA += `   _Catatan: ${item.catatan}_\n`;
  });

  pesanWA += `\n==============================\n*TOTAL BAYAR: ${formatRupiah(grandTotal)}*\n==============================\n\n`;
  pesanWA += `Terima kasih banyak atas kunjungan dan pesanan Anda di *${currentStore.name}*! 🙏✨\n`;
  pesanWA += `Kami sangat senang bisa melayani Anda. Semoga hari Anda menyenangkan, dan kami tunggu kehadiran serta pesanan Anda kembali ya! 😊 Kapan-kapan mampir lagi!`;

  window.open(`https://wa.me/${targetWa}?text=${encodeURIComponent(pesanWA)}`, "_blank");

  if (inputNama) inputNama.value = "";
  if (inputMeja) inputMeja.value = "";
  keranjang = [];
  simpanStateLocal();
  updateTampilanKeranjang();
  const cartModal = document.getElementById("cartModal");
  if (cartModal) cartModal.classList.remove("active");
  tampilkanToast("✓ Pesanan berhasil dikirim ke WhatsApp!");
}

document.addEventListener("DOMContentLoaded", () => {
  applyClientIdentity();
  renderKategoriDrawer();
  renderMenu();
  updateTampilanKeranjang();

  window.addEventListener("storage", () => {
    applyClientIdentity();
    renderKategoriDrawer();
    renderMenu();
  });

  const searchInput = document.getElementById("searchMenuInput");
  const btnClearSearch = document.getElementById("btnClearSearch");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      kataKunciCari = e.target.value.trim();
      if (btnClearSearch) btnClearSearch.style.display = kataKunciCari !== "" ? "flex" : "none";
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

  const bukaDrawerAction = () => {
    document.getElementById("categoryDrawer").classList.add("active");
    document.getElementById("drawerOverlay").classList.add("active");
    renderKategoriDrawer();
  };

  const btnOpenDrawer = document.getElementById("btnOpenDrawer");
  const btnOpenDrawerBrand = document.getElementById("btnOpenDrawerBrand");
  if (btnOpenDrawer) btnOpenDrawer.addEventListener("click", bukaDrawerAction);
  if (btnOpenDrawerBrand) btnOpenDrawerBrand.addEventListener("click", bukaDrawerAction);

  const tutupDrawer = () => {
    const drawer = document.getElementById("categoryDrawer");
    const overlay = document.getElementById("drawerOverlay");
    if (drawer) drawer.classList.remove("active");
    if (overlay) overlay.classList.remove("active");
  };
  const btnCloseDrawer = document.getElementById("btnCloseDrawer");
  const drawerOverlay = document.getElementById("drawerOverlay");
  if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", tutupDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener("click", tutupDrawer);

  const btnCloseItemModal = document.getElementById("btnCloseItemModal");
  if (btnCloseItemModal) btnCloseItemModal.addEventListener("click", tutupModalItem);

  const btnMinusQty = document.getElementById("btnMinusQty");
  if (btnMinusQty) {
    btnMinusQty.addEventListener("click", () => {
      if (qtyModal > 1) { 
        qtyModal--; 
        document.getElementById("modalQtyValue").textContent = qtyModal; 
        document.getElementById("modalTotalPrice").textContent = formatRupiah(itemDipilih.harga * qtyModal); 
      }
    });
  }

  const btnPlusQty = document.getElementById("btnPlusQty");
  if (btnPlusQty) {
    btnPlusQty.addEventListener("click", () => {
      qtyModal++; 
      document.getElementById("modalQtyValue").textContent = qtyModal; 
      document.getElementById("modalTotalPrice").textContent = formatRupiah(itemDipilih.harga * qtyModal); 
    });
  }

  const btnAddToCart = document.getElementById("btnAddToCart");
  if (btnAddToCart) btnAddToCart.addEventListener("click", tambahKeKeranjang);

  const openCartHandler = () => {
    const cartModal = document.getElementById("cartModal");
    if (cartModal) cartModal.classList.add("active");
    pilihMetodeBayar(metodePembayaran);
  };

  const btnOpenCart = document.getElementById("btnOpenCart");
  const btnFloatingOpenCart = document.getElementById("btnFloatingOpenCart");
  if (btnOpenCart) btnOpenCart.addEventListener("click", openCartHandler);
  if (btnFloatingOpenCart) btnFloatingOpenCart.addEventListener("click", openCartHandler);

  const btnCloseCartModal = document.getElementById("btnCloseCartModal");
  if (btnCloseCartModal) {
    btnCloseCartModal.addEventListener("click", () => {
      document.getElementById("cartModal").classList.remove("active");
    });
  }

  const btnSendWhatsApp = document.getElementById("btnSendWhatsApp");
  if (btnSendWhatsApp) btnSendWhatsApp.addEventListener("click", kirimKeWhatsApp);
});
