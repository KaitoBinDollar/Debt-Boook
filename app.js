(() => {
  "use strict";
  const STORAGE_KEY = "debtBook.records.v1";
  const $ = (id) => document.getElementById(id);
  const money = (n) => new Intl.NumberFormat("pt-MZ", { style: "currency", currency: "MZN", maximumFractionDigits: 2 }).format(Number(n) || 0);
  const today = () => new Date().toLocaleDateString("en-CA");
  let debts = loadDebts();
  let toastTimer;
  let installPrompt = null;

  function loadDebts() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter(d => d && d.id && typeof d.person === "string") : [];
    } catch { return []; }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(debts)); }
    catch { showToast("Não foi possível guardar. Exporta os dados e verifica o espaço disponível."); }
  }
  function uid() { return (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2); }
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  }
  function paidAmount(d) { return (d.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0); }
  function remaining(d) { return Math.max(0, Number(d.amount || 0) - paidAmount(d)); }
  function showToast(message) {
    const el = $("toast"); el.textContent = message; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }
  function render() {
    const total = debts.reduce((s,d) => s + Number(d.amount || 0), 0);
    const paid = debts.reduce((s,d) => s + paidAmount(d), 0);
    const openCount = debts.filter(d => remaining(d) > 0.009).length;
    $("totalOutstanding").textContent = money(Math.max(0, total - paid));
    $("totalPaid").textContent = money(paid);
    $("activeCount").textContent = String(openCount);

    const query = $("searchInput").value.trim().toLocaleLowerCase("pt");
    const filter = $("statusFilter").value;
    const visible = debts.filter(d => {
      const text = `${d.person} ${d.contact || ""} ${d.note || ""}`.toLocaleLowerCase("pt");
      const status = remaining(d) <= 0.009 ? "paid" : "open";
      return text.includes(query) && (filter === "all" || filter === status);
    }).sort((a,b) => String(b.createdAt || b.date).localeCompare(String(a.createdAt || a.date)));
    $("debtList").innerHTML = visible.map(cardHTML).join("");
    $("emptyState").classList.toggle("show", visible.length === 0);
    $("emptyState").querySelector("h3").textContent = debts.length && (query || filter !== "all") ? "Nenhum resultado" : "Ainda não há dívidas";
    $("emptyState").querySelector("p").textContent = debts.length && (query || filter !== "all") ? "Experimenta alterar a pesquisa ou o filtro." : "Adiciona o teu primeiro registo para começares a acompanhar os valores.";
    $("emptyAddBtn").classList.toggle("hidden", debts.length > 0 || query || filter !== "all");
  }
  function cardHTML(d) {
    const paid = paidAmount(d), due = remaining(d), amount = Number(d.amount || 0);
    const pct = amount > 0 ? Math.min(100, paid / amount * 100) : 0;
    const isPaid = due <= 0.009;
    const initial = (d.person.trim()[0] || "?").toLocaleUpperCase("pt");
    const date = d.date ? new Date(d.date + "T12:00:00").toLocaleDateString("pt-PT") : "—";
    return `<article class="debt-card">
      <div class="debt-top"><div class="person-line"><div class="avatar">${escapeHTML(initial)}</div><div><h4>${escapeHTML(d.person)}</h4><p>${escapeHTML(d.contact || "Sem contacto")} · Registado em ${date}</p></div></div>
      <span class="status ${isPaid ? "" : "open"}">${isPaid ? "Liquidada" : "Em aberto"}</span></div>
      <div class="money-row"><div><small>Valor em dívida</small><strong class="due">${money(due)}</strong></div><div style="text-align:right"><small>Valor inicial</small><strong>${money(amount)}</strong></div></div>
      <div class="progress"><span style="width:${pct}%"></span></div>
      <div class="card-meta"><span>Recebido: ${money(paid)}</span><span>${Math.round(pct)}% pago</span></div>
      ${d.note ? `<p class="card-note">${escapeHTML(d.note)}</p>` : ""}
      ${d.payments && d.payments.length ? `<p class="card-note">Último pagamento: ${escapeHTML(d.payments[d.payments.length-1].date || "—")} · ${money(d.payments[d.payments.length-1].amount)}</p>` : ""}
      <div class="card-actions">${!isPaid ? `<button class="btn btn-primary" data-action="pay" data-id="${escapeHTML(d.id)}">＋ Pagamento</button>` : ""}
      <button class="btn btn-secondary" data-action="edit" data-id="${escapeHTML(d.id)}">Editar</button>
      <button class="btn btn-secondary" data-action="history" data-id="${escapeHTML(d.id)}">Histórico</button>
      <button class="btn btn-secondary" data-action="delete" data-id="${escapeHTML(d.id)}">Eliminar</button></div>
    </article>`;
  }
  function openDebtDialog(d = null) {
    $("debtForm").reset(); $("debtId").value = d ? d.id : "";
    $("formTitle").textContent = d ? "Editar dívida" : "Adicionar dívida";
    $("personInput").value = d?.person || "";
    $("amountInput").value = d ? d.amount : "";
    $("dateInput").value = d?.date || today();
    $("contactInput").value = d?.contact || "";
    $("noteInput").value = d?.note || "";
    $("debtDialog").showModal();
  }
  function openPaymentDialog(d) {
    $("paymentForm").reset(); $("paymentDebtId").value = d.id;
    $("paymentDate").value = today(); $("paymentAmount").max = remaining(d).toFixed(2);
    $("paymentAmount").value = remaining(d).toFixed(2);
    $("paymentInfo").textContent = `${d.person} — falta receber ${money(remaining(d))}.`;
    $("paymentDialog").showModal();
  }
  function exportData() {
    const blob = new Blob([JSON.stringify({ app: "Debt Book", version: 1, exportedAt: new Date().toISOString(), debts }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `debt-book-backup-${today()}.json`; a.click(); URL.revokeObjectURL(url);
    showToast("Cópia de segurança exportada.");
  }

  $("addBtn").addEventListener("click", () => openDebtDialog());
  $("emptyAddBtn").addEventListener("click", () => openDebtDialog());
  $("closeDialog").addEventListener("click", () => $("debtDialog").close());
  $("cancelBtn").addEventListener("click", () => $("debtDialog").close());
  $("closePayment").addEventListener("click", () => $("paymentDialog").close());
  $("cancelPayment").addEventListener("click", () => $("paymentDialog").close());
  $("searchInput").addEventListener("input", render);
  $("statusFilter").addEventListener("change", render);
  $("exportBtn").addEventListener("click", exportData);

  $("debtForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = $("debtId").value;
    const person = $("personInput").value.trim();
    const amount = Number($("amountInput").value);
    if (!person || !Number.isFinite(amount) || amount <= 0) return showToast("Preenche o nome e um valor válido.");
    if (id) {
      const d = debts.find(x => x.id === id); if (!d) return;
      const alreadyPaid = paidAmount(d);
      if (amount < alreadyPaid) return showToast("O valor total não pode ser inferior ao que já foi pago.");
      Object.assign(d, { person, amount, date: $("dateInput").value || today(), contact: $("contactInput").value.trim(), note: $("noteInput").value.trim(), updatedAt: new Date().toISOString() });
      showToast("Dívida atualizada.");
    } else {
      debts.push({ id: uid(), person, amount, date: $("dateInput").value || today(), contact: $("contactInput").value.trim(), note: $("noteInput").value.trim(), payments: [], createdAt: new Date().toISOString() });
      showToast("Dívida guardada.");
    }
    save(); render(); $("debtDialog").close();
  });

  $("paymentForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = debts.find(x => x.id === $("paymentDebtId").value); if (!d) return;
    const amount = Number($("paymentAmount").value);
    if (!Number.isFinite(amount) || amount <= 0) return showToast("Introduz um valor válido.");
    if (amount > remaining(d) + 0.009) return showToast("O pagamento não pode ultrapassar o saldo em dívida.");
    d.payments = d.payments || [];
    d.payments.push({ id: uid(), amount, date: $("paymentDate").value || today(), createdAt: new Date().toISOString() });
    save(); render(); $("paymentDialog").close(); showToast("Pagamento registado.");
  });

  $("debtList").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]"); if (!btn) return;
    const d = debts.find(x => x.id === btn.dataset.id); if (!d) return;
    switch (btn.dataset.action) {
      case "pay": openPaymentDialog(d); break;
      case "edit": openDebtDialog(d); break;
      case "history": {
        const lines = (d.payments || []).map(p => `${p.date}: ${money(p.amount)}`).join("\n");
        alert(`${d.person}\nValor inicial: ${money(d.amount)}\nTotal recebido: ${money(paidAmount(d))}\nSaldo: ${money(remaining(d))}\n\nPagamentos:\n${lines || "Ainda sem pagamentos."}`);
        break;
      }
      case "delete":
        if (confirm(`Eliminar o registo de ${d.person}? Esta ação não pode ser desfeita. Exporta os dados antes, se precisares de uma cópia.`)) {
          debts = debts.filter(x => x.id !== d.id); save(); render(); showToast("Registo eliminado.");
        }
        break;
    }
  });

  $("importInput").addEventListener("change", async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const imported = Array.isArray(parsed) ? parsed : parsed.debts;
      if (!Array.isArray(imported) || !imported.every(d => d && typeof d.person === "string" && Number.isFinite(Number(d.amount)))) throw new Error("Formato inválido");
      if (!confirm(`Importar ${imported.length} registo(s)? Os registos atuais serão substituídos.`)) return;
      debts = imported.map(d => ({ ...d, id: d.id || uid(), payments: Array.isArray(d.payments) ? d.payments : [] }));
      save(); render(); showToast("Dados importados com sucesso.");
    } catch { showToast("Não foi possível importar. Escolhe um backup JSON do Debt Book."); }
    finally { e.target.value = ""; }
  });

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); installPrompt = e; $("installBtn").classList.remove("hidden");
  });
  $("installBtn").addEventListener("click", async () => {
    if (!installPrompt) return;
    installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; $("installBtn").classList.add("hidden");
  });
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
  render();
})();