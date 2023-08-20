class MobileMenu {
    constructor() {
        // Select the mobile menu icon
        const navicon = document.querySelector('#nav-icon');

        if (navicon) {
            navicon.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }
    }

    toggleMobileMenu() {
        var mobileMenu = document.querySelector('.mobile-menu');

        if (mobileMenu) {
            // Toggle the menu display
            if (mobileMenu.style.display === 'block') {
                mobileMenu.style.display = 'none';
            } else {
                mobileMenu.style.display = 'block';
            }
        }
    }
}

export default MobileMenu;