import { render } from 'preact';
import { App } from './components/App';
import './styles/main.scss';

const ROOT_ID = 'ifa-root';

function mount() {
  const existing = document.getElementById(ROOT_ID);
  if (existing) {
    existing.style.display = existing.style.display === 'none' ? '' : 'none';
    return;
  }

  const container = document.createElement('div');
  container.id = ROOT_ID;
  document.body.appendChild(container);
  render(<App />, container);
}

mount();
