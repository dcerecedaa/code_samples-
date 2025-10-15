// ----------- GLOBAL VARIABLE AND STATUS MAPPING -----------
let currentStatus = 'pending';  // Logical frontend status

const validStatuses = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected'
};

// ----------- GENERAL FUNCTIONS AND FORMS -----------

document.addEventListener('DOMContentLoaded', () => {
  // --- Sidebar navigation ---
  const menuLinks = document.querySelectorAll('.sidebar a');
  const contentSections = document.querySelectorAll('.section-content');

  function showSection(id) {
    contentSections.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
  }

  function setActiveLink(link) {
    menuLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  }

  menuLinks.forEach(l => l.addEventListener('click', e => {
    e.preventDefault();
    showSection(l.dataset.section);
    setActiveLink(l);
  }));
  showSection('schedule-view');

  // --- Dynamic loading ---
  async function loadUsers() {
    try {
      const res = await fetch('/api/usuarios');
      const users = await res.json();

      const selectModify = document.getElementById('usuarioModificar');
      const selectCreate = document.getElementById('select-usuario');

      [selectModify, selectCreate].forEach(select => {
        if (select) {
          select.innerHTML = '<option value="">Select...</option>';
          users.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id_usuario;
            opt.textContent = `${u.id_usuario} – ${u.nombre}`;
            select.appendChild(opt);
          });
        }
      });
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }

  async function loadSchedules() {
    try {
      const res = await fetch('/api/horario');
      const schedules = await res.json();

      const selectIds = ['idHorarioModificar', 'select-eliminar'];

      selectIds.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
          select.innerHTML = '<option value="">Select...</option>';
          schedules.forEach(h => {
            const opt = document.createElement('option');
            opt.value = h.id_horario;
            opt.textContent = `${h.id_horario} – User: ${h.nombre}`;
            select.appendChild(opt);
          });
        }
      });
    } catch (err) {
      console.error('Error loading schedules:', err);
    }
  }

  async function loadSchedulesAdmin() {
    try {
      const res = await fetch('/api/horario');
      const data = await res.json();
      const tbody = document.querySelector('#adminScheduleTable tbody');
      tbody.innerHTML = '';

      data.forEach(h => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${h.id_horario}</td>
          <td>${h.nombre}</td>
          <td>${h.lunes || '-'}</td><td>${h.martes || '-'}</td><td>${h.miercoles || '-'}</td>
          <td>${h.jueves || '-'}</td><td>${h.viernes || '-'}</td><td>${h.sabado || '-'}</td>
          <td>${h.domingo || '-'}</td>
        `;
        tbody.appendChild(row);
      });
    } catch (err) {
      console.error('Error loading admin schedules:', err);
    }
  }

  loadUsers();
  loadSchedules();
  loadSchedulesAdmin();

  // --- FORMS ---
  class UserForm {
    constructor(sel) {
      this.form = document.querySelector(sel);
      if (this.form) this.init();
    }
    init() {
      this.form.addEventListener('submit', async e => {
        e.preventDefault();
        const name = document.getElementById('nombreAlta').value.trim();
        const email = document.getElementById('emailAlta').value.trim();
        const password = document.getElementById('passwordAlta').value;
        const startDate = document.getElementById('fechaAlta').value;

        if (!name || !email || !password || !startDate) {
          alert('All fields are required');
          return;
        }

        try {
          const res = await fetch('/api/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: name, email, password, fecha_alta: startDate })
          });
          const data = await res.json();
          if (res.ok) {
            alert(`User ${name} created successfully`);
            this.form.reset();
            loadUsers();
          } else {
            alert(`Error creating user: ${data.mensaje}`);
          }
        } catch (err) {
          console.error('Error creating user:', err);
        }
      });
    }
  }

  class ModifyUserForm {
    constructor(sel) {
      this.form = document.querySelector(sel);
      if (this.form) this.init();
    }
    init() {
      this.form.addEventListener('submit', async e => {
        e.preventDefault();
        const id = this.form.querySelector('#usuarioModificar').value;
        const newName = this.form.querySelector('#nuevoNombre').value.trim();
        if (!id) return alert('Please select a user');

        try {
          const res = await fetch(`/api/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: newName })
          });
          const data = await res.json();
          if (res.ok) {
            alert(data.mensaje);
            this.form.reset();
            loadUsers();
          } else alert(`Error: ${data.mensaje}`);
        } catch (err) {
          console.error('Error modifying user:', err);
        }
      });
    }
  }

  class DeleteUserForm {
    constructor(sel) {
      this.form = document.querySelector(sel);
      if (this.form) this.init();
    }
    init() {
      this.form.addEventListener('submit', async e => {
        e.preventDefault();
        const id = this.form.querySelector('#idUsuarioEliminar').value.trim();
        const name = this.form.querySelector('#nombreUsuarioEliminar').value.trim();
        const email = this.form.querySelector('#emailUsuarioEliminar').value.trim();

        if (!id || !name || !email) {
          alert('Please complete all three fields');
          return;
        }

        try {
          const res = await fetch('/api/usuarios/eliminar', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, nombre: name, email })
          });
          const data = await res.json();
          if (res.ok) {
            alert(data.mensaje);
            this.form.reset();
            loadUsers();
          } else alert(`Error deleting user: ${data.mensaje}`);
        } catch (err) {
          console.error('Error deleting user:', err);
        }
      });
    }
  }

  // ------ SCHEDULE -----
  const formCreate = document.getElementById('form-crear');

  function validateSchedule(schedule, maxHours) {
    const days = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];

    // Detect free days
    const freeDays = days.filter(day => {
      const val = schedule[day];
      return !val || val.trim().toLowerCase() === '' || val.trim().toLowerCase() === 'libre';
    });

    const validBlocks = [
      ['lunes', 'martes'],
      ['miercoles', 'jueves'],
      ['viernes', 'sabado', 'domingo']
    ];

    const isValidBlock = validBlocks.some(block =>
      block.length === freeDays.length &&
      block.every(day => freeDays.includes(day))
    );

    if (!isValidBlock) {
      alert('Free days must belong only to one of these groups:\n- Monday & Tuesday\n- Wednesday & Thursday\n- Friday, Saturday & Sunday');
      return false;
    }

    // Calculate weekly hours
    const weeklyHours = days.reduce((acc, day) => {
      const val = schedule[day];
      if (!val || val.trim().toLowerCase() === 'libre') return acc;

      const parts = val.split('-');
      if (parts.length !== 2) return acc;

      const [start, end] = parts.map(t => {
        const [h, m] = t.split(':').map(Number);
        return h + (m || 0) / 60;
      });

      return acc + Math.max(0, end - start);
    }, 0);

    const weeksPerYear = 52;
    const annualHours = weeklyHours * weeksPerYear;

    if (annualHours > maxHours) {
      alert(`This schedule generates ${annualHours.toFixed(1)} annual hours, exceeding the limit of ${maxHours}h.`);
      return false;
    }

    return true;
  }

  formCreate?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(formCreate);
    const body = {};
    formData.forEach((value, key) => {
      body[key] = value.trim();
    });

    // Mandatory validation
    const requiredFields = ['id_usuario', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo', 'fecha_inicio', 'fecha_fin'];
    for (const field of requiredFields) {
      if (!body[field]) {
        alert(`Missing field: ${field}`);
        return;
      }
    }

    try {
      const resUser = await fetch(`/api/usuarios/${body.id_usuario}`);
      const user = await resUser.json();
      const maxHours = user.horas_anuales_trabajadas || 1784;

      if (!validateSchedule(body, maxHours)) return;

      const res = await fetch('/api/horario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Schedule created successfully');
        formCreate.reset();
        loadSchedules();
        loadSchedulesAdmin();
      } else {
        alert(`Error: ${data.mensaje}`);
      }
    } catch (err) {
      console.error('Error creating schedule:', err);
      alert(`Error creating schedule: ${err.message || 'unknown'}`);
    }
  });

  class ModifyScheduleForm {
    constructor(sel) {
      this.form = document.querySelector(sel);
      if (this.form) this.init();
    }
    init() {
      this.form.addEventListener('submit', async e => {
        e.preventDefault();
        const scheduleId = this.form.querySelector('#idHorarioModificar').value;
        const day = this.form.querySelector('#diaModificar').value;
        const newSchedule = this.form.querySelector('#nuevoHorario').value;

        if (!scheduleId || !day || !newSchedule) {
          alert('Complete all fields');
          return;
        }

        try {
          const res = await fetch(`/api/horario/${scheduleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dia: day, horario: newSchedule })
          });
          const data = await res.json();
          if (res.ok) {
            alert(data.mensaje);
            this.form.reset();
            loadSchedules();
          } else alert(`Error: ${data.mensaje}`);
        } catch (err) {
          console.error('Error modifying schedule:', err);
        }
      });
    }
  }

  class DeleteScheduleForm {
    constructor(sel) {
      this.form = document.querySelector(sel);
      this.select = this.form?.querySelector('#select-eliminar');
      this.msg = this.form?.querySelector('#msgEliminar');
      if (this.form && this.select) this.init();
    }

    init() {
      this.form.addEventListener('submit', async e => {
        e.preventDefault();
        const scheduleId = this.select.value;

        if (!scheduleId) {
          this.msg.textContent = 'Please select a valid ID.';
          this.msg.className = 'text-danger mt-2';
          return;
        }

        const confirmed = confirm(`Are you sure you want to delete schedule ID ${scheduleId}?`);
        if (!confirmed) return;

        try {
          const res = await fetch(`/api/horario/${scheduleId}`, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok) {
            this.msg.textContent = data.mensaje || 'Schedule deleted successfully.';
            this.msg.className = 'text-success mt-2';
            this.form.reset();
            loadSchedules();
            this.loadSelect();
          } else {
            this.msg.textContent = data.mensaje || 'Could not delete.';
            this.msg.className = 'text-danger mt-2';
          }
        } catch (err) {
          console.error('Error deleting schedule:', err);
          this.msg.textContent = 'Error deleting schedule.';
          this.msg.className = 'text-danger mt-2';
        }
      });

      this.loadSelect();
    }

    async loadSelect() {
      try {
        const res = await fetch('/api/horarios'); // adjust if different
        const data = await res.json();

        if (Array.isArray(data)) {
          this.select.innerHTML = '<option value="">Select a schedule</option>';
          data.forEach(h => {
            const option = document.createElement('option');
            option.value = h.id; // or h._id depending on backend
            option.textContent = `ID: ${h.id} | Day: ${h.dia} | Time: ${h.horario}`;
            this.select.appendChild(option);
          });
        } else {
          this.select.innerHTML = '<option value="">No schedules available</option>';
        }
      } catch (err) {
        console.error('Error loading schedules:', err);
        this.select.innerHTML = '<option value="">Error loading</option>';
      }
    }
  }

  new UserForm('.user-form');
  new ModifyUserForm('.modify-user-form');
  new DeleteUserForm('.delete-user-form');
  new ModifyScheduleForm('.modificar-horario-form');
  new DeleteScheduleForm('#form-eliminar');

  // ----------- ABSENCES: TABS AND MANAGEMENT -----------
  const absenceTabs = document.querySelectorAll('#ausenciasC .nav-tabs .nav-link');

  function handleTabClick(e) {
    e.preventDefault();
    absenceTabs.forEach(tab => tab.classList.remove('active'));
    e.target.classList.add('active');
    currentStatus = e.target.dataset.estado;  // Update global variable
    loadAbsences(currentStatus);
  }

  absenceTabs.forEach(tab => tab.addEventListener('click', handleTabClick));
  loadAbsences(currentStatus);
});

// ----------- FUNCTIONS FOR ABSENCES MANAGEMENT -----------
async function loadAbsences(tabStatus) {
  const status = validStatuses[tabStatus] || 'pending';  // Map to backend format
  try {
    const res = await fetch(`/api/ausencias?estado=${status}`);
    const absences = await res.json();
    const tbody = document.getElementById('ausenciasBody');
    tbody.innerHTML = '';

    absences.forEach(abs => {
      const tr = document.createElement('tr');
      let actions = '';

      if (tabStatus === 'pending') {
        actions = `
          <button class="btn btn-success btn-sm me-2"
            onclick="updateAbsenceStatus(${abs.id_ausencia}, 'approved')">Approve</button>
          <button class="btn btn-danger btn-sm"
            onclick="updateAbsenceStatus(${abs.id_ausencia}, 'rejected')">Reject</button>
        `;
      } else {
        const badgeColor = tabStatus === 'approved' ? 'success' : 'danger';
        actions = `<span class="badge bg-${badgeColor}">${tabStatus}</span>`;
      }

      tr.innerHTML = `
        <td>${abs.id_usuario}</td>
        <td>${abs.tipo}</td>
        <td>${new Date(abs.fecha_inicio).toLocaleDateString()}</td>
        <td>${new Date(abs.fecha_fin).toLocaleDateString()}</td>
        <td>${abs.comentario || ''}</td>
        <td>${actions}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading absences:', err);
  }
}

window.updateAbsenceStatus = async function(id, newStatus) {
  try {
    const res = await fetch(`/api/ausencias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: newStatus })
    });

    let data = {};
    try {
      data = await res.json();
    } catch (e) {
      console.warn('Could not parse response as JSON');
    }

    if (res.ok) {
      alert(data.mensaje || 'Status updated successfully');
      loadAbsences(currentStatus); // currentStatus is global
    } else {
      alert(`Error: ${data.error || 'Unknown error'}`);
    }
  } catch (err) {
    console.error('Error updating absence:', err);
    alert('Unexpected error updating absence');
  }
};
