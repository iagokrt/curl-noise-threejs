import './styles/global.scss';
// javascript:(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()

class HTMLContentGenerator {
  static generateMainContent() {
      const main = document.createElement('main');
      const header = document.createElement('header');
      const headerInner = document.createElement('header');
      headerInner.classList.add('header');

      const logo = document.createElement('a');
      logo.href = '#';
      logo.classList.add('logo');
      logo.innerHTML = 'Iago.carneiro <small>| Visual Experiments</small>';

      const desktopMenu = document.createElement('nav');
      desktopMenu.classList.add('navbar', 'desktop-menu');

      const navItems = [
          { text: 'WebGL', href: 'index.html' },
          { text: '#1 Basic distortions', href: 'basicdistortions.html' },
          { text: '#2 Curl noise + gsap', href: 'curlnoise.html' },
          { text: '#3 Nefertiti Sculpture', href: 'sculpture.html' },

          { text: 'Contact', href: '#' }
      ];

      navItems.forEach((item, index) => {
          const navItem = document.createElement('a');
          navItem.href = item.href;
          navItem.classList.add('nav-item');
          navItem.textContent = item.text;
          desktopMenu.appendChild(navItem);
      });

      const navIcon = document.createElement('span');
      navIcon.classList.add('nav-icon');

      const navIconLink = document.createElement('a');
      navIconLink.href = '#';
      navIconLink.id = 'nav-icon';
      navIconLink.classList.add('nav-item');
      navIconLink.textContent = '☰';

      navIcon.appendChild(navIconLink);

      const wrapper = document.createElement('div');
      wrapper.classList.add('wrapper');

      navItems.forEach((item, index) => {
          const navItem = document.createElement('a');
          navItem.href = item.href;
          navItem.classList.add('nav-item');
          navItem.textContent = item.text;
          wrapper.appendChild(navItem);
      });

      headerInner.appendChild(logo);
      headerInner.appendChild(desktopMenu);

      header.appendChild(headerInner);

      const webglDiv = document.createElement('div');
      webglDiv.id = 'webgl';

      main.appendChild(header);
      main.appendChild(webglDiv);

      return main;
  }

  static generateLoadingContent() {
      const aside = document.createElement('aside');
      aside.id = 'loading';

      const h1 = document.createElement('h1');
      h1.textContent = 'Loading...';

      aside.appendChild(h1);

      return aside;
  }
}
class Menu {
  constructor(options) {
    this.container = options.dom; // document.getElementById('webgl')
    this.menu = options.menu; // document.getelementbyid('menu')
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.loading = true;

    window.onload = () => {
      document.getElementById("loading").style.display = "none"
      document.querySelector("header").style.display = "block"
      this.loading = false;
    }

  }
}

document.addEventListener('DOMContentLoaded', () => {
  const mainContent = HTMLContentGenerator.generateMainContent();
  const loadingContent = HTMLContentGenerator.generateLoadingContent();

  document.body.appendChild(mainContent);
  document.body.appendChild(loadingContent);
  
  new Menu({
    dom: document.getElementById('webgl'),
  });

});
