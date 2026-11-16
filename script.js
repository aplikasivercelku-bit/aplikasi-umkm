const NOMOR_WA = "6287877611218";

let storeIdentity = JSON.parse(localStorage.getItem("umkm_client_store_identity")) || {
  name: "",
  sub: "Pesan Cepat Tanpa Antre",
  logo: ""
};

let menuCustom = JSON.parse(localStorage.getItem("umkm_client_menu_custom")) || [];
let DATA_MENU = [...menuCustom];

let keranjang = JSON.parse(localStorage.getItem("umkm_keranjang")) || [];
let kategoriAktif = localStorage.getItem("umkm_kategori_aktif") || "semua";
let itemDipilih = null;
let qtyModal = 1;
let kataKunciCari = "";
let html5QrCodeScanner = null;

function applyStoreIdentity() {
  const isLogged = localStorage.getItem("umkm_client_logged") === "true";
  
  if (!isLogged || !storeIdentity.name) {
    document.title = "Menu Digital & Pemesanan";
    document.querySelectorAll("#loginLogoText").forEach(el => {
      el.textContent = "QR";
      el.style.background = "var(--bg-elevated)";
      el.style.color = "var(--text-muted)";
    });
    document.querySelectorAll("#loginTitleText").forEach(el => el.textContent = "Silakan Pindai Barcode");
    return;
  }

  document.title = `${storeIdentity.name} - Menu Digital & Pemesanan`;
  document.querySelectorAll("#navBrandTitle").forEach(el => el.textContent = storeIdentity.name);
  document.querySelectorAll("#navBrandSub").forEach(el => el.textContent = storeIdentity.sub);
  document.querySelectorAll("#navBrandLogo").forEach(el => {
    el.textContent = storeIdentity.logo;
    el.style.background = "";
    el.style.color = "";
  });
  document.querySelectorAll("#loginLogoText").forEach(el => {
    el.textContent = storeIdentity.logo;
    el.style.background = "";
    el.style.color = "";
  });
  document.querySelectorAll("#loginTitleText").forEach(el => el.textContent = storeIdentity.name);
}

function formatRupiah(angka) {
  return "Rp " + angka.toLocaleString("id-ID");
}

function simpanStateLocal() {
  localStorage.setItem("umkm_keranjang", JSON.stringify(keranjang));
  localStorage.setItem("umkm_kategori_aktif", kategoriAktif);
  localStorage.setItem("umkm_client_menu_custom", JSON.stringify(menuCustom));
  localStorage.setItem("umkm_client_store_identity", JSON.stringify(storeIdentity));
}

function tampilkanToast(pesan) {
  const toast = document.getElementById("toastNotif");
  if (!toast) return;
  toast.textContent = pesan;
  toast.classList.add("show");
  setTimeout(() => { toast.classList.remove("show"); }, 2200);
}

function prosesDataImporAdmin(parsedData) {
  let daftarMenuBaru = [];

  if (parsedData && typeof parsedData === "object" && !Array.isArray(parsedData)) {
    if (parsedData.store) {
      storeIdentity = {
        name: parsedData.store.name || "Kedai Nusantara",
        sub: parsedData.store.sub || "Pesan Cepat Tanpa Antre",
        logo: parsedData.store.logo || "KN"
      };
    }
    if (Array.isArray(parsedData.menus)) {
      daftarMenuBaru = parsedData.menus.map(m => ({
        id: m.id || Date.now() + Math.random(),
        nama: m.n || m.nama || "Menu",
        kategori: m.k || m.kategori || "kopi",
        labelKategori: m.lk || m.labelKategori || "Menu",
        harga: m.h || m.harga || 0,
        deskripsi: m.d || m.deskripsi || "",
        gambar: m.g || m.gambar || `https://placehold.co/400x300/1f1f24/f59e0b?text=${encodeURIComponent(m.n || m.nama || "Menu")}`
      }));
    }
  } else if (Array.isArray(parsedData)) {
    daftarMenuBaru = parsedData.map(m => ({
      id: m.id || Date.now() + Math.random(),
      nama: m.n || m.nama || "Menu",
      kategori: m.k || m.kategori || "kopi",
      labelKategori: m.lk || m.labelKategori || "Menu",
      harga: m.h || m.harga || 0,
      deskripsi: m.d || m.deskripsi || "",
      gambar: m.g || m.gambar || `https://placehold.co/400x300/1f1f24/f59e0b?text=${encodeURIComponent(m.n || m.nama || "Menu")}`
    }));
  } else {
    return false;
  }

  menuCustom = daftarMenuBaru;
  DATA_MENU = [...menuCustom];
  simpanStateLocal();
  applyStoreIdentity();
  return true;
}

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
      item.nama.toLowerCase().includes(keyword) ||
      item.deskripsi.toLowerCase().includes(keyword) ||
      item.labelKategori.toLowerCase().includes(keyword)
    );
    titleEl.textContent = `Hasil Pencarian: "${kataKunciCari}"`;
  } else {
    titleEl.textContent = namaKategori;
  }

  counterEl.textContent = `${menuTersaring.length} Menu`;
  container.innerHTML = "";

  if (menuTersaring.length === 0) {
    container.innerHTML = `
      <div class="empty-search-state">
        <p style="font-size: 1rem; margin-bottom: 6px; color: var(--text-main);">Menu "<strong>${kataKunciCari}</strong>" tidak ditemukan</p>
        <small>Coba kata kunci lain atau pilih kategori "Semua Menu".</small>
      </div>
    `;
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

function updateHargaModal() {
  document.getElementById("modalQtyValue").textContent = qtyModal;
  document.getElementById("modalTotalPrice").textContent = formatRupiah(itemDipilih.harga * qtyModal);
}

function tambahKeKeranjang() {
  if (!itemDipilih) return;
  const catatan = document.getElementById("inputCatatan").value.trim();

  const indexSama = keranjang.findIndex((k) => k.id === itemDipilih.id && k.catatan.toLowerCase() === catatan.toLowerCase());
  if (indexSama !== -1) {
    keranjang[indexSama].qty += qtyModal;
  } else {
    keranjang.push({
      uid: Date.now(),
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
  const namaPemesan = inputNama.value.trim();
  const nomorMeja = inputMeja.value.trim();

  if (!namaPemesan) {
    alert("Mohon isi Nama Lengkap pemesan terlebih dahulu.");
    inputNama.focus();
    return;
  }

  if (keranjang.length === 0) {
    alert("Keranjang pesanan masih kosong.");
    return;
  }

  const keteranganMeja = nomorMeja !== "" ? nomorMeja : "Take Away";

  let pesanWA = `*HALO, SAYA MAU PESAN MENU (${storeIdentity.name.toUpperCase()})*\n==============================\n`;
  pesanWA += `*Nama Pemesan:* ${namaPemesan}\n*No. Meja:* ${keteranganMeja}\n==============================\n\n*DAFTAR PESANAN:*\n`;

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
  localStorage.removeItem("umkm_nama_pemesan");
  localStorage.removeItem("umkm_no_meja");

  keranjang = [];
  simpanStateLocal();
  updateTampilanKeranjang();
  document.getElementById("cartModal").classList.remove("active");
  tampilkanToast("✓ Pesanan diteruskan ke WA & keranjang dikosongkan!");
}

function bukaDrawer() {
  document.getElementById("categoryDrawer").classList.add("active");
  document.getElementById("drawerOverlay").classList.add("active");
}

function tutupDrawer() {
  document.getElementById("categoryDrawer").classList.remove("active");
  document.getElementById("drawerOverlay").classList.remove("active");
}

document.addEventListener("DOMContentLoaded", () => {
  applyStoreIdentity();

  const loginScreen = document.getElementById("loginScreen");
  const mainAppContent = document.getElementById("mainAppContent");

  const isClientLogged = localStorage.getItem("umkm_client_logged");

  if (isClientLogged === "true") {
    loginScreen.style.display = "none";
    mainAppContent.style.display = "block";
    inisisasiAplikasiUtama();
  } else {
    loginScreen.style.display = "flex";
    mainAppContent.style.display = "none";
  }

  document.getElementById("btnImportAndLogin").addEventListener("click", async () => {
    const fileInput = document.getElementById("importJsonFileInput");
    if (fileInput.files.length === 0) {
      alert("Mohon pilih file gambar Barcode (.png) atau JSON terlebih dahulu!");
      return;
    }

    const file = fileInput.files[0];

    const textReader = new FileReader();
    textReader.onload = async function(ev) {
      const rawContent = ev.target.result;
      const marker = "\n---UMKM_DATA_START---\n";

      if (rawContent.includes(marker)) {
        try {
          const jsonPart = rawContent.split(marker)[1];
          const parsedFullData = JSON.parse(jsonPart);
          if (prosesDataImporAdmin(parsedFullData)) {
            localStorage.setItem("umkm_client_logged", "true");
            loginScreen.style.display = "none";
            mainAppContent.style.display = "block";
            inisisasiAplikasiUtama();
            tampilkanToast(`✓ Berhasil terhubung ke ${storeIdentity.name}!`);
            return;
          }
        } catch (err) {
          console.error("Gagal membaca metadata foto:", err);
        }
      }

      if (file.name.endsWith(".json") || file.type === "application/json") {
        try {
          const parsedData = JSON.parse(rawContent);
          if (prosesDataImporAdmin(parsedData)) {
            localStorage.setItem("umkm_client_logged", "true");
            loginScreen.style.display = "none";
            mainAppContent.style.display = "block";
            inisisasiAplikasiUtama();
            tampilkanToast(`✓ Berhasil terhubung ke ${storeIdentity.name}!`);
          } else {
            alert("Format file tidak valid.");
          }
        } catch (err) {
          alert("Gagal membaca file JSON.");
        }
        return;
      }

      try {
        tampilkanToast("Memindai kode QR...");
        const html5QrCode = new Html5Qrcode("reader");
        const decodedText = await html5QrCode.scanFile(file, true);
        html5QrCode.clear();

        const parsedQrData = JSON.parse(decodedText);
        if (prosesDataImporAdmin(parsedQrData)) {
          localStorage.setItem("umkm_client_logged", "true");
          loginScreen.style.display = "none";
          mainAppContent.style.display = "block";
          inisisasiAplikasiUtama();
          tampilkanToast(`✓ Barcode ${storeIdentity.name} berhasil diakses!`);
        } else {
          alert("Data barcode tidak sesuai.");
        }
      } catch (err) {
        alert("Gagal memindai barcode. Pastikan Anda mengunggah file gambar barcode yang baru diunduh dari Admin.");
      }
    };
    textReader.readAsText(file);
  });

  let cameraActive = false;
  document.getElementById("btnToggleCameraLogin").addEventListener("click", () => {
    const readerDiv = document.getElementById("reader");
    if (!cameraActive) {
      readerDiv.style.display = "block";
      cameraActive = true;
      html5QrCodeScanner = new Html5Qrcode("reader");
      html5QrCodeScanner.start(
        { facingMode: "environment" },
        { 
          fps: 15, 
          qrbox: { width: 250, height: 250 },
          experimentalFeatures: { useBarCodeDetectorIfSupported: true }
        },
        (decodedText) => {
          try {
            const parsedData = JSON.parse(decodedText);
            if (prosesDataImporAdmin(parsedData)) {
              localStorage.setItem("umkm_client_logged", "true");
              html5QrCodeScanner.stop().then(() => {
                readerDiv.style.display = "none";
                cameraActive = false;
                loginScreen.style.display = "none";
                mainAppContent.style.display = "block";
                inisisasiAplikasiUtama();
                tampilkanToast(`✓ Barcode ${storeIdentity.name} berhasil dipindai!`);
              }).catch(() => {
                readerDiv.style.display = "none";
                cameraActive = false;
                loginScreen.style.display = "none";
                mainAppContent.style.display = "block";
                inisisasiAplikasiUtama();
              });
            }
          } catch (err) {
            console.log("Menunggu fokus QR code yang valid...");
          }
        },
        () => {}
      ).catch(() => { alert("Tidak dapat mengakses kamera. Pastikan izin kamera aktif."); });
    } else {
      if (html5QrCodeScanner) {
        html5QrCodeScanner.stop().then(() => {
          readerDiv.style.display = "none";
          cameraActive = false;
        }).catch(() => {
          readerDiv.style.display = "none";
          cameraActive = false;
        });
      }
    }
  });

  const btnLogout = document.getElementById("btnLogoutApp");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      if (confirm("Yakin ingin keluar dari sesi menu ini?")) {
        localStorage.removeItem("umkm_client_logged");
        localStorage.removeItem("umkm_nama_pemesan");
        localStorage.removeItem("umkm_no_meja");
        localStorage.removeItem("umkm_keranjang");
        localStorage.removeItem("umkm_client_store_identity");
        localStorage.removeItem("umkm_client_menu_custom");
        location.reload();
      }
    });
  }
});

function inisisasiAplikasiUtama() {
  applyStoreIdentity();

  localStorage.removeItem("umkm_nama_pemesan");
  localStorage.removeItem("umkm_no_meja");
  const inputNama = document.getElementById("customerName");
  const inputMeja = document.getElementById("tableNumber");
  if (inputNama) inputNama.value = "";
  if (inputMeja) inputMeja.value = "";

  DATA_MENU = [...menuCustom];
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
      searchInput.focus();
    });
  }

  document.getElementById("btnOpenDrawer").addEventListener("click", bukaDrawer);
  document.getElementById("btnCloseDrawer").addEventListener("click", tutupDrawer);
  document.getElementById("drawerOverlay").addEventListener("click", tutupDrawer);

  document.getElementById("btnCloseItemModal").addEventListener("click", tutupModalItem);
  document.getElementById("itemModal").addEventListener("click", (e) => {
    if (e.target.id === "itemModal") tutupModalItem();
  });

  document.getElementById("btnMinusQty").addEventListener("click", () => {
    if (qtyModal > 1) { qtyModal--; updateHargaModal(); }
  });
  document.getElementById("btnPlusQty").addEventListener("click", () => {
    qtyModal++; updateHargaModal();
  });
  document.getElementById("btnAddToCart").addEventListener("click", tambahKeKeranjang);

  document.getElementById("btnOpenCart").addEventListener("click", () => {
    document.getElementById("cartModal").classList.add("active");
  });
  document.getElementById("btnFloatingOpenCart").addEventListener("click", () => {
    document.getElementById("cartModal").classList.add("active");
  });
  document.getElementById("btnCloseCartModal").addEventListener("click", () => {
    document.getElementById("cartModal").classList.remove("active");
  });
  document.getElementById("cartModal").addEventListener("click", (e) => {
    if (e.target.id === "cartModal") document.getElementById("cartModal").classList.remove("active");
  });

  document.getElementById("btnSendWhatsApp").addEventListener("click", kirimKeWhatsApp);
}
