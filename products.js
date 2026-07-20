/* ─────────────────────────────────────────────
   형제상사 제품 데이터 렌더러
   products.json 을 읽어 화면의 제품 블록을 채운다.

   HTML 사용법:
     <div data-product="제품ID" data-render="spec"></div>
     <div data-product="제품ID" data-render="docs"></div>
     <div data-product="제품ID" data-render="cautions"></div>
     <div data-product="제품ID" data-render="estimate"></div>

   ※ file:// 로 직접 열면 브라우저 보안정책(CORS) 때문에
     fetch 가 막힌다. GitHub Pages 나 로컬 서버에서 열 것.
     (로컬 확인:  python3 -m http.server 8000)
   ───────────────────────────────────────────── */

window.PRODUCT_DB = null;

const _esc = (v) =>
  String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const _row = (label, value, full) =>
  `<div class="spec-item${full ? ' full' : ''}"><strong>${_esc(label)}</strong><span class="val">${_esc(value)}</span></div>`;

const _range = (a, unit) => (Array.isArray(a) ? `${a[0]} ~ ${a[1]}${unit || ''}` : a);

/* ── 물성표 ── */
function renderSpec(p) {
  const s = p.spec || {}, c = p.conditions || {};
  const r = [];
  if (s.composition || s.finish) r.push(_row('조성 · 마감', [s.composition, s.finish].filter(Boolean).join(' · ')));
  if (s.colors) r.push(_row('색상', s.colors.join(', ')));
  if (p.substrates) r.push(_row('피도면', p.substrates.join(', '), true));
  if (s.volume_solids_pct != null) r.push(_row('부피고형분', s.volume_solids_pct + '%'));
  if (s.dft_um != null) r.push(_row('추천 건조도막두께', s.dft_um >= 1000 ? s.dft_um / 1000 + 'mm' : s.dft_um + '㎛'));
  if (s.coats) r.push(_row('도장 횟수', s.coats + '회'));
  if (s.mixing_ratio_weight) r.push(_row('배합비 (무게비)', s.mixing_ratio_weight));
  if (s.coverage_m2_per_l != null)
    r.push(_row('이론도포면적', `${s.coverage_m2_per_l}㎡/L (${s.dft_um}㎛ 기준)`, true));
  if (s.coverage_kg_per_m2 != null)
    r.push(_row('추천 소요량', `${s.coverage_kg_per_m2}kg/㎡ (건조도막두께 ${s.dft_um / 1000}mm 기준)`, true));
  if (s.dry_touch_min != null) r.push(_row('불점착시간 (25℃)', s.dry_touch_min + '분'));
  if (s.dry_hard_min != null)
    r.push(_row('고화건조 (25℃)', s.dry_hard_min >= 60 ? s.dry_hard_min / 60 + '시간 이내' : s.dry_hard_min + '분'));
  if (s.recoat_hours != null) r.push(_row('재도장 간격 (25℃)', s.recoat_hours + '시간 이후'));
  if (s.shore_hardness) r.push(_row('경도', s.shore_hardness));
  if (s.elongation_pct_min != null) r.push(_row('신장율', s.elongation_pct_min + '% 이상'));
  if (s.tensile_strength_mpa_min != null) r.push(_row('인장강도', s.tensile_strength_mpa_min + 'N/㎟ 이상'));
  if (s.tear_strength_n_mm_min != null) r.push(_row('인열강도', s.tear_strength_n_mm_min + 'N/㎜ 이상'));
  if (s.thinning_pct_max != null) r.push(_row('희석률', s.thinning_pct_max + '% 이내 (도료 부피비)'));
  if (s.thinner) r.push(_row('희석제', s.thinner));
  if (s.cleaner) r.push(_row('세척제', s.cleaner));
  if (s.pack_sizes) r.push(_row('포장단위', s.pack_sizes.join(', '), s.pack_sizes.length > 2));
  if (s.shelf_life_months != null)
    r.push(_row('저장기간', `${s.shelf_life_months}개월 (${_range(s.storage_temp_c, '℃')} 실내)`));
  if (c.air_temp_c) r.push(_row('작업 대기온도', _range(c.air_temp_c, '℃')));
  if (c.air_temp_c_min != null) r.push(_row('작업 대기온도', c.air_temp_c_min + '℃ 이상'));
  if (c.humidity_pct_max != null) r.push(_row('상대습도', c.humidity_pct_max + '% 이하'));
  if (c.surface_temp_c_max != null) r.push(_row('표면온도', c.surface_temp_c_max + '℃ 이하'));
  if (c.tools) r.push(_row('도장기구', c.tools.join(', '), true));

  let html = `<div class="spec-grid">${r.join('')}</div>`;
  if (s.recoat_hours_source)
    html += `<div class="info-box">💡 ${_esc(s.recoat_hours_source)}</div>`;
  if (c.high_strength_concrete_note)
    html += `<div class="warn-box">⚠ ${_esc(c.high_strength_concrete_note)}</div>`;
  return html;
}

/* ── 온도별 경화건조표 (2액형 제품용) ── */
function renderCureTable(p) {
  const t = p.cure_table;
  if (!t) return '';
  const head = `<th style="text-align:left;">구분</th>` + t.columns.map((c) => `<th>${_esc(c)}</th>`).join('');
  const body = t.rows
    .map(
      (row) =>
        `<tr><td style="text-align:left;"><strong>${_esc(row.label)}</strong>${row.unit ? ` (${_esc(row.unit)})` : ''}</td>` +
        row.values.map((v) => `<td>${_esc(v)}</td>`).join('') +
        `</tr>`
    )
    .join('');
  return (
    `<table class="cure-table" style="width:100%; border-collapse:collapse; font-size:13px; margin-top:4px;">` +
    `<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>` +
    (t.unit_note ? `<div class="info-box" style="margin-top:8px;">💡 ${_esc(t.unit_note)}</div>` : '')
  );
}

/* ── 일위대가 ── */
function renderEstimate(p) {
  const e = p.estimate;
  if (!e) return '';
  const r = [];
  if (e.primer_l_per_m2 != null)
    r.push(_row('하도 · ' + (p.system?.primer || '하도'), e.primer_l_per_m2 + ' L/㎡'));
  if (e.topcoat_l_per_m2 != null) r.push(_row('상도 이론 소요량', e.topcoat_l_per_m2 + ' L/㎡'));
  if (e.topcoat_kg_per_m2 != null) r.push(_row('상도 이론 소요량', e.topcoat_kg_per_m2 + ' kg/㎡'));
  if (e.thinner_l_per_m2 != null) r.push(_row('희석제 소요량', e.thinner_l_per_m2 + ' L/㎡'));
  if (e.basis) r.push(_row('산출 기준', e.basis, true));
  return `<div class="spec-grid">${r.join('')}</div>` +
    (e.note ? `<div class="info-box">💡 ${_esc(e.note)}</div>` : '');
}

/* ── 주의사항 ── */
function renderCautions(p) {
  const c = p.cautions;
  if (!c) return '';
  const block = (cls, icon, arr) =>
    arr && arr.length
      ? `<div class="${cls}">${arr.map((t) => `${icon} ${_esc(t)}`).join('<br>')}</div>`
      : '';
  return block('danger-box', '⚠️', c.danger) + block('warn-box', '⚠', c.warn) + block('info-box', '💡', c.info);
}

/* ── 자료 링크 ── */
function renderDocs(p) {
  const d = p.docs;
  if (!d) return '';
  const link = (href, ico, label) =>
    href
      ? `<a class="doc-link" href="${_esc(href)}" target="_blank"><span class="doc-ico">${ico}</span><span>${_esc(p.name)} · ${label}</span><span class="doc-tag">PDF</span></a>`
      : '';
  let html = `<div class="doc-list">${link(d.tech, '📄', '기술자료')}${link(d.spec_sheet, '📋', '도장사양서')}</div>`;

  const notes = [];
  if (p.compliance?.indoor_air_quality_act)
    notes.push('실내공기질관리법에 따른 다중이용시설 및 100~500세대 미만 공동주택 실내 사용 가능');
  if (p.compliance?.voc_regulation) notes.push(p.compliance.voc_regulation);
  if (p.compliance?.eco_label_reason) notes.push('환경마크 인증사유 — ' + p.compliance.eco_label_reason);
  if (notes.length) html += `<div class="info-box" style="margin-top:10px;">💡 ${notes.map(_esc).join('<br>')}</div>`;

  const foot = [];
  if (p.compliance?.public_works_note) foot.push('<b>관급 공사</b> — ' + _esc(p.compliance.public_works_note));
  if (d.tech_dated) foot.push('기술자료 기준일 ' + _esc(d.tech_dated));
  if (foot.length) html += `<div class="info-box">💡 ${foot.join('<br>')}</div>`;
  return html;
}

const RENDERERS = {
  spec: renderSpec,
  estimate: renderEstimate,
  cautions: renderCautions,
  docs: renderDocs,
  curetable: renderCureTable,
};

/* ── 부팅 ── */
async function initProducts() {
  const slots = document.querySelectorAll('[data-product][data-render]');
  if (!slots.length) return;
  try {
    const res = await fetch('products.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const db = await res.json();
    window.PRODUCT_DB = db;

    const byId = {};
    db.products.forEach((p) => (byId[p.id] = p));

    slots.forEach((el) => {
      const p = byId[el.dataset.product];
      if (!p) {
        el.innerHTML = `<div class="warn-box">⚠ products.json 에 '${_esc(el.dataset.product)}' 항목이 없습니다.</div>`;
        return;
      }
      const fn = RENDERERS[el.dataset.render];
      el.innerHTML = fn ? fn(p) : '';
    });
  } catch (err) {
    console.error('products.json 로드 실패:', err);
    slots.forEach((el) => {
      el.innerHTML =
        `<div class="warn-box">⚠ 제품 데이터를 불러오지 못했습니다.<br>` +
        `파일을 더블클릭해 연 경우 브라우저 보안정책으로 차단됩니다. ` +
        `GitHub Pages 주소로 접속하거나 로컬 서버(<code>python3 -m http.server</code>)로 여세요.</div>`;
    });
  }
}

/* 검색·조회용 헬퍼 (앱·API 전환 시 그대로 재사용) */
window.findProduct = (id) => window.PRODUCT_DB?.products.find((p) => p.id === id) || null;
window.productsByCategory = (cat) =>
  window.PRODUCT_DB?.products.filter((p) => (p.categories || []).includes(cat)) || [];

document.addEventListener('DOMContentLoaded', initProducts);
