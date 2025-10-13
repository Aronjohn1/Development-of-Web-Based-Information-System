
import { app, db } from './firebase-init.js';
import { collection, query, where, getDocs, getDoc, addDoc, deleteDoc, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


window.loginStudent = async () => {
  const inputIdEl = document.getElementById('studentID');
  const pwdEl = document.getElementById('studentPassword');
  console.log('[web-student] loginStudent called');
 
  const inputId = (inputIdEl ? inputIdEl.value : (document.getElementById('loginID')?.value || '')).trim();
  const password = (pwdEl ? pwdEl.value : (document.getElementById('loginPassword')?.value || '')).trim();

  if (!inputId || !password) return alert('Please enter ID and password');

  try {
    const q = query(collection(db, 'Students'), where('id', '==', inputId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return alert('Student ID not found!');

    let matched = false;
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.password === password) {
        matched = true;
        sessionStorage.setItem('loggedInStudent', JSON.stringify({ id: data.id, name: (data.first || '') + ' ' + (data.last || ''), strand: data.strand }));
        alert('Welcome Student: ' + (data.first || data.id));
        window.location.href = 'homest.html';
      }
    });

    if (!matched) alert('Invalid password!');
  } catch (err) {
    console.error(err);
    alert('Login error: ' + err.message);
  }
};





window.showPage = function(pageId) {
  document.querySelectorAll('#defaultPage, #profilePage, #announcementPage, #servicePage')
    .forEach(el => el.classList.add('d-none'));
  const page = document.getElementById(pageId);
  if (page) page.classList.remove('d-none');
  localStorage.setItem('currentPage', pageId);
};


document.querySelectorAll(".menu-btn").forEach(btn => {
  btn.addEventListener("click", function() {
 
    document.querySelectorAll(".menu-btn").forEach(b => b.classList.remove("active"));

    this.classList.add("active");
  });
});





const viewPersonalBtn = document.getElementById("viewPersonalBtn");
if (viewPersonalBtn) viewPersonalBtn.click();


function setWelcomeMessages() {
  const studentData = JSON.parse(sessionStorage.getItem('loggedInStudent') || '{}');
  if (studentData?.name) {
    const elWelcome = document.getElementById('welcomeMsg');
    if (elWelcome) elWelcome.textContent = studentData.name;
    const elWelcomeS = document.getElementById('welcomeMsgs');
    if (elWelcomeS) elWelcomeS.textContent = studentData.name;
    const elWelcomeSS = document.getElementById('welcomeMsgss');
    if (elWelcomeSS) elWelcomeSS.textContent = studentData.name;
    const elStrand = document.getElementById('studentStrand');
    if (elStrand) elStrand.textContent = studentData.strand || '';
    const elId = document.getElementById('studentID');
    if (elId) elId.textContent = studentData.id || '';
  }
}   


async function handleQrLogin() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('data');
  const announcementParam = params.get('announcement');
  if (!encoded) return null;

  try {
    const qrData = JSON.parse(atob(encoded));
    if (!qrData.id) throw new Error('Invalid QR data');

    const q = query(collection(db, 'Students'), where('id', '==', qrData.id));
    const snapshot = await getDocs(q);
    if (snapshot.empty) throw new Error('Student not found');

    const student = snapshot.docs[0].data();
    sessionStorage.setItem('loggedInStudent', JSON.stringify({
      id: student.id,
      name: (student.first || '') + ' ' + (student.last || ''),
      strand: student.strand || ''
    }));

    setWelcomeMessages();

    const annId = announcementParam || qrData.announcement;
   
    try { const url = new URL(window.location.href); url.searchParams.delete('data'); window.history.replaceState({}, '', url.pathname + url.search); } catch (e){}
    return annId || null;
  } catch (err) {
    console.error('QR Login failed:', err);
    return null;
  }
}


async function loadStudentAnnouncements() {
  const container = document.getElementById('studentAnnouncements');
  if (!container) return;
  container.innerHTML = '';
  try {
    const snapshot = await getDocs(collection(db, 'Announcements'));
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const el = document.createElement('div');
      el.className = 'card p-3 mb-2';
      el.innerHTML = `
        <h5>${data.title}</h5>
        <p>${data.content || ''}</p>
        <p><small>${data.date}</small></p>
      `;
      container.appendChild(el);
    });
  } catch (err) {
    console.error('Failed to load announcements:', err);
    container.innerHTML = '<div class="alert alert-danger">Failed to load announcements.</div>';
  }
}


async function findStudentDocIdByStudentId(studentId) {
  const q = query(collection(db, 'Students'), where('id', '==', studentId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].id; 
}

async function loadProfileIfPresent() {
 
  const student = JSON.parse(sessionStorage.getItem('loggedInStudent') || '{}');
  if (!student?.id) return;


  try {
 
    const docId = await findStudentDocIdByStudentId(student.id);
    if (!docId) return;
    const snap = await getDocs(query(collection(db, 'Students'), where('id','==', student.id)));
    const data = snap.docs[0].data();

 
    if (document.getElementById('studentID')) document.getElementById('studentID').textContent = student.id;
        if (document.getElementById('studentid')) document.getElementById('studentid').textContent = student.id;
    if (document.getElementById('welcomeMsgss')) document.getElementById('welcomeMsgss').textContent = student.name || '';
    if (document.getElementById('studentEmail')) document.getElementById('studentEmail').textContent = data.email || data.emailAddress || '';
    if (document.getElementById('studentDOB')) document.getElementById('studentDOB').textContent = data.dob || data.birth || '';

    const pphoto = document.getElementById('profilePhoto') || document.getElementById('studentPic');
    if (pphoto && data.photoDataUrl) pphoto.src = data.photoDataUrl;
  
  const leftCardEl = document.getElementById('leftProfileCard');
  if (leftCardEl) leftCardEl.classList.remove('invisible');


    if (document.getElementById('profileStudentId')) document.getElementById('profileStudentId').textContent = student.id;
    if (document.getElementById('profileName')) document.getElementById('profileName').textContent = student.name || '';
    if (document.getElementById('profileEmail')) document.getElementById('profileEmail').textContent = data.email || data.emailAddress || '-';
    if (document.getElementById('profileDob')) document.getElementById('profileDob').textContent = data.dob || data.birth || '-';


const menuPhoto = document.getElementById('profilePhotoMenu');
const cardPhoto = document.getElementById('profilePhotoCard');
if (data.photoDataUrl) {
  if (menuPhoto) menuPhoto.src = data.photoDataUrl;
  if (cardPhoto) cardPhoto.src = data.photoDataUrl;
}

  



    document.getElementById('editProfileBtn')?.addEventListener('click', () => {

      document.getElementById('editEmail').value = data.email || data.emailAddress || '';
      document.getElementById('editDob').value = data.dob ? (new Date(data.dob)).toISOString().slice(0,10) : '';
      if (data.photoDataUrl) document.getElementById('editProfilePhotoPreview').src = data.photoDataUrl;

      document.getElementById('saveProfileBtn').dataset.docid = docId;
      new bootstrap.Modal(document.getElementById('editProfileModal')).show();
    });

 
document.getElementById('editPhotoInput')?.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const newPhoto = reader.result;
    document.getElementById('editProfilePhotoPreview').src = newPhoto;


    if (menuPhoto) menuPhoto.src = newPhoto;
    if (cardPhoto) cardPhoto.src = newPhoto;

    document.getElementById('saveProfileBtn').dataset.photo = newPhoto;
  };
  reader.readAsDataURL(file);
});


    document.getElementById('saveProfileBtn')?.addEventListener('click', async () => {
      try {
        let docId = document.getElementById('saveProfileBtn').dataset.docid;
        const student = JSON.parse(sessionStorage.getItem('loggedInStudent') || '{}');
        if (!docId) {

          if (!student?.id) return alert('Not logged in — cannot save profile. Please login first.');
          console.log('[web-student] docId missing, looking up by student id', student.id);
          docId = await findStudentDocIdByStudentId(student.id);
          if (!docId) return alert('Student document not found; cannot save profile.');
        }

        const newEmail = document.getElementById('editEmail').value.trim();
        const newDob = document.getElementById('editDob').value;
        const photo = document.getElementById('saveProfileBtn').dataset.photo;
        const updates = {};
        if (newEmail) updates.email = newEmail;
        if (newDob) updates.dob = newDob;
        if (photo) updates.photoDataUrl = photo;

        if (Object.keys(updates).length === 0) return alert('No changes to save.');

        console.log('[web-student] saving profile', docId, updates);
        await setDoc(doc(db, 'Students', docId), updates, { merge: true });

        try {
          const fresh = await getDoc(doc(db, 'Students', docId));
          if (fresh && fresh.exists && typeof fresh.data === 'function') {
            const stored = fresh.data();
            console.log('[web-student] refreshed saved profile', stored);
          
            const emailVal = stored.email || stored.emailAddress || '';
            const dobVal = stored.dob || stored.birth || '';
            const photoVal = stored.photoDataUrl || null;
            if (document.getElementById('profileEmail')) document.getElementById('profileEmail').textContent = emailVal || '-';
            if (document.getElementById('studentEmail')) document.getElementById('studentEmail').textContent = emailVal || '';
            if (document.getElementById('profileDob')) document.getElementById('profileDob').textContent = dobVal || '-';
            if (document.getElementById('studentDOB')) document.getElementById('studentDOB').textContent = dobVal || '';
            if (photoVal) {
              if (document.getElementById('profilePhoto')) document.getElementById('profilePhoto').src = photoVal;
              if (document.getElementById('studentPic')) document.getElementById('studentPic').src = photoVal;
            }
          } else {
            console.warn('[web-student] saved doc not found after setDoc');
          }
        } catch (refreshErr) {
          console.error('Failed to re-fetch saved profile:', refreshErr);
        }
        alert('Profile updated');
  
        delete document.getElementById('saveProfileBtn').dataset.photo;
        bootstrap.Modal.getOrCreateInstance(document.getElementById('editProfileModal')).hide();
      } catch (err) {
        console.error('saveProfile failed', err);
        alert('Failed to save profile: ' + (err.message || err));
      }
    });

  } catch (e) { console.error('loadProfileIfPresent failed', e); }
}


async function openAnnouncementModal(id) {
  try {
    const snapshot = await getDocs(collection(db,'Announcements'));
    let found = null;
    snapshot.forEach(s => { if (s.id === id) found = s.data(); });
    if (!found) return alert('Announcement not found');
    document.getElementById('announcementModalTitle').textContent = found.title;
    document.getElementById('announcementModalContent').textContent = found.content;
    document.getElementById('announcementModalDate').textContent = found.date;
    window.currentAnnouncementId = id;
    new bootstrap.Modal(document.getElementById('announcementModal')).show();
  } catch (e) {
    console.error(e);
  }
}


async function renderGradesView() {
  const student = JSON.parse(sessionStorage.getItem('loggedInStudent') || '{}');
  const container = document.getElementById('profileContent');
  if (!container) return;

  container.innerHTML = `
    <div class="d-flex align-items-center">
      <strong class="me-3">Loading grades...</strong>
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>`;

  if (!student?.id) {
    container.innerHTML = '<div class="alert alert-warning">Please login to view grades.</div>';
    return;
  }

  try {
    const q = query(collection(db, 'Grades'), where('studentId', '==', student.id));
    const snap = await getDocs(q);

      let html = `<div class="card p-3"><h4>Grades ${student.strand || ''}</h4>`;
    html += `<div class="table-responsive">
               <table class="table table-bordered mt-3">
                 <thead class="table-primary">
                   <tr>
                     <th>Code</th>
                     <th>Subject Name</th>
                     <th>Teacher</th>
                     <th>1st Quarter</th>
                     <th>2nd Quarter</th>
                     <th>3rd Quarter</th>
                     <th>4th Quarter</th>
                     <th>Remark</th>
                   </tr>
                 </thead>
                 <tbody>`;

    snap.forEach(d => {
      const r = d.data();
      html += `<tr>
                 <td>${r.code || ''}</td>
                 <td>${r.name || ''}</td>
                 <td>${r.teacher || r.instructor || ''}</td>
                 <td>${r.firstQuarter || r.prelim || ''}</td>
                 <td>${r.secondQuarter || r.midterm || ''}</td>
                 <td>${r.thirdQuarter || ''}</td>
                 <td>${r.fourthQuarter || ''}</td>
                 <td>${r.remark || ''}</td>
               </tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;

  } catch (e) {
    console.error('renderGradesView error', e);
    container.innerHTML = '<div class="alert alert-danger">Failed to load grades.</div>';
  }
}



function renderPersonalView() {
  const student = JSON.parse(sessionStorage.getItem('loggedInStudent') || '{}');
  const container = document.getElementById('profileContent');
  if (!container) return;
  const name = student.name || '';
  const id = student.id || document.getElementById('studentID')?.textContent || '';
  const email = document.getElementById('profileEmail')?.textContent || '';
  const dob = document.getElementById('profileDob')?.textContent || '';

  const html = `
    <div class="card p-3 shadow-sm">
      <h4 class="mb-3">${name}</h4>
      <div class="row">
        <div class="col-md-4"><strong>Student ID:</strong></div>
        <div class="col-md-8">${id}</div>
      </div>
      <div class="row mt-2">
        <div class="col-md-4"><strong>Email:</strong></div>
        <div class="col-md-8">${email || '-'}</div>
      </div>
      <div class="row mt-2">
        <div class="col-md-4"><strong>Date of Birth:</strong></div>
        <div class="col-md-8">${dob || '-'}</div>
      </div>
    </div>`;
  container.innerHTML = html;
}


let _originalLeftParent = null;
let _leftCardPlaceholder = null;
function showLeftCardInContent() {

  const leftCard = document.getElementById('leftProfileCard');
  const container = document.getElementById('profileContent');
  if (!leftCol || !leftCard || !container) return;

  if (!_originalLeftParent) _originalLeftParent = leftCol;
  if (!_leftCardPlaceholder) {
    _leftCardPlaceholder = document.createElement('div');
    _leftCardPlaceholder.style.display = 'none';
    leftCol.parentNode.insertBefore(_leftCardPlaceholder, leftCol);
  }

  container.innerHTML = '';

  leftCard.classList.remove('invisible');

  leftCard.classList.add('w-100', 'mx-auto', 'mb-3');
  leftCard.style.maxWidth = '700px';
  container.appendChild(leftCard);
}

function restoreLeftCard() {
  const leftCol = document.getElementById('leftProfileCol');
   const leftCard = document.getElementById('leftProfileCard');
  if (!leftCol || !leftCard || !_leftCardPlaceholder) return;

  leftCol.appendChild(leftCard);

  leftCard.classList.remove('w-100', 'mx-auto', 'mb-3');
  leftCard.style.maxWidth = '';

  const container = document.getElementById('profileContent');
  if (container) container.innerHTML = '';
}



async function renderClearanceView() {
  const student = JSON.parse(sessionStorage.getItem('loggedInStudent') || '{}');
  const container = document.getElementById('profileContent');
  if (!container) return;
  container.innerHTML = '<h4>Clearance Status</h4><p>Loading...</p>';
  if (!student?.id) return container.innerHTML = '<div class="alert alert-warning">Please login to view clearance status.</div>';

  try {
    const q = query(collection(db, 'Clearance'), where('studentId', '==', student.id));
    const snap = await getDocs(q);

    let html = `<div class="card p-3"><h5>Grade ${student.strand || ''}</h5>`;
    html += `<div class="table-responsive">
               <table class="table table-bordered mt-3">
                   <thead class="table-primary">
                   <tr>
                     <th>Subject</th><th>Teacher</th><th>Status</th><th>Remarks</th>
                   </tr>
                 </thead>
                 <tbody>`;

    snap.forEach(d => {
      const r = d.data();
      const statusLabel = r.cleared ? '<span class="text-success">Cleared</span>' : '<span class="text-danger">Not Cleared</span>';
      html += `<tr>
                 <td>${r.subject || ''}</td>
                 <td>${r.instructor || ''}</td>
                 <td>${statusLabel}</td>
                 <td>${r.remarks || ''}</td>
               </tr>`;
    });

    html += `</tbody></table></div></div>`; 
    container.innerHTML = html;

  } catch (e) {
    console.error('renderClearanceView error', e);
    container.innerHTML = '<div class="alert alert-danger">Failed to load clearance status.</div>';
  }
}



async function initStudentApp() {
  console.log('[web-student] initStudentApp start');
  const annIdFromQr = await handleQrLogin();
  setWelcomeMessages();

  try { loadProfileIfPresent(); } catch(e) { console.error('profile load error', e); }
  loadStudentAnnouncements();
  loadMyRequests();


  try {
    const saved = localStorage.getItem('currentPage');
    const student = JSON.parse(sessionStorage.getItem('loggedInStudent') || '{}');
    if (saved && document.getElementById(saved)) {
      showPage(saved);
    } else if (student?.id) {
      showPage('profilePage');
    }
  } catch (e) {  }

 
  if (annIdFromQr) { showPage('announcementPage'); setTimeout(()=> openAnnouncementModal(annIdFromQr), 300); }

 
  document.getElementById('submitRequestBtn')?.addEventListener('click', () => {
    const type = document.getElementById('requestType').value;
    if (!type) return alert('Please select a request type');
    submitServiceRequest(type);
  });

 
  document.getElementById('viewPersonalBtn')?.addEventListener('click', () => { showLeftCardInContent(); renderPersonalView(); });
  document.getElementById('viewGradesBtn')?.addEventListener('click', () => { restoreLeftCard(); renderGradesView(); });
  document.getElementById('viewClearanceBtn')?.addEventListener('click', () => { restoreLeftCard(); renderClearanceView(); });


  document.getElementById('announcementModalSaveBtn')?.addEventListener('click', () => {
    const id = window.currentAnnouncementId; if (!id) return alert('No announcement selected'); saveAnnouncement(id);
    try { const modalEl = document.getElementById('announcementModal'); bootstrap.Modal.getOrCreateInstance(modalEl).hide(); } catch(e){}
  });

 
  const loginBtn = document.getElementById('studentLoginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[web-student] studentLoginBtn clicked');
      if (typeof window.loginStudent === 'function') {
        window.loginStudent();
      } else {
        alert('Login function not available yet.');
      }
    });
  }

 
  document.addEventListener('click', (evt) => {
    const btn = evt.target.closest && evt.target.closest('.menu-btn');
    if (!btn) return;
    const page = btn.dataset.page;
    if (!page) return;

    if (typeof window.showPage === 'function') {
      window.showPage(page);
    } else {
      document.getElementById('defaultPage')?.classList.add('d-none');
      document.querySelectorAll('#profilePage,#announcementPage,#servicePage').forEach(el => el.classList.add('d-none'));
      document.getElementById(page)?.classList.remove('d-none');
    }

    try { const off = bootstrap.Offcanvas.getInstance(document.getElementById('sidebar')); if (off) off.hide(); } catch(e){}
  });

  console.log('[web-student] initStudentApp done');
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initStudentApp);
} else {
  initStudentApp();
}

window.saveAnnouncement = async function(id) {
  try {
    const snapshot = await getDocs(collection(db,'Announcements'));
    let found = null;
    snapshot.forEach(s => { if (s.id === id) found = {id: s.id, ...s.data()}; });
    if (!found) return alert('Announcement not found');
    const saved = JSON.parse(localStorage.getItem('savedAnnouncements') || '[]');
    if (saved.find(a=>a.id === found.id)) return alert('Already saved');
    saved.push(found);
    localStorage.setItem('savedAnnouncements', JSON.stringify(saved));
    alert('Announcement saved to your device.');
  } catch (e) { console.error(e); alert('Failed to save'); }
};


async function submitServiceRequest(type) {
  const student = JSON.parse(sessionStorage.getItem('loggedInStudent') || '{}');
  if (!student?.id) return alert('You must be logged in to submit a request');

  const pickupDateInput = document.getElementById('pickupDate');
  const pickupDate = pickupDateInput?.value || '';

  if (!type) return alert('Please select a request type.');
  if (!pickupDate) return alert('Please select a pickup date.');


  const q = query(
    collection(db, 'Requests'),
    where('studentId', '==', student.id),
    where('requestType', '==', type)
  );
  const snapshot = await getDocs(q);
  let hasActive = false;
  snapshot.forEach(s => {
    const r = s.data();
    if (!r.status || r.status !== 'Rejected') hasActive = true;
  });
  if (hasActive) return alert('You already have a pending/active request of this type.');


  await addDoc(collection(db, 'Requests'), {
    studentId: student.id,
    name: student.name,
    requestType: type,
    pickupDate: pickupDate,
    status: 'Pending',
    createdAt: new Date().toISOString()
  });

  alert('Request submitted. Status: Pending');
  pickupDateInput.value = '';
  loadMyRequests();
}



async function loadMyRequests() {
  const table = document.querySelector('#myRequestsTable tbody');
  if (!table) return;
  table.innerHTML = '';

  const student = JSON.parse(sessionStorage.getItem('loggedInStudent') || '{}');
  if (!student?.id) return;

  try {
    if (window._myRequestsUnsub) {
      try { window._myRequestsUnsub(); } catch (e) {}
      window._myRequestsUnsub = null;
    }

    const q = query(collection(db, 'Requests'), where('studentId', '==', student.id));
    window._myRequestsUnsub = onSnapshot(q, (snap) => {
      table.innerHTML = '';
      snap.forEach(docSnap => {
        const r = docSnap.data();
        const status = r.status || 'Pending';
        const pickupDate = r.pickupDate ? new Date(r.pickupDate) : null;
        const today = new Date();
        let actionHTML = '';


        if (status === 'Pending') {

          actionHTML = `<button class="btn btn-sm btn-outline-danger delete-my-request" data-id="${docSnap.id}">Delete</button>`;
        } else if (status === 'Approved') {

          if (pickupDate) {
            if (today < pickupDate) {
   
              actionHTML = `<span class="badge bg-warning text-dark">Processing</span>`;
            } else if (today.toDateString() === pickupDate.toDateString()) {
   
              actionHTML = `<button class="btn btn-sm btn-success claim-request" data-id="${docSnap.id}">Claim</button>`;
            } else if (today > pickupDate) {
          
              actionHTML = `<span class="badge bg-primary">Upcoming</span>`;
            }
          } else {
            actionHTML = `<span class="badge bg-secondary">Awaiting Date</span>`;
          }
        } else if (status === 'Claimed') {

          actionHTML = `<span class="badge bg-success">Claimed</span>`;
        } else if (status === 'Rejected') {
          actionHTML = `<span class="badge bg-danger">Rejected</span>`;
        }


        let colorClass = '';
        if (status === 'Pending') colorClass = 'text-danger';
        else if (status === 'Approved') colorClass = 'text-success';
        else if (status === 'Rejected') colorClass = 'text-warning';
        else if (status === 'Claimed') colorClass = 'text-success fw-bold';

    
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${r.requestType}</td>
          <td class="${colorClass}">${status}</td>
          <td>${r.pickupDate || '-'}</td>
          <td>${actionHTML}</td>
        `;

        table.appendChild(tr);
      });
    }, (err) => console.error('My requests listener error', err));

  } catch (e) {
    console.error(e);
  }
}


const requestTypeSelect = document.getElementById('requestType');
const pickupDateContainer = document.getElementById('pickupDateContainer');

if (requestTypeSelect) {
  requestTypeSelect.addEventListener('change', () => {
    if (requestTypeSelect.value) pickupDateContainer.classList.remove('d-none');
    else pickupDateContainer.classList.add('d-none');
  });
}


document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('delete-my-request')) {
    const id = e.target.dataset.id;
    if (!confirm('Delete this request?')) return;
    try { await deleteDoc(doc(db,'Requests', id)); alert('Deleted'); loadMyRequests(); } catch (err) { console.error(err); alert('Delete failed'); }
  }
});



