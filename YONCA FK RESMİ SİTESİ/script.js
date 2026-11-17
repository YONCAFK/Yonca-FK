import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// SENİN FIREBASE BİLGİLERİN
const firebaseConfig = {
    apiKey: "AIzaSyDF_UHbezL4SgqRy3wGa9_Q75xrED5zavY",
    authDomain: "yonca-fk.firebaseapp.com",
    projectId: "yonca-fk",
    storageBucket: "yonca-fk.firebasestorage.app",
    messagingSenderId: "443179548637",
    appId: "1:443179548637:web:83c7d837c4fecb1e544034",
    measurementId: "G-NNVPYEK0WD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Sekme Geçişleri
window.showSection = (section) => {
    document.getElementById('playersSection').classList.add('hidden');
    document.getElementById('standingsSection').classList.add('hidden');
    document.getElementById('adminPanel').classList.add('hidden');

    if (section === 'players') document.getElementById('playersSection').classList.remove('hidden');
    if (section === 'standings') document.getElementById('standingsSection').classList.remove('hidden');
    if (section === 'admin') document.getElementById('adminPanel').classList.remove('hidden');
};

window.openLoginModal = () => document.getElementById('loginModal').classList.remove('hidden');
window.closeLoginModal = () => document.getElementById('loginModal').classList.add('hidden');

// Admin Giriş İşlemi
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const pass = document.getElementById('adminPassword').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        closeLoginModal();
        showSection('admin');
    } catch (error) {
        alert("Giriş başarısız: " + error.message);
    }
});

window.logoutAdmin = () => {
    signOut(auth);
    showSection('players');
};

onAuthStateChanged(auth, (user) => {
    const navBtn = document.getElementById('adminNavBtn');
    if (user) {
        navBtn.textContent = "Admin Paneli";
        navBtn.onclick = () => showSection('admin');
    } else {
        navBtn.textContent = "Admin Girişi";
        navBtn.onclick = openLoginModal;
    }
});

// OYUNCULARI CANLI ÇEKME
onSnapshot(collection(db, "players"), (snapshot) => {
    const grid = document.getElementById('playersGrid');
    const adminList = document.getElementById('adminPlayersList');
    grid.innerHTML = "";
    adminList.innerHTML = "";

    snapshot.forEach((docSnap) => {
        const p = docSnap.data();
        const id = docSnap.id;
        const statusClass = p.status === 'İlk 11' ? 'status-active' : (p.status === 'Yedek' ? 'status-bench' : 'status-injured');

        grid.innerHTML += `
            <div class="player-card">
                <div class="card-top">
                    <span>#${p.number}</span>
                    <span>${p.position}</span>
                </div>
                <div class="player-avatar">🏃‍♂️</div>
                <div class="player-name">${p.name}</div>
                <div class="player-value">Değer: ${p.value}</div>
                <div class="match-status ${statusClass}">${p.status || 'İlk 11'}</div>
            </div>
        `;

        adminList.innerHTML += `
            <div class="admin-item-row">
                <strong>${p.name}</strong>
                <input type="number" id="num-${id}" value="${p.number}" style="width:70px">
                <input type="text" id="val-${id}" value="${p.value}" style="width:110px">
                <select id="stat-${id}">
                    <option value="İlk 11" ${p.status === 'İlk 11' ? 'selected' : ''}>İlk 11</option>
                    <option value="Yedek" ${p.status === 'Yedek' ? 'selected' : ''}>Yedek</option>
                    <option value="Sakat/Cezalı" ${p.status === 'Sakat/Cezalı' ? 'selected' : ''}>Sakat/Cezalı</option>
                </select>
                <button onclick="updatePlayer('${id}')">Güncelle</button>
                <button class="delete-btn" onclick="deletePlayer('${id}')">Sil</button>
            </div>
        `;
    });
});

document.getElementById('addPlayerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "players"), {
        name: document.getElementById('pName').value,
        position: document.getElementById('pPos').value,
        number: Number(document.getElementById('pNumber').value),
        value: document.getElementById('pValue').value,
        status: "İlk 11"
    });
    e.target.reset();
});

window.updatePlayer = async (id) => {
    await updateDoc(doc(db, "players", id), {
        number: Number(document.getElementById(`num-${id}`).value),
        value: document.getElementById(`val-${id}`).value,
        status: document.getElementById(`stat-${id}`).value
    });
    alert("Oyuncu güncellendi!");
};

window.deletePlayer = async (id) => {
    if (confirm("Silmek istediğine emin misin?")) {
        await deleteDoc(doc(db, "players", id));
    }
};

// PUAN TABLOSU
const qStandings = query(collection(db, "standings"), orderBy("points", "desc"));
onSnapshot(qStandings, (snapshot) => {
    const tbody = document.getElementById('standingsBody');
    const adminTeams = document.getElementById('adminTeamsList');
    tbody.innerHTML = "";
    adminTeams.innerHTML = "";
    let rank = 1;

    snapshot.forEach((docSnap) => {
        const t = docSnap.data();
        const id = docSnap.id;

        tbody.innerHTML += `
            <tr>
                <td>${rank++}</td>
                <td><strong>${t.name}</strong></td>
                <td>${t.played}</td>
                <td>${t.win}</td>
                <td>${t.draw}</td>
                <td>${t.loss}</td>
                <td><strong>${t.points}</strong></td>
            </tr>
        `;

        adminTeams.innerHTML += `
            <div class="admin-item-row">
                <span>${t.name} - ${t.points} Puan</span>
                <button class="delete-btn" onclick="deleteTeam('${id}')">Sil</button>
            </div>
        `;
    });
});

document.getElementById('addTeamForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "standings"), {
        name: document.getElementById('tName').value,
        played: Number(document.getElementById('tPlayed').value),
        win: Number(document.getElementById('tWin').value),
        draw: Number(document.getElementById('tDraw').value),
        loss: Number(document.getElementById('tLoss').value),
        points: Number(document.getElementById('tPoints').value)
    });
    e.target.reset();
});

window.deleteTeam = async (id) => {
    await deleteDoc(doc(db, "standings", id));
};