
import { app, db } from './firebase-init.js';
import { collection, query, where, getDocs, getDoc, addDoc, doc, deleteDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";



window.loginAdmin = async () => {
const inputId = document.getElementById("loginID").value.trim();
const password = document.getElementById("loginPassword").value.trim();

try {
const q = query(collection(db, "Admin"), where("id", "==", inputId));
const snapshot = await getDocs(q);

if (snapshot.empty) return alert("Admin ID not found!");

let matched = false;
snapshot.forEach(docSnap => {
const data = docSnap.data();
if (data.password === password) {
matched = true;
sessionStorage.setItem("loggedInAdmin", JSON.stringify({ id: data.id, name: data.name }));
alert("Welcome Admin: " + data.name);
window.location.href = "homeadm.html";
}
});

if (!matched) alert("Invalid password!");
} catch (err) {
console.error(err);
alert("Login error: " + err.message);
}
};


async function handleQrLogin() {
const params = new URLSearchParams(window.location.search);
const encoded = params.get("data");
if (!encoded) return;

try {
const qrData = JSON.parse(atob(encoded));
if (!qrData.id) throw new Error("Invalid QR data");

const q = query(collection(db, "Students"), where("id", "==", qrData.id));
const snapshot = await getDocs(q);
if (snapshot.empty) throw new Error("Student not found");

const student = snapshot.docs[0].data();
sessionStorage.setItem("loggedInStudent", JSON.stringify({
id: student.id,
name: student.first + " " + student.last,
strand: student.strand
}));

if (!window.location.href.includes("homest.html")) {
window.location.href = "homest.html";
}
} catch (err) {
console.error("QR Login failed:", err);
}
}

async function populateQrAnnouncementSelect() {
const sel = document.getElementById('qrAnnouncementSelect');
if (!sel) return;
sel.innerHTML = '<option value="">(No announcement)</option>';
try {
const snapshot = await getDocs(collection(db, 'Announcements'));
snapshot.forEach(s => {
const opt = document.createElement('option');
opt.value = s.id;
opt.textContent = s.data().title || s.id;
sel.appendChild(opt);
});
} catch (err) {
console.error('Failed to load announcements for QR select', err);
}
}


window.showPage = function(pageId) {
	document.querySelectorAll('#defaultPage, #profilePage, #studentRecordsPage, #announcementPage, #servicePage, #gradesPage, #clearancePage')
		.forEach(el => el.classList.add('d-none'));

const page = document.getElementById(pageId);
if (page) page.classList.remove('d-none');

localStorage.setItem("currentPage", pageId);

document.querySelectorAll("#menuList button").forEach(btn => {
btn.classList.remove("active");
if (btn.dataset.page === pageId) btn.classList.add("active");
});




const breadcrumb = document.querySelector(`#${pageId} #breadcrumb`);
if (breadcrumb) {
breadcrumb.innerHTML = pageId === "defaultPage" ? "" : `
<nav aria-label="breadcrumb">
<ol class="breadcrumb">
<li class="breadcrumb-item"><a href="#" onclick="showPage('defaultPage')">Home</a></li>
<li class="breadcrumb-item active" aria-current="page">${pageId.replace(/([A-Z])/g, ' $1').trim()}</li>
</ol>
</nav>`;
}
};


const origShowPage = window.showPage;
window.showPage = function(pageId) {
	origShowPage(pageId);
	if (pageId === 'servicePage' || pageId === 'requestsPage') {
		try { loadRequests(); } catch(e) { console.error('Failed to start requests listener', e); }
	}
	
	if (pageId === 'gradesPage') {
		try { loadGrades(); } catch(e) { console.error('Failed to load grades', e); }
	}
	if (pageId === 'clearancePage') {
		try { loadClearance(); } catch(e) { console.error('Failed to load clearance', e); }
	}
};


function setWelcomeMessages() {

const adminData = JSON.parse(sessionStorage.getItem("loggedInAdmin") || "{}");



if (adminData?.name && document.getElementById("welcomeMsg")) {
document.getElementById("welcomeMsg").textContent = adminData.name;
}
}

async function loadStudents() {
const table = document.querySelector("#studentsTable tbody");
if (!table) return;
table.innerHTML = ""; 

const snapshot = await getDocs(collection(db, "Students"));
const adminData = JSON.parse(sessionStorage.getItem("loggedInAdmin") || "{}");
const showPassword = !!adminData?.name; 

snapshot.forEach(d => {
const s = d.data();
table.innerHTML += `
<tr>
<td><input type="checkbox" class="rowCheck" data-docid="${d.id}"></td>
<td>${s.id}</td>
<td>${s.first}</td>
<td>${s.last}</td>
<td>${s.strand}</td>
<td>${s.year || ''}</td>
${showPassword ? `<td>${s.password || ''}</td>` : ''}
</tr>`;
});
}



function setupTableFilters() {
const searchInput = document.getElementById("searchInput");
const strandFilter = document.getElementById("strandFilter");
const yearFilter = document.getElementById("yearFilter");
const searchButton = document.getElementById("searchButton");
const tableBody = document.querySelector("#studentsTable tbody");

function filterTable() {
const searchValue = searchInput.value.toLowerCase();
const strandValue = strandFilter.value;
const yearValue = yearFilter.value;

Array.from(tableBody.rows).forEach(row => {
const id = row.cells[1].innerText.toLowerCase();
const firstName = row.cells[2].innerText.toLowerCase();
const lastName = row.cells[3].innerText.toLowerCase();
const strand = row.cells[4].innerText;
const year = row.cells[5].innerText;

const matchesSearch = id.includes(searchValue) || firstName.includes(searchValue) || lastName.includes(searchValue);
const matchesStrand = strandValue === "" || strand === strandValue;
const matchesYear = yearValue === "" || year === yearValue;

row.style.display = matchesSearch && matchesStrand && matchesYear ? "" : "none";
});
}


searchButton.addEventListener("click", filterTable);


searchInput.addEventListener("input", () => {
if (!searchInput.value.trim()) {
Array.from(tableBody.rows).forEach(row => row.style.display = "");
}
});

strandFilter.addEventListener("change", filterTable);
yearFilter.addEventListener("change", filterTable);
}


window.addEventListener("DOMContentLoaded", () => {

setWelcomeMessages();


handleQrLogin();


const savedPage = localStorage.getItem("currentPage");
if (savedPage && document.getElementById(savedPage)) {
showPage(savedPage);
} else {
showPage("defaultPage");
}


loadStudents();
setupTableFilters(); 
setupQrButtons(); 
setupAdminButtons(); 
setupEditStudent(); 
setupDeleteStudent();
 loadRequests(); 
populateQrAnnouncementSelect();
loadGrades();
setupGradesHandlers();
loadClearance();
setupClearanceHandlers();


document.querySelectorAll('a[href="admin.html"], a[href="student.html"]').forEach(a => {
a.addEventListener("click", () => sessionStorage.clear());
});
});




function setupQrButtons() {
const qrCanvas = document.getElementById("qrCanvas");
if (!qrCanvas) return;

document.getElementById("generateQrBtn")?.addEventListener("click", () => {
const selected = Array.from(document.querySelectorAll(".rowCheck:checked"));
if (selected.length !== 1) return alert("Select exactly one student!");

const row = selected[0].closest("tr").children;
const studentId = row[1].innerText;

const announcementSelect = document.getElementById('qrAnnouncementSelect');
const selectedAnnouncement = announcementSelect ? announcementSelect.value : '';
const payload = { id: studentId };
if (selectedAnnouncement) payload.announcement = selectedAnnouncement;
const qrData = btoa(JSON.stringify(payload));

const baseInput = document.getElementById('qrBaseUrl');
const base = baseInput && baseInput.value.trim() ? baseInput.value.trim() : window.location.origin;
const loginUrl = `${base.replace(/\/$/, '')}/homest.html?data=${qrData}`;


qrCanvas.innerHTML = "";

new QRCode(qrCanvas, {
text: loginUrl,
width: 200,
height: 200
});
alert(`QR code generated for Student ID: ${studentId}`);


["downloadPngBtn", "downloadJpegBtn", "printPdfBtn"].forEach(id => {
const btn = document.getElementById(id);
if (!btn) return;

btn.onclick = () => {
const link = document.createElement("a");

const img = qrCanvas.querySelector('img');
const cvs = qrCanvas.querySelector('canvas');
let dataUrl = null;

if (img) {

dataUrl = img.src;
} else if (cvs) {
dataUrl = cvs.toDataURL('image/png');
} else {
return alert('No QR generated yet.');
}

if (id === "downloadPngBtn") {
link.download = `${studentId}_QR.png`;
link.href = dataUrl;
link.click();
} else if (id === "downloadJpegBtn") {

const tmp = document.createElement('canvas');
const ctx = tmp.getContext('2d');
const image = new Image();
image.onload = () => {
tmp.width = image.width;
tmp.height = image.height;
ctx.drawImage(image, 0, 0);
link.download = `${studentId}_QR.jpeg`;
link.href = tmp.toDataURL('image/jpeg');
link.click();
};
image.src = dataUrl;
} else if (id === "printPdfBtn") {
const pdf = new jsPDF.jsPDF();
pdf.text("Student QR Code", 10, 10);
pdf.text(`ID: ${studentId}`, 10, 20);
pdf.addImage(dataUrl, "PNG", 10, 30, 50, 50);
pdf.save(`${studentId}_QR.pdf`);
}
};
});
});
}





function setupAdminButtons() {
const formSection = document.getElementById("studentFormSection");
const saveBtn = document.getElementById("saveStudentBtn");
const updateBtn = document.getElementById("updateStudentBtn");


document.getElementById("addStudentBtn")?.addEventListener("click", () => {
formSection.classList.remove("d-none"); 
saveBtn.classList.remove("d-none"); 
updateBtn.classList.add("d-none");


["studentId", "studentPass", "firstName", "lastName", "strand", "year"].forEach(id => {
const el = document.getElementById(id);
if (el) el.value = "";
});
});


saveBtn?.addEventListener("click", async () => {
const studentId = document.getElementById("studentId").value.trim();
const pass = document.getElementById("studentPass").value.trim();
const first = document.getElementById("firstName").value.trim();
const last = document.getElementById("lastName").value.trim();
const strand = document.getElementById("strand").value;
const year = document.getElementById("year").value;

if (!studentId || !pass || !first || !last || !strand || !year) {
return alert("Please fill in all student fields.");
}

try {

const q = query(collection(db, "Students"), where("id", "==", studentId));
const snapshot = await getDocs(q);
if (!snapshot.empty) return alert("A student with this ID already exists.");


await addDoc(collection(db, "Students"), {
id: studentId,
password: pass,
first,
last,
strand,
year,
createdAt: new Date().toISOString()
});

alert("Student saved successfully!");
formSection.classList.add("d-none");

loadStudents();
} catch (err) {
console.error(err);
alert("Failed to save student: " + err.message);
}
});
}




function setupEditStudent() {
document.getElementById("editStudentBtn")?.addEventListener("click", () => {
const selected = Array.from(document.querySelectorAll(".rowCheck:checked"));
if (selected.length !== 1) {
alert("Please select exactly one student to edit.");
return;
}

const row = selected[0].closest("tr").children;
const docId = selected[0].dataset.docid;

document.getElementById("docId").value = docId;
document.getElementById("studentId").value = row[1].innerText;
document.getElementById("firstName").value = row[2].innerText;
document.getElementById("lastName").value = row[3].innerText;
document.getElementById("strand").value = row[4].innerText;
document.getElementById("year").value = row[5].innerText;
document.getElementById("studentPass").value = row[6].innerText;

document.getElementById("studentFormSection").classList.remove("d-none");
document.getElementById("saveStudentBtn").classList.add("d-none");
document.getElementById("updateStudentBtn").classList.remove("d-none");
});

document.getElementById("updateStudentBtn")?.addEventListener("click", async () => {
const docId = document.getElementById("docId").value;
const first = document.getElementById("firstName").value.trim();
const last = document.getElementById("lastName").value.trim();
const strand = document.getElementById("strand").value;
const year = document.getElementById("year").value;
const pass = document.getElementById("studentPass").value.trim();

if (!docId) return alert("No student selected for update!");

try {
await setDoc(doc(db, "Students", docId), {
id: document.getElementById("studentId").value.trim(),
first, last, strand, year, password: pass
});
alert("Student updated successfully!");
document.getElementById("studentFormSection").classList.add("d-none");
loadStudents();
} catch (err) {
console.error(err);
alert("Failed to update student: " + err.message);
}
});
}



function setupDeleteStudent() {
    document.getElementById("deleteStudentBtn")?.addEventListener("click", async () => {
        const selected = Array.from(document.querySelectorAll(".rowCheck:checked"));
        if (selected.length === 0) return alert("Please select at least one student to delete.");
        if (!confirm("Are you sure you want to delete selected student(s) and all related data?")) return;

        try {
            for (const chk of selected) {
                const docId = chk.dataset.docid;
                const studentRow = chk.closest("tr");
                const studentId = studentRow.cells[1].innerText;

        
                await deleteDoc(doc(db, "Students", docId));

           
                const reqSnapshot = await getDocs(query(collection(db, "Requests"), where("studentId", "==", studentId)));
                for (const r of reqSnapshot.docs) await deleteDoc(doc(db, "Requests", r.id));

            
                const gradeSnapshot = await getDocs(query(collection(db, "Grades"), where("studentId", "==", studentId)));
                for (const g of gradeSnapshot.docs) await deleteDoc(doc(db, "Grades", g.id));

      
                const clearanceSnapshot = await getDocs(query(collection(db, "Clearance"), where("studentId", "==", studentId)));
                for (const c of clearanceSnapshot.docs) await deleteDoc(doc(db, "Clearance", c.id));
            }

            alert("Selected student(s) and all related data deleted!");
            loadStudents();
            loadRequests();
            loadGrades();
            loadClearance();
        } catch (err) {
            console.error(err);
            alert("Failed to delete student and related data: " + err.message);
        }
    });
}



async function loadRequests() {
	const table = document.querySelector('#requestsTable tbody');
	if (!table) return;
	table.innerHTML = '';



	if (window._requestsUnsub) {
		try { window._requestsUnsub(); } catch(e){}
		window._requestsUnsub = null;
	}

	const colRef = collection(db, 'Requests');
	window._requestsUnsub = onSnapshot(colRef, (snap) => {
		table.innerHTML = '';
		snap.forEach(docSnap => {
			const r = docSnap.data();
			const status = r.status || 'Pending';
			const tr = document.createElement('tr');
			tr.innerHTML = `
				<td>${r.studentId}</td>
				<td>${r.name}</td>
				<td>${r.requestType}</td>
				<td>${status}</td>
				<td>
					<button class="btn btn-sm btn-success approve-request" data-id="${docSnap.id}">Approve</button>
					<button class="btn btn-sm btn-warning claim-request" data-id="${docSnap.id}">Claim</button>
					<button class="btn btn-sm btn-danger reject-request" data-id="${docSnap.id}">Reject</button>
				</td>
			`;
			table.appendChild(tr);
		});
	}, (err) => {
		console.error('Requests listener error', err);
	});
}


document.addEventListener('click', async (e) => {
	if (e.target.classList.contains('approve-request') || e.target.classList.contains('reject-request') || e.target.classList.contains('claim-request')) {
		const id = e.target.dataset.id;
		let newStatus = 'Pending';
		if (e.target.classList.contains('approve-request')) newStatus = 'Approved';
		else if (e.target.classList.contains('reject-request')) newStatus = 'Rejected';
		else if (e.target.classList.contains('claim-request')) newStatus = 'Claimed';
		try {
			await setDoc(doc(db, 'Requests', id), { status: newStatus }, { merge: true });
			alert('Request updated: ' + newStatus);
		
		} catch (err) {
			console.error('Failed to update request', err);
			alert('Update failed');
		}
	}
});




const announcementFormSection = document.getElementById("announcementFormSection");
const addAnnouncementBtn = document.getElementById("addAnnouncementBtn");
const saveAnnouncementBtn = document.getElementById("saveAnnouncementBtn");
const updateAnnouncementBtn = document.getElementById("updateAnnouncementBtn");
const editAnnouncementBtn = document.getElementById("editAnnouncementBtn");
const deleteAnnouncementBtn = document.getElementById("deleteAnnouncementBtn");

const titleInput = document.getElementById("announcementTitle");
const contentInput = document.getElementById("announcementContent");
const dateInput = document.getElementById("announcementDate");

addAnnouncementBtn?.addEventListener("click", () => {
announcementFormSection.classList.remove("d-none");
titleInput.value = "";
contentInput.value = "";
dateInput.value = "";
saveAnnouncementBtn.classList.remove("d-none");
updateAnnouncementBtn.classList.add("d-none");
document.getElementById("announcementId").value = "";
});


saveAnnouncementBtn?.addEventListener("click", async () => {
if (!titleInput.value || !contentInput.value || !dateInput.value) {
return alert("Please fill in all fields.");
}
try {
await addDoc(collection(db, "Announcements"), {
title: titleInput.value,
content: contentInput.value,
date: dateInput.value,
status: "Active",
createdAt: new Date().toISOString()
});
alert("Announcement added!");
announcementFormSection.classList.add("d-none");
loadAnnouncements();
} catch (err) {
alert("Error: " + err.message);
}
});
async function loadAnnouncements() {
const table = document.querySelector("#announcementTable tbody");
if (!table) return;
table.innerHTML = "";

const snapshot = await getDocs(collection(db, "Announcements"));
const today = new Date();

snapshot.forEach(docSnap => {
const data = docSnap.data();
const id = docSnap.id;


const annDate = new Date(data.date);
let status = "Upcoming";
if (annDate < today) status = "Done";
else if (
annDate.getFullYear() === today.getFullYear() &&
annDate.getMonth() === today.getMonth() &&
annDate.getDate() === today.getDate()
) {
status = "Ongoing";
}

const row = document.createElement("tr");
row.innerHTML = `
<td><input type="checkbox" class="announcement-checkbox" value="${id}"></td>
<td>${id}</td>
<td>${data.title}</td>
<td>${data.date}</td>
<td>${status}</td>
<td><button class="btn btn-sm btn-primary generate-qr-btn" data-id="${id}">QR</button></td>
`;
table.appendChild(row);
});
}



editAnnouncementBtn?.addEventListener("click", async () => {
const selected = Array.from(document.querySelectorAll(".announcement-checkbox:checked"));
if (selected.length !== 1) return alert("Please select exactly one announcement.");

const docId = selected[0].value;
const snap = await getDoc(doc(db, "Announcements", docId));
if (!snap.exists()) return alert("Announcement not found.");

const data = snap.data();
document.getElementById("announcementId").value = docId;
titleInput.value = data.title;
contentInput.value = data.content;
dateInput.value = data.date;

announcementFormSection.classList.remove("d-none");
saveAnnouncementBtn.classList.add("d-none");
updateAnnouncementBtn.classList.remove("d-none");
});


updateAnnouncementBtn?.addEventListener("click", async () => {
const docId = document.getElementById("announcementId").value;
if (!docId) return alert("No announcement selected!");

try {
await setDoc(doc(db, "Announcements", docId), {
title: titleInput.value,
content: contentInput.value,
date: dateInput.value,
status: "Active",
updatedAt: new Date().toISOString()
});
alert("Announcement updated!");
announcementFormSection.classList.add("d-none");
loadAnnouncements();
} catch (err) {
alert("Update failed: " + err.message);
}
});


deleteAnnouncementBtn?.addEventListener("click", async () => {
const selected = Array.from(document.querySelectorAll(".announcement-checkbox:checked"));
if (selected.length === 0) return alert("Please select at least one.");
if (!confirm("Delete selected announcement(s)?")) return;

try {
for (const chk of selected) {
await deleteDoc(doc(db, "Announcements", chk.value));
}
alert("Deleted successfully!");
loadAnnouncements();
} catch (err) {
alert("Delete failed: " + err.message);
}
});


document.addEventListener("DOMContentLoaded", () => {
loadAnnouncements();

if (typeof loadStudentAnnouncements === 'function') loadStudentAnnouncements(); 
});


function getSelectedAnnouncements() {
return Array.from(document.querySelectorAll('.announcement-checkbox:checked')).map(cb => cb.value);
}


const generateQRBtn = document.getElementById("generateQRBtn"); 
const qrContainer = document.getElementById("announcementQrContainer");

generateQRBtn?.addEventListener("click", async () => {
const selected = getSelectedAnnouncements();
if (selected.length !== 1) return alert("Select exactly one announcement!");

const id = selected[0];
const snap = await getDoc(doc(db, "Announcements", id));
if (!snap.exists()) return;

const a = snap.data();


if (qrContainer) qrContainer.innerHTML = "";


if (qrContainer) {
new QRCode(qrContainer, {
text: `ID: ${id}\nTitle: ${a.title}\nDate: ${a.date}`,
width: 200,
height: 200
});
}


const modalEl = document.getElementById("announcementQrModal") || document.getElementById("qrModal");
if (modalEl) new bootstrap.Modal(modalEl).show();
});


document.addEventListener("click", async (e) => {

if (e.target.classList.contains("generate-qr-btn-announcement") || e.target.classList.contains("generate-qr-btn")) {
const id = e.target.getAttribute("data-id");
const snap = await getDoc(doc(db, "Announcements", id));
if (!snap.exists()) return;

const data = snap.data();
const container = document.getElementById("announcementQrContainer");
container.innerHTML = "";

new QRCode(container, {
text: `Announcement ID: ${id}\nTitle: ${data.title}\nDate: ${data.date}`,
width: 200,
height: 200
});

new bootstrap.Modal(document.getElementById("announcementQrModal")).show();
}
});


document.getElementById('announcementDownloadPngBtn')?.addEventListener('click', () => {
const container = document.getElementById('announcementQrContainer');
const img = container.querySelector('img');
const cvs = container.querySelector('canvas');
if (!img && !cvs) return alert('No QR to download');

const link = document.createElement('a');
if (img) {
link.href = img.src;
link.download = 'announcement_QR.png';
link.click();
} else {
link.href = cvs.toDataURL('image/png');
link.download = 'announcement_QR.png';
link.click();
}
});

document.getElementById('announcementDownloadJpegBtn')?.addEventListener('click', () => {
const container = document.getElementById('announcementQrContainer');
const img = container.querySelector('img');
const cvs = container.querySelector('canvas');
if (!img && !cvs) return alert('No QR to download');

const link = document.createElement('a');
const tmp = document.createElement('canvas');
const ctx = tmp.getContext('2d');
const image = new Image();
image.onload = () => {
tmp.width = image.width;
tmp.height = image.height;
ctx.drawImage(image, 0, 0);
link.href = tmp.toDataURL('image/jpeg');
link.download = 'announcement_QR.jpeg';
link.click();
};
image.src = img ? img.src : cvs.toDataURL('image/png');
});

async function loadGrades() {
	const table = document.querySelector('#gradesTable tbody');
	if (!table) return;
	table.innerHTML = '';
	try {
		const snapshot = await getDocs(collection(db, 'Grades'));
		snapshot.forEach(snap => {
			const g = snap.data();
			const tr = document.createElement('tr');
			tr.innerHTML = `
				<td><input type="checkbox" class="grade-checkbox" value="${snap.id}"></td>
				<td>${g.studentId || ''}</td>
				<td>${g.code || ''}</td>
				<td>${g.name || ''}</td>
				<td>${g.teacher || ''}</td>
				<td>${g.firstQuarter ?? ''}</td>
				<td>${g.secondQuarter ?? ''}</td>
				<td>${g.thirdQuarter ?? ''}</td>
				<td>${g.fourthQuarter ?? ''}</td>
				<td>${g.remark || ''}</td>
			`;
			table.appendChild(tr);
		});
	} catch (err) {
		console.error('loadGrades error', err);
	}
}

function setupGradesHandlers() {
	document.getElementById('addGradeBtn')?.addEventListener('click', () => {
		document.getElementById('gradeFormSection').classList.remove('d-none');
		document.getElementById('saveGradeBtn').classList.remove('d-none');
		document.getElementById('updateGradeBtn').classList.add('d-none');
		[
			'gradeDocId','gradeStudentId','gradeCode','gradeName','gradeInstructor',
			'gradeFirstQuarter','gradeSecondQuarter','gradeThirdQuarter','gradeFourthQuarter',
			'gradeRemark'
		].forEach(id => {
			const el = document.getElementById(id);
			if (el) el.value = '';
		});
	});

	document.getElementById('saveGradeBtn')?.addEventListener('click', async () => {
		const payload = {
			studentId: document.getElementById('gradeStudentId').value.trim(),
			code: document.getElementById('gradeCode').value.trim(),
			name: document.getElementById('gradeName').value.trim(),
			teacher: document.getElementById('gradeInstructor').value.trim(),
			firstQuarter: parseFloat(document.getElementById('gradeFirstQuarter').value) || null,
			secondQuarter: parseFloat(document.getElementById('gradeSecondQuarter').value) || null,
			thirdQuarter: parseFloat(document.getElementById('gradeThirdQuarter').value) || null,
			fourthQuarter: parseFloat(document.getElementById('gradeFourthQuarter').value) || null,
			remark: document.getElementById('gradeRemark').value.trim(),
			createdAt: new Date().toISOString()
		};
		if (!payload.studentId || !payload.code)
			return alert('Student ID and Code are required');
		try {
			await addDoc(collection(db, 'Grades'), payload);
			alert('Grade added');
			document.getElementById('gradeFormSection').classList.add('d-none');
			loadGrades();
		} catch (e) {
			console.error(e);
			alert('Failed to add grade');
		}
	});

	document.getElementById('editGradeBtn')?.addEventListener('click', async () => {
		const selected = Array.from(document.querySelectorAll('.grade-checkbox:checked'));
		if (selected.length !== 1) return alert('Select exactly one grade to edit');
		const docId = selected[0].value;
		const snap = await getDoc(doc(db, 'Grades', docId));
		if (!snap.exists()) return alert('Grade not found');
		const g = snap.data();
		document.getElementById('gradeDocId').value = docId;
		document.getElementById('gradeStudentId').value = g.studentId || '';
		document.getElementById('gradeCode').value = g.code || '';
		document.getElementById('gradeName').value = g.name || '';
		document.getElementById('gradeInstructor').value = g.teacher || '';
		document.getElementById('gradeFirstQuarter').value = g.firstQuarter ?? '';
		document.getElementById('gradeSecondQuarter').value = g.secondQuarter ?? '';
		document.getElementById('gradeThirdQuarter').value = g.thirdQuarter ?? '';
		document.getElementById('gradeFourthQuarter').value = g.fourthQuarter ?? '';
		document.getElementById('gradeRemark').value = g.remark || '';
		document.getElementById('gradeFormSection').classList.remove('d-none');
		document.getElementById('saveGradeBtn').classList.add('d-none');
		document.getElementById('updateGradeBtn').classList.remove('d-none');
	});

	document.getElementById('updateGradeBtn')?.addEventListener('click', async () => {
		const docId = document.getElementById('gradeDocId').value;
		if (!docId) return alert('No grade selected');
		const payload = {
			studentId: document.getElementById('gradeStudentId').value.trim(),
			code: document.getElementById('gradeCode').value.trim(),
			name: document.getElementById('gradeName').value.trim(),
			teacher: document.getElementById('gradeInstructor').value.trim(),
			firstQuarter: parseFloat(document.getElementById('gradeFirstQuarter').value) || null,
			secondQuarter: parseFloat(document.getElementById('gradeSecondQuarter').value) || null,
			thirdQuarter: parseFloat(document.getElementById('gradeThirdQuarter').value) || null,
			fourthQuarter: parseFloat(document.getElementById('gradeFourthQuarter').value) || null,
			remark: document.getElementById('gradeRemark').value.trim(),
			updatedAt: new Date().toISOString()
		};
		try {
			await setDoc(doc(db, 'Grades', docId), payload, { merge: true });
			alert('Grade updated');
			document.getElementById('gradeFormSection').classList.add('d-none');
			loadGrades();
		} catch (e) {
			console.error(e);
			alert('Update failed');
		}
	});

	document.getElementById('deleteGradeBtn')?.addEventListener('click', async () => {
		const selected = Array.from(document.querySelectorAll('.grade-checkbox:checked'));
		if (selected.length === 0) return alert('Select at least one grade to delete');
		if (!confirm('Delete selected grade(s)?')) return;
		try {
			for (const s of selected)
				await deleteDoc(doc(db, 'Grades', s.value));
			alert('Deleted');
			loadGrades();
		} catch (e) {
			console.error(e);
			alert('Delete failed');
		}
	});

	document.getElementById('selectAllGrades')?.addEventListener('change', function () {
		document.querySelectorAll('.grade-checkbox').forEach(cb => cb.checked = this.checked);
	});
}


async function loadStudentIds() {
  const dropdown = document.getElementById('studentIdDropdown');
  if (!dropdown) return;

  dropdown.innerHTML = '<li><span class="dropdown-item-text text-muted">Loading...</span></li>';
  try {
    const snap = await getDocs(collection(db, 'Students'));
    dropdown.innerHTML = '';

    snap.forEach(docSnap => {
      const s = docSnap.data();
      const li = document.createElement('li');
      li.innerHTML = `<a class="dropdown-item" href="#">${s.id || '(no ID)'} - ${s.name || ''}</a>`;
      li.addEventListener('click', () => {
        document.getElementById('gradeStudentId').value = s.id || '';
      });
      dropdown.appendChild(li);
    });

    if (dropdown.innerHTML.trim() === '') {
      dropdown.innerHTML = '<li><span class="dropdown-item-text text-muted">No students found</span></li>';
    }
  } catch (e) {
    console.error('loadStudentIds error', e);
    dropdown.innerHTML = '<li><span class="dropdown-item-text text-danger">Failed to load</span></li>';
  }
}


document.addEventListener('DOMContentLoaded', loadStudentIds);




async function loadClearance() {
	const table = document.querySelector('#clearanceTable tbody');
	if (!table) return;
	table.innerHTML = '';
	try {
		const snapshot = await getDocs(collection(db, 'Clearance'));
		snapshot.forEach(snap => {
			const c = snap.data();
			const tr = document.createElement('tr');
			tr.innerHTML = `
				<td><input type="checkbox" class="clearance-checkbox" value="${snap.id}"></td>
				<td>${c.studentId || ''}</td>
				<td>${c.subject || ''}</td>
				<td>${c.instructor || ''}</td>
				<td>${c.cleared === true ? 'Yes' : 'No'}</td>
				<td>${c.remarks || ''}</td>
			`;
			table.appendChild(tr);
		});
	} catch (err) { console.error('loadClearance error', err); }
}

function setupClearanceHandlers() {
	document.getElementById('addClearanceBtn')?.addEventListener('click', () => {
		document.getElementById('clearanceFormSection').classList.remove('d-none');
		document.getElementById('saveClearanceBtn').classList.remove('d-none');
		document.getElementById('updateClearanceBtn').classList.add('d-none');
		['clearanceDocId','clearanceStudentId','clearanceSubject','clearanceInstructor','clearanceCleared','clearanceRemarks'].forEach(id=>{const el=document.getElementById(id); if(el) el.value='';});
	});

	document.getElementById('saveClearanceBtn')?.addEventListener('click', async () => {
		const payload = {
			studentId: document.getElementById('clearanceStudentId').value.trim(),
			subject: document.getElementById('clearanceSubject').value.trim(),
			instructor: document.getElementById('clearanceInstructor').value.trim(),
			cleared: document.getElementById('clearanceCleared').value === 'true',
			remarks: document.getElementById('clearanceRemarks').value.trim(),
			createdAt: new Date().toISOString()
		};
		if (!payload.studentId || !payload.subject) return alert('Student ID and Subject required');
		try { await addDoc(collection(db,'Clearance'), payload); alert('Clearance added'); document.getElementById('clearanceFormSection').classList.add('d-none'); loadClearance(); } catch(e){console.error(e); alert('Failed to add clearance'); }
	});

	document.getElementById('editClearanceBtn')?.addEventListener('click', async () => {
		const selected = Array.from(document.querySelectorAll('.clearance-checkbox:checked'));
		if (selected.length !== 1) return alert('Select exactly one clearance to edit');
		const docId = selected[0].value;
		const snap = await getDoc(doc(db,'Clearance',docId));
		if (!snap.exists()) return alert('Clearance not found');
		const c = snap.data();
		document.getElementById('clearanceDocId').value = docId;
		document.getElementById('clearanceStudentId').value = c.studentId || '';
		document.getElementById('clearanceSubject').value = c.subject || '';
		document.getElementById('clearanceInstructor').value = c.instructor || '';
		document.getElementById('clearanceCleared').value = c.cleared === true ? 'true' : 'false';
		document.getElementById('clearanceRemarks').value = c.remarks || '';
		document.getElementById('clearanceFormSection').classList.remove('d-none');
		document.getElementById('saveClearanceBtn').classList.add('d-none');
		document.getElementById('updateClearanceBtn').classList.remove('d-none');
	});

	document.getElementById('updateClearanceBtn')?.addEventListener('click', async () => {
		const docId = document.getElementById('clearanceDocId').value;
		if (!docId) return alert('No clearance selected');
		const payload = {
			studentId: document.getElementById('clearanceStudentId').value.trim(),
			subject: document.getElementById('clearanceSubject').value.trim(),
			instructor: document.getElementById('clearanceInstructor').value.trim(),
			cleared: document.getElementById('clearanceCleared').value === 'true',
			remarks: document.getElementById('clearanceRemarks').value.trim(),
			updatedAt: new Date().toISOString()
		};
		try { await setDoc(doc(db,'Clearance',docId), payload, {merge:true}); alert('Clearance updated'); document.getElementById('clearanceFormSection').classList.add('d-none'); loadClearance(); } catch(e){console.error(e); alert('Update failed'); }
	});

	document.getElementById('deleteClearanceBtn')?.addEventListener('click', async () => {
		const selected = Array.from(document.querySelectorAll('.clearance-checkbox:checked'));
		if (selected.length === 0) return alert('Select at least one clearance to delete');
		if (!confirm('Delete selected clearance(s)?')) return;
		try { for (const s of selected) await deleteDoc(doc(db,'Clearance', s.value)); alert('Deleted'); loadClearance(); } catch(e){console.error(e); alert('Delete failed'); }
	});

	document.getElementById('selectAllClearance')?.addEventListener('change', function(){ document.querySelectorAll('.clearance-checkbox').forEach(cb=>cb.checked = this.checked); });
}

async function loadClearanceStudentIds() {
  const dropdown = document.getElementById('clearanceIdDropdown');
  if (!dropdown) return;

  dropdown.innerHTML = '<li><span class="dropdown-item-text text-muted">Loading...</span></li>';
  try {
    const snap = await getDocs(collection(db, 'Students'));
    dropdown.innerHTML = '';

    snap.forEach(docSnap => {
      const s = docSnap.data();
      const li = document.createElement('li');
      li.innerHTML = `<a class="dropdown-item" href="#">${s.id || '(no ID)'} - ${s.name || ''}</a>`;
      li.addEventListener('click', () => {
        document.getElementById('clearanceStudentId').value = s.id || '';
      });
      dropdown.appendChild(li);
    });

    if (dropdown.innerHTML.trim() === '') {
      dropdown.innerHTML = '<li><span class="dropdown-item-text text-muted">No students found</span></li>';
    }
  } catch (e) {
    console.error('loadClearanceStudentIds error', e);
    dropdown.innerHTML = '<li><span class="dropdown-item-text text-danger">Failed to load</span></li>';
  }
}


document.addEventListener('DOMContentLoaded', loadClearanceStudentIds);
