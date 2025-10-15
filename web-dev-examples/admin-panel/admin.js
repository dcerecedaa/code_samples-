// ----------- GLOBAL VARIABLE AND STATUS MAPPING -----------
// Global variable to track the current tab/status in the absences section
let currentStatus = 'pending';

// Mapping valid statuses for absences
const validStatuses = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected'
};

// ----------- GENERAL FUNCTIONS AND FORMS -----------
// Wait for the DOM to fully load using jQuery
$(document).ready(function() {

  // --- Sidebar navigation using jQuery ---
  const $menuLinks = $('.sidebar a');        // Select all sidebar links
  const $contentSections = $('.section-content'); // All content sections

  // Function to display the active section
  function showSection(id) {
    $contentSections.removeClass('active');  // Remove 'active' from all sections
    $(`#${id}`).addClass('active');          // Add 'active' only to the selected section
  }

  // Mark the active link in the sidebar
  function setActiveLink($link) {
    $menuLinks.removeClass('active'); // Remove active class from all links
    $link.addClass('active');         // Mark the clicked link as active
  }

  // Click event on sidebar links
  $menuLinks.click(function(e) {
    e.preventDefault();               // Prevent default link behavior (page reload)
    const $link = $(this);            // $(this) refers to the clicked link (jQuery object)
    showSection($link.data('section'));
    setActiveLink($link);
  });

  // Show default section on page load
  showSection('schedule-view');

  // --- Dynamic loading of users and schedules ---
  async function loadUsers() {
    try {
      const res = await fetch('/api/usuarios'); // Fetch users from API
      const users = await res.json();

      // Populate select elements using jQuery
      const selects = $('#usuarioModificar, #select-usuario');
      selects.each(function() {          // Iterate over each select
        $(this).empty().append('<option value="">Select...</option>'); // Clear options
        users.forEach(u => {
          $(this).append(`<option value="${u.id_usuario}">${u.id_usuario} – ${u.nombre}</option>`);
        });
      });
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }

  async function loadSchedules() {
    try {
      const res = await fetch('/api/horario');
      const schedules = await res.json();

      const selectIds = ['#idHorarioModificar', '#select-eliminar'];
      selectIds.forEach(id => {
        const $select = $(id);          // jQuery selection of the element
        if ($select.length) {
          $select.empty().append('<option value="">Select...</option>'); // Reset options
          schedules.forEach(h => {
            $select.append(`<option value="${h.id_horario}">${h.id_horario} – User: ${h.nombre}</option>`);
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
      const $tbody = $('#adminScheduleTable tbody'); // Select tbody with jQuery
      $tbody.empty();                                // Clear existing rows

      // Create table rows dynamically using jQuery
      data.forEach(h => {
        const $row = $(`
          <tr>
            <td>${h.id_horario}</td>
            <td>${h.nombre}</td>
            <td>${h.lunes || '-'}</td><td>${h.martes || '-'}</td><td>${h.miercoles || '-'}</td>
            <td>${h.jueves || '-'}</td><td>${h.viernes || '-'}</td><td>${h.sabado || '-'}</td>
            <td>${h.domingo || '-'}</td>
          </tr>
        `);
        $tbody.append($row.hide().fadeIn(300)); // jQuery fade-in animation for better UX
      });
    } catch (err) {
      console.error('Error loading admin schedules:', err);
    }
  }

  // Load initial data
  loadUsers();
  loadSchedules();
  loadSchedulesAdmin();

  // ----------- FORMS MANAGEMENT -----------

  // User creation form using jQuery
  class UserForm {
    constructor(sel) {
      this.$form = $(sel);            // jQuery form reference
      if (this.$form.length) this.init();
    }

    init() {
      this.$form.submit(async e => {
        e.preventDefault();           // Prevent default form submission
        const name = $('#nombreAlta').val().trim();
        const email = $('#emailAlta').val().trim();
        const password = $('#passwordAlta').val();
        const startDate = $('#fechaAlta').val();

        if (!name || !email || !password || !startDate) {
          alert('All fields are required'); // Basic frontend validation
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
            this.$form.trigger('reset'); // Reset form using jQuery
            loadUsers();                 // Reload users select
          } else alert(`Error creating user: ${data.mensaje}`);
        } catch (err) {
          console.error('Error creating user:', err);
        }
      });
    }
  }

  // User modification form
  class ModifyUserForm {
    constructor(sel) {
      this.$form = $(sel);
      if (this.$form.length) this.init();
    }

    init() {
      this.$form.submit(async e => {
        e.preventDefault();
        const id = this.$form.find('#usuarioModificar').val();
        const newName = this.$form.find('#nuevoNombre').val().trim();
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
            this.$form.trigger('reset');
            loadUsers();
          } else alert(`Error: ${data.mensaje}`);
        } catch (err) {
          console.error('Error modifying user:', err);
        }
      });
    }
  }

  // User deletion form
  class DeleteUserForm {
    constructor(sel) {
      this.$form = $(sel);
      if (this.$form.length) this.init();
    }

    init() {
      this.$form.submit(async e => {
        e.preventDefault();
        const id = this.$form.find('#idUsuarioEliminar').val().trim();
        const name = this.$form.find('#nombreUsuarioEliminar').val().trim();
        const email = this.$form.find('#emailUsuarioEliminar').val().trim();

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
            this.$form.trigger('reset');
            loadUsers();
          } else alert(`Error: ${data.mensaje}`);
        } catch (err) {
          console.error('Error deleting user:', err);
        }
      });
    }
  }

  // ----------- SCHEDULE FORMS MANAGEMENT -----------

  const $formCreate = $('#form-crear'); // Schedule creation form

  // Validate schedule for allowed free days and annual hours
  function validateSchedule(schedule, maxHours) {
    const days = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];
    const freeDays = days.filter(day => {
      const val = schedule[day];
      return !val || val.trim().toLowerCase() === '' || val.trim().toLowerCase() === 'libre';
    });

    // Define valid blocks of free days
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

    // Calculate weekly and annual hours
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

    const annualHours = weeklyHours * 52;
    if (annualHours > maxHours) {
      alert(`This schedule generates ${annualHours.toFixed(1)} annual hours, exceeding the limit of ${maxHours}h.`);
      return false;
    }

    return true;
  }

  // Schedule creation form submission
  $formCreate?.submit(async e => {
    e.preventDefault();
    const body = {};
    new FormData($formCreate[0]).forEach((v, k) => body[k] = v.trim()); // Convert form to object

    // Check required fields
    const requiredFields = ['id_usuario','lunes','martes','miercoles','jueves','viernes','sabado','domingo','fecha_inicio','fecha_fin'];
    for (const f of requiredFields) if (!body[f]) return alert(`Missing field: ${f}`);

    try {
      const resUser = await fetch(`/api/usuarios/${body.id_usuario}`);
      const user = await resUser.json();
      const maxHours = user.horas_anuales_trabajadas || 1784;

      if (!validateSchedule(body, maxHours)) return;

      const res = await fetch('/api/horario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        alert('Schedule created successfully');
        $formCreate.trigger('reset');
        loadSchedules();
        loadSchedulesAdmin();
      } else alert(`Error: ${data.mensaje}`);
    } catch (err) {
      console.error('Error creating schedule:', err);
      alert(`Error creating schedule: ${err.message || 'unknown'}`);
    }
  });

  // ----------- MODIFY AND DELETE SCHEDULE FORMS USING JQUERY -----------

  class ModifyScheduleForm {
    constructor(sel) {
      this.$form = $(sel);
      if (this.$form.length) this.init();
    }

    init() {
      this.$form.submit(async e => {
        e.preventDefault();
        const scheduleId = this.$form.find('#idHorarioModificar').val();
        const day = this.$form.find('#diaModificar').val();
        const newSchedule = this.$form.find('#nuevoHorario').val();

        if (!scheduleId || !day || !newSchedule) return alert('Complete all fields');

        try {
          const res = await fetch(`/api/horario/${scheduleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dia: day, horario: newSchedule })
          });
          const data = await res.json();
          if (res.ok) {
            alert(data.mensaje);
            this.$form.trigger('reset');
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
      this.$form = $(sel);
      this.$select = this.$form?.find('#select-eliminar'); // Select element for choosing schedule
      this.$msg = this.$form?.find('#msgEliminar');       // Message element for feedback
      if (this.$form.length && this.$select.length) this.init();
    }

    init() {
      this.$form.submit(async e => {
        e.preventDefault();
        const scheduleId = this.$select.val();
        if (!scheduleId) {
          this.$msg.text('Please select a valid ID').removeClass().addClass('text-danger mt-2');
          return;
        }

        if (!confirm(`Are you sure you want to delete schedule ID ${scheduleId}?`)) return;

        try {
          const res = await fetch(`/api/horario/${scheduleId}`, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok) {
            this.$msg.text(data.mensaje || 'Schedule deleted successfully').removeClass().addClass('text-success mt-2');
            this.$form.trigger('reset');
            loadSchedules();
            this.loadSelect();
          } else {
            this.$msg.text(data.mensaje || 'Could not delete').removeClass().addClass('text-danger mt-2');
          }
        } catch (err) {
          console.error('Error deleting schedule:', err);
          this.$msg.text('Error deleting schedule').removeClass().addClass('text-danger mt-2');
        }
      });

      this.loadSelect();
    }

    async loadSelect() {
      try {
        const res = await fetch('/api/horarios');
        const data = await res.json();
        this.$select.empty();
        if (Array.isArray(data) && data.length) {
          this.$select.append('<option value="">Select a schedule</option>');
          data.forEach(h => {
            this.$select.append(`<option value="${h.id}">ID: ${h.id} | Day: ${h.dia} | Time: ${h.horario}</option>`);
          });
        } else this.$select.append('<option value="">No schedules available</option>');
      } catch (err) {
        console.error('Error loading schedules:', err);
        this.$select.append('<option value="">Error loading</option>');
      }
    }
  }

  // Initialize all forms
  new UserForm('.user-form');
  new ModifyUserForm('.modify-user-form');
  new DeleteUserForm('.delete-user-form');
  new ModifyScheduleForm('.modificar-horario-form');
  new DeleteScheduleForm('#form-eliminar');

  // ----------- ABSENCES TABS AND MANAGEMENT -----------

  const $absenceTabs = $('#ausenciasC .nav-tabs .nav-link');

  // Tab click handler using jQuery
  $absenceTabs.click(function(e) {
    e.preventDefault();
    $absenceTabs.removeClass('active'); // Remove active from all tabs
    $(this).addClass('active');         // Set clicked tab as active
    currentStatus = $(this).data('estado'); // Update current logical status
    loadAbsences(currentStatus);        // Reload absences for this status
  });

  // Load initial absences
  loadAbsences(currentStatus);
});

// ----------- ABSENCES MANAGEMENT FUNCTION -----------

// Fetch and display absences according to the tab status
async function loadAbsences(tabStatus) {
  const status = validStatuses[tabStatus] || 'pending';
  try {
    const res = await fetch(`/api/ausencias?estado=${status}`);
    const absences = await res.json();
    const $tbody = $('#ausenciasBody');
    $tbody.empty();

    absences.forEach(abs => {
      let actions = '';
      if (tabStatus === 'pending') {
        // Buttons to approve/reject pending absences
        actions = `
          <button class="btn btn-success btn-sm me-2"
            onclick="updateAbsenceStatus(${abs.id_ausencia}, 'approved')">Approve</button>
          <button class="btn btn-danger btn-sm"
            onclick="updateAbsenceStatus(${abs.id_ausencia}, 'rejected')">Reject</button>
        `;
      } else {
        // Display badge for approved/rejected absences
        const badgeColor = tabStatus === 'approved' ? 'success' : 'danger';
        actions = `<span class="badge bg-${badgeColor}">${tabStatus}</span>`;
      }

      const $row = $(`
        <tr>
          <td>${abs.id_usuario}</td>
          <td>${abs.tipo}</td>
          <td>${new Date(abs.fecha_inicio).toLocaleDateString()}</td>
          <td>${new Date(abs.fecha_fin).toLocaleDateString()}</td>
          <td>${abs.comentario || ''}</td>
          <td>${actions}</td>
        </tr>
      `);

      $tbody.append($row.hide().fadeIn(300)); // Fade-in animation for UX
    });
  } catch (err) {
    console.error('Error loading absences:', err);
  }
}

// Update absence status (approve/reject) via API
window.updateAbsenceStatus = async function(id, newStatus) {
  try {
    const res = await fetch(`/api/ausencias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: newStatus })
    });

    let data = {};
    try { data = await res.json(); } catch (e) { console.warn('Could not parse response as JSON'); }

    if (res.ok) {
      alert(data.mensaje || 'Status updated successfully');
      loadAbsences(currentStatus); // Reload table after update
    } else {
      alert(`Error: ${data.error || 'Unknown error'}`);
    }
  } catch (err) {
    console.error('Error updating absence:', err);
    alert('Unexpected error updating absence');
  }
};
