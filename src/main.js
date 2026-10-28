import './styles/global.scss';
// javascript:(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()

import { state, navItemsArray } from './state/state.js';

class HTMLContentGenerator {
  static generateMainContent() {
      const main = document.createElement('main');
      const header = document.createElement('header');
      const headerInner = document.createElement('header');
      headerInner.classList.add('header');

      const logo = document.createElement('a');
      logo.href = '#';
      logo.classList.add('logo');
      logo.innerHTML = 'Iago.carneiro <br class="home-mobile-break"/><small>| <br class="home-desktop-break"/> 3D Experiments</small>';

      const desktopMenu = document.createElement('nav');
      desktopMenu.classList.add('navbar', 'desktop-menu');

      const navItems = navItemsArray;
      const experimentItems = navItems.filter((item) => item.text.match(/^#\d/));
      const utilityItems = navItems.filter((item) => !item.text.match(/^#\d/));

      const experimentsGroup = document.createElement('div');
      experimentsGroup.classList.add('experiments-group');

      const experimentsToggle = document.createElement('button');
      experimentsToggle.type = 'button';
      experimentsToggle.classList.add('nav-item', 'experiments-toggle');
      experimentsToggle.setAttribute('aria-expanded', 'false');
      experimentsToggle.innerHTML = '<span class="experiments-chevron">›</span><span>Examples</span>';

      const experimentsList = document.createElement('div');
      experimentsList.classList.add('experiments-list');
      experimentsList.setAttribute('aria-hidden', 'true');

      experimentItems.forEach((item) => {
          const navItem = document.createElement('a');
          navItem.href = item.href;
          navItem.classList.add('nav-item');
          navItem.textContent = item.text;
          experimentsList.appendChild(navItem);
      });

      experimentsToggle.addEventListener('click', () => {
          const isOpen = experimentsGroup.classList.toggle('is-open');
          experimentsToggle.setAttribute('aria-expanded', String(isOpen));
          experimentsList.setAttribute('aria-hidden', String(!isOpen));
      });

      experimentsGroup.appendChild(experimentsToggle);
      experimentsGroup.appendChild(experimentsList);
      desktopMenu.appendChild(experimentsGroup);

      utilityItems.forEach((item) => {
          const navItem = document.createElement('a');
          navItem.href = item.href;
          navItem.classList.add('nav-item');
          navItem.textContent = item.text;
          if (item.external) {
              navItem.target = '_blank';
              navItem.rel = 'noreferrer';
          }
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
  document.body.classList.add('home-page');
  const mainContent = HTMLContentGenerator.generateMainContent();
  const loadingContent = HTMLContentGenerator.generateLoadingContent();

  document.body.appendChild(mainContent);
  document.body.appendChild(loadingContent);
  
  new Menu({
    dom: document.getElementById('webgl'),
  });

});
