import '@vaadin/vaadin-button/vaadin-button.js';

export default (document => {
  const checkbox = document.querySelector('input');
  const button = document.querySelector('vaadin-button');

  checkbox.addEventListener('change', () => {
    button.disabled = checkbox.checked;
  });
});
