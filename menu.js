    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.menu-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const page = btn.dataset.page;
            if (typeof window.showPage === 'function') {
              window.showPage(page);
            } else {
              document.getElementById('defaultPage')?.classList.add('d-none');
              document.querySelectorAll('#profilePage,#announcementPage,#servicePage').forEach(el => el.classList.add('d-none'));
              document.getElementById(page)?.classList.remove('d-none');
            }
          });
        });
      });