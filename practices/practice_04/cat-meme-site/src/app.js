import agentsText from '../AGENTS.md?raw';
import skillText from '../.opencode/skills/cat-card-tdd/SKILL.md?raw';
import mcpText from '../tools/cat-cards-mcp.mjs?raw';
import hookText from '../.opencode/plugins/check-after-edit.js?raw';
import connectionsText from '../docs/connections.md?raw';
import reflectionText from '../reflection.md?raw';

const files = {
  agents: {
    title: 'AGENTS.md',
    path: './AGENTS.md',
    content: agentsText,
  },
  skill: {
    title: 'Skill · cat-card-tdd',
    path: '.opencode/skills/cat-card-tdd/SKILL.md',
    content: skillText,
  },
  mcp: {
    title: 'MCP · cat-cards',
    path: 'tools/cat-cards-mcp.mjs',
    content: mcpText,
  },
  hook: {
    title: 'Hook · check-after-edit',
    path: '.opencode/plugins/check-after-edit.js',
    content: hookText,
  },
  connections: {
    title: 'Обоснование подключений',
    path: 'docs/connections.md',
    content: connectionsText,
  },
  reflection: {
    title: 'Рефлексия',
    path: 'reflection.md',
    content: reflectionText,
  },
};

const dialog = document.querySelector('#file-dialog');
const dialogTitle = document.querySelector('#file-dialog-title');
const dialogPath = document.querySelector('#file-dialog-path');
const dialogContent = document.querySelector('#file-dialog-content');
const closeButton = document.querySelector('#file-dialog-close');
let opener = null;

function openFile(key, trigger) {
  const file = files[key];
  if (!file) return;

  opener = trigger;
  dialogTitle.textContent = file.title;
  dialogPath.textContent = file.path;
  dialogContent.textContent = file.content;
  dialog.showModal();
  closeButton.focus();
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-file]');
  if (!link) return;
  event.preventDefault();
  openFile(link.dataset.file, link);
});

closeButton.addEventListener('click', () => dialog.close());

dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

dialog.addEventListener('close', () => {
  opener?.focus();
  opener = null;
});
