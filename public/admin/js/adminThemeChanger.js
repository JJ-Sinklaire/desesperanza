document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcherButton = document.getElementById('admin-theme-switcher');
    const body = document.body;
    
    if (!themeSwitcherButton) return;

    const themeIcon = themeSwitcherButton.querySelector('.theme-icon');

    const applyTheme = (theme) => {
        if (theme === 'light') {
            body.classList.add('admin-light-theme');
        } else {
            body.classList.remove('admin-light-theme');
        }
    };

    let currentTheme = localStorage.getItem('admin_theme');

    if (!currentTheme) {
        currentTheme = 'dark'; 
        localStorage.setItem('admin_theme', currentTheme);
    }
    
    applyTheme(currentTheme);

    themeSwitcherButton.addEventListener('click', () => {
        const isLight = body.classList.contains('admin-light-theme');
        const newTheme = isLight ? 'dark' : 'light';
        localStorage.setItem('admin_theme', newTheme);
        applyTheme(newTheme);
    });
});