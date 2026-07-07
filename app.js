const pages = [...document.querySelectorAll('.page')];
const book = document.querySelector('#book');
const toc = document.querySelector('#toc');
const tocList = document.querySelector('#tocList');
const pageLabel = document.querySelector('#pageLabel');
const progressBar = document.querySelector('#progressBar');
const prevButton = document.querySelector('#prevButton');
const nextButton = document.querySelector('#nextButton');
const edgeLeft = document.querySelector('#pageEdgeLeft');
const edgeRight = document.querySelector('#pageEdgeRight');
const mobileQuery = window.matchMedia('(max-width: 760px)');
const requestedPage = Number(new URLSearchParams(window.location.search).get('page'));
let currentPage = Math.min(
  Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage - 1 : Number(localStorage.getItem('portfolioPage') || 0),
  pages.length - 1
);
let turning = false;

pages.forEach((page, index) => {
  const item = document.createElement('li');
  const button = document.createElement('button');
  button.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><span>${page.dataset.label}</span>`;
  button.addEventListener('click', () => { navigateTo(index, index >= currentPage ? 1 : -1); closeToc(); });
  item.append(button);
  tocList.append(item);
});

function spreadStart(index) {
  if (index === 0) return 0;
  return 1 + Math.floor((index - 1) / 2) * 2;
}

function visibleIndices(index = currentPage) {
  if (mobileQuery.matches || index === 0) return [index];
  const start = spreadStart(index);
  return [start, Math.min(start + 1, pages.length - 1)];
}

function render() {
  const visible = visibleIndices();
  pages.forEach((page, index) => {
    page.classList.remove('active', 'active-left', 'active-right', 'active-single', 'leaving-prev');
    if (!visible.includes(index)) return;
    page.classList.add('active');
    if (mobileQuery.matches || visible.length === 1) page.classList.add('active-single');
    else page.classList.add(index === visible[0] ? 'active-left' : 'active-right');
  });

  const first = visible[0] + 1;
  const last = visible[visible.length - 1] + 1;
  pageLabel.textContent = first === last
    ? `${String(first).padStart(2, '0')} / ${pages.length}`
    : `${String(first).padStart(2, '0')}–${String(last).padStart(2, '0')} / ${pages.length}`;
  progressBar.style.width = `${(last / pages.length) * 100}%`;
  prevButton.disabled = currentPage === 0;
  nextButton.disabled = last >= pages.length;
  edgeLeft.disabled = prevButton.disabled;
  edgeRight.disabled = nextButton.disabled;
  book.classList.toggle('cover-view', currentPage === 0 && !mobileQuery.matches);
  localStorage.setItem('portfolioPage', currentPage);
}

function turnClone(direction) {
  const source = direction > 0
    ? document.querySelector('.page.active-right') || document.querySelector('.page.active-single')
    : document.querySelector('.page.active-left') || document.querySelector('.page.active-single');
  if (!source || document.body.classList.contains('reduce-motion')) return null;
  const clone = source.cloneNode(true);
  clone.classList.remove('active', 'active-left', 'active-right', 'active-single');
  clone.classList.add('turn-sheet', direction > 0 ? 'turn-next' : 'turn-prev');
  clone.setAttribute('aria-hidden', 'true');
  book.append(clone);
  requestAnimationFrame(() => clone.classList.add('turning'));
  window.setTimeout(() => clone.remove(), 980);
  return clone;
}

function navigateTo(index, direction = 1) {
  if (turning) return;
  const target = Math.max(0, Math.min(index, pages.length - 1));
  if (target === currentPage) return;
  turning = true;
  turnClone(direction);
  currentPage = target;
  render();
  window.setTimeout(() => { turning = false; }, document.body.classList.contains('reduce-motion') ? 20 : 940);
}

function next() {
  if (mobileQuery.matches) navigateTo(currentPage + 1, 1);
  else navigateTo(currentPage === 0 ? 1 : spreadStart(currentPage) + 2, 1);
}
function previous() {
  if (mobileQuery.matches) navigateTo(currentPage - 1, -1);
  else navigateTo(currentPage <= 1 ? 0 : spreadStart(currentPage) - 2, -1);
}
function closeToc() {
  toc.classList.remove('open');
  document.querySelector('#tocButton').setAttribute('aria-expanded', 'false');
}

prevButton.addEventListener('click', previous);
nextButton.addEventListener('click', next);
edgeLeft.addEventListener('click', previous);
edgeRight.addEventListener('click', next);
document.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === ' ') { event.preventDefault(); next(); }
  if (event.key === 'ArrowLeft') previous();
  if (event.key === 'Escape') closeToc();
});
document.querySelector('#tocButton').addEventListener('click', () => {
  const open = toc.classList.toggle('open');
  document.querySelector('#tocButton').setAttribute('aria-expanded', String(open));
});
document.querySelector('#tocClose').addEventListener('click', closeToc);
document.querySelector('#motionButton').addEventListener('click', event => {
  const reduced = document.body.classList.toggle('reduce-motion');
  event.currentTarget.setAttribute('aria-pressed', String(reduced));
  event.currentTarget.textContent = reduced ? '恢复动效' : '减少动效';
});
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => navigateTo(Number(button.dataset.go), -1)));
mobileQuery.addEventListener('change', render);
render();
