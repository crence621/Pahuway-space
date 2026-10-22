(() => {
  const API = "api/data.php";
  const $ = (id) => document.getElementById(id);

  const state = { table: null, page: 1, q: "", columns: [], rows: [], total: 0, pageSize: 25, canEditPassword: false, adminId: null, editing: null, deleting: null };
  let searchTimer = null;

  function cell(value) {
    const td = document.createElement("td");
    if (value === null || value === undefined) {
      const s = document.createElement("span");
      s.className = "adm-null";
      s.textContent = "NULL";
      td.append(s);
    } else {
      td.textContent = String(value);
      td.title = String(value);
    }
    return td;
  }

  async function api(params, post) {
    const opts = post ? { method: "POST", body: post } : {};
    const url = post ? API : API + "?" + new URLSearchParams(params);
    const res = await fetch(url, opts);
    let data;
    try { data = await res.json(); } catch { throw new Error("Server returned an unexpected response."); }
    if (!data.success) throw new Error(data.message || "Request failed.");
    return data;
  }

  function pkOf(row) {
    const pk = {};
    state.columns.filter((c) => c.pk).forEach((c) => (pk[c.name] = row[c.name]));
    return pk;
  }

  /* ---------- tables / rows ---------- */
  async function loadTables() {
    const data = await api({ action: "tables" });
    state.adminId = data.admin_id;
    const nav = $("adm-tabs");
    nav.replaceChildren(...data.tables.map((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "adm-tab" + (t.name === state.table ? " is-active" : "");
      b.textContent = t.name;
      const small = document.createElement("small");
      small.textContent = t.count;
      b.append(small);
      b.addEventListener("click", () => { state.table = t.name; state.page = 1; state.q = ""; $("adm-search").value = ""; loadTables(); loadRows(); });
      return b;
    }));
    if (!state.table && data.tables.length) { state.table = data.tables[0].name; loadTables(); loadRows(); }
  }

  async function loadRows() {
    if (!state.table) return;
    const data = await api({ action: "rows", table: state.table, page: state.page, q: state.q });
    Object.assign(state, { columns: data.columns, rows: data.rows, total: data.total, pageSize: data.page_size, canEditPassword: data.can_edit_password });
    render();
  }

  function render() {
    const table = $("adm-table");
    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    state.columns.forEach((c) => { const th = document.createElement("th"); th.textContent = c.name; hr.append(th); });
    hr.append(document.createElement("th"));
    thead.append(hr);

    const tbody = document.createElement("tbody");
    state.rows.forEach((row) => {
      const tr = document.createElement("tr");
      state.columns.forEach((c) => tr.append(cell(row[c.name])));
      const td = document.createElement("td");
      td.className = "adm-row-actions";
      const edit = btn("Edit", () => openEdit(row));
      const del = btn("Delete", () => openDelete(row), "adm-btn--danger");
      td.append(edit, del);
      tr.append(td);
      tbody.append(tr);
    });

    table.replaceChildren(thead, tbody);
    if (!state.rows.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = state.columns.length + 1;
      td.className = "adm-empty";
      td.textContent = "No rows.";
      tr.append(td);
      tbody.append(tr);
    }

    const pages = Math.max(1, Math.ceil(state.total / state.pageSize));
    $("adm-count").textContent = state.total + " row" + (state.total === 1 ? "" : "s");
    $("adm-page").textContent = "Page " + state.page + " of " + pages;
    $("adm-prev").disabled = state.page <= 1;
    $("adm-next").disabled = state.page >= pages;
  }

  function btn(text, onClick, extra) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "adm-btn" + (extra ? " " + extra : "");
    b.textContent = text;
    b.addEventListener("click", onClick);
    return b;
  }

  /* ---------- add / edit ---------- */
  function fieldFor(col, value, isEdit) {
    const wrap = document.createElement("label");
    wrap.className = "adm-field";
    const span = document.createElement("span");
    span.textContent = col.name;
    const hint = document.createElement("small");
    hint.textContent = " " + col.type + (col.nullable ? ", optional" : "");
    span.append(hint);

    let input;
    const enumMatch = /^enum\((.*)\)$/i.exec(col.type);
    if (enumMatch) {
      input = document.createElement("select");
      enumMatch[1].split(",").map((s) => s.trim().replace(/^'|'$/g, "")).forEach((o) => {
        const opt = document.createElement("option");
        opt.value = opt.textContent = o;
        input.append(opt);
      });
    } else if (col.name === "account_type") {
      input = document.createElement("select");
      ["user", "admin"].forEach((o) => { const opt = document.createElement("option"); opt.value = opt.textContent = o; input.append(opt); });
    } else if (/text/i.test(col.type)) {
      input = document.createElement("textarea");
    } else {
      input = document.createElement("input");
      input.type = "text";
    }
    input.name = col.name;
    if (value !== null && value !== undefined) input.value = value;
    if (isEdit && (col.pk)) input.disabled = true;
    if (col.auto || col.generated) { input.disabled = true; input.placeholder = "auto"; }
    wrap.append(span, input);
    return wrap;
  }

  function openEdit(row) {
    state.editing = { row };
    $("adm-edit-title").textContent = "Edit " + state.table + " row";
    $("adm-fields").replaceChildren(...state.columns.map((c) => fieldFor(c, row[c.name], true)));
    $("adm-newpw-wrap").hidden = !state.canEditPassword;
    openEditDialog();
  }

  function openAdd() {
    state.editing = { row: null };
    $("adm-edit-title").textContent = "Add " + state.table + " row";
    $("adm-fields").replaceChildren(...state.columns.filter((c) => !c.auto && !c.generated).map((c) => fieldFor(c, null, false)));
    $("adm-newpw-wrap").hidden = !state.canEditPassword;
    openEditDialog();
  }

  function openEditDialog() {
    $("adm-newpw").value = "";
    $("adm-confirm-pw").value = "";
    setError("adm-edit-error", "");
    $("adm-edit-dialog").showModal();
  }

  function setError(id, msg) { const e = $(id); e.textContent = msg; e.hidden = !msg; }

  $("adm-edit-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const isEdit = !!state.editing.row;
    const fd = new FormData();
    fd.append("action", isEdit ? "update" : "insert");
    fd.append("table", state.table);
    fd.append("current_password", $("adm-confirm-pw").value);
    if (state.canEditPassword) fd.append("new_password", $("adm-newpw").value);

    if (isEdit) {
      const pk = pkOf(state.editing.row);
      Object.entries(pk).forEach(([k, v]) => fd.append("pk[" + k + "]", v));
    }
    $("adm-fields").querySelectorAll("input, select, textarea").forEach((el) => {
      if (el.disabled) return;
      /* On edit only send values that actually changed. */
      if (isEdit) {
        const old = state.editing.row[el.name];
        if ((old ?? "") === el.value) return;
      }
      fd.append("fields[" + el.name + "]", el.value);
    });

    const save = $("adm-edit-save");
    save.disabled = true;
    setError("adm-edit-error", "");
    try {
      await api(null, fd);
      $("adm-edit-dialog").close();
      await loadTables();
      await loadRows();
    } catch (e) {
      setError("adm-edit-error", e.message);
    } finally {
      save.disabled = false;
    }
  });
  $("adm-edit-cancel").addEventListener("click", () => $("adm-edit-dialog").close());

  /* ---------- delete ---------- */
  function openDelete(row) {
    state.deleting = row;
    const pk = pkOf(row);
    $("adm-del-msg").textContent = state.table + " → " + Object.entries(pk).map(([k, v]) => k + " = " + v).join(", ") + ". This can't be undone.";
    $("adm-del-pw").value = "";
    setError("adm-del-error", "");
    $("adm-del-dialog").showModal();
  }

  $("adm-del-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const fd = new FormData();
    fd.append("action", "delete");
    fd.append("table", state.table);
    fd.append("current_password", $("adm-del-pw").value);
    Object.entries(pkOf(state.deleting)).forEach(([k, v]) => fd.append("pk[" + k + "]", v));
    try {
      await api(null, fd);
      $("adm-del-dialog").close();
      await loadTables();
      await loadRows();
    } catch (e) {
      setError("adm-del-error", e.message);
    }
  });
  $("adm-del-cancel").addEventListener("click", () => $("adm-del-dialog").close());

  /* ---------- toolbar ---------- */
  $("adm-add").addEventListener("click", openAdd);
  $("adm-prev").addEventListener("click", () => { state.page--; loadRows(); });
  $("adm-next").addEventListener("click", () => { state.page++; loadRows(); });
  $("adm-search").addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.q = e.target.value.trim(); state.page = 1; loadRows().catch(console.error); }, 250);
  });

  /* ---------- boot: must be a logged-in admin ---------- */
  (async () => {
    const denied = $("adm-denied");
    try {
      const s = await (await fetch("../api/session.php")).json();
      if (!s.loggedIn) { location.href = "../login.html"; return; }
      if (s.user.account_type !== "admin") {
        denied.textContent = "You don't have permission to view this page.";
        denied.hidden = false;
        return;
      }
      $("adm-who").textContent = s.user.full_name + " · " + s.user.email;
      $("adm-main").hidden = false;
      await loadTables();
    } catch (e) {
      console.error(e);
      denied.textContent = "Couldn't load the admin panel: " + e.message;
      denied.hidden = false;
    }
  })();
})();
