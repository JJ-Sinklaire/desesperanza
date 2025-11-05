document.addEventListener('DOMContentLoaded', () => {
    
    const themeSwitcherButton = document.getElementById('client-theme-switcher');
    const body = document.body;
    
    if (!themeSwitcherButton) return;

    const applyTheme = (theme) => {
        if (theme === 'light') {
            body.classList.add('client-light-theme');
        } else {
            body.classList.remove('client-light-theme');
        }
    };

    let currentTheme = localStorage.getItem('client_theme');

    if (!currentTheme) {
        const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
        currentTheme = prefersLight ? 'light' : 'dark';
        localStorage.setItem('client_theme', currentTheme);
    }
    
    applyTheme(currentTheme);

    themeSwitcherButton.addEventListener('click', () => {
        const isLight = body.classList.contains('client-light-theme');
        const newTheme = isLight ? 'dark' : 'light';
        localStorage.setItem('client_theme', newTheme);
        applyTheme(newTheme);
    });
});