(() => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.CONFIG;
  const $ = (id) => document.getElementById(id);
  const MESSAGES = {
    topic_taken: "Ese tema ya fue elegido por otra persona. Elige otro.",
    email_already_used: "Ese correo ya tiene un tema registrado.",
    invalid_input: "Revisa tu nombre y correo.",
  };

  let topics = [];
  let taken = new Set();
  let selected = null;

  async function rpc(fn, body) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `http_${res.status}`);
    }
    return res.status === 204 ? null : res.json();
  }

  async function refreshTaken() {
    taken = new Set(await rpc("taken_topics"));
  }

  function render() {
    const q = $("search").value.trim().toLowerCase();
    const cat = $("category").value;
    const onlyFree = $("only-free").checked;
    const visible = topics.filter((t) =>
      (!cat || t.category === cat) &&
      (!onlyFree || !taken.has(t.id)) &&
      (!q || `${t.name} ${t.ref}`.toLowerCase().includes(q)));

    const list = $("list");
    list.replaceChildren();
    let lastCat = null;
    for (const t of visible) {
      if (t.category !== lastCat) {
        const h = document.createElement("h2");
        h.className = "cat";
        h.textContent = t.category;
        list.append(h);
        lastCat = t.category;
      }
      const isTaken = taken.has(t.id);
      const row = document.createElement("div");
      row.className = "topic" + (isTaken ? " taken" : "");
      const info = document.createElement("div");
      const name = document.createElement("div");
      name.className = "name";
      name.textContent = t.name;
      const ref = document.createElement("div");
      ref.className = "ref";
      ref.textContent = t.ref;
      info.append(name, ref);
      row.append(info);
      if (isTaken) {
        const b = document.createElement("span");
        b.className = "badge";
        b.textContent = "Ocupado";
        row.append(b);
      } else {
        const btn = document.createElement("button");
        btn.className = "primary";
        btn.textContent = "Elegir";
        btn.addEventListener("click", () => openDialog(t));
        row.append(btn);
      }
      list.append(row);
    }
    if (!visible.length) list.textContent = "No hay temas que coincidan.";
    const free = topics.filter((t) => !taken.has(t.id)).length;
    $("counter").textContent = `${free} de ${topics.length} temas disponibles`;
  }

  function showError(msg) {
    $("error").textContent = msg;
    $("error").hidden = !msg;
  }

  function openDialog(topic) {
    selected = topic;
    $("dialog-topic").textContent = topic.name;
    showError("");
    $("dialog").showModal();
  }

  async function submit(ev) {
    ev.preventDefault();
    const btn = $("confirm");
    btn.disabled = true;
    showError("");
    try {
      await rpc("claim_topic", {
        p_topic: selected.id,
        p_name: $("name").value,
        p_email: $("email").value,
      });
      $("dialog").close();
      await refreshTaken();
      render();
      alert(`Registrado: ${selected.name}`);
    } catch (e) {
      showError(MESSAGES[e.message] || "No se pudo registrar. Intenta de nuevo.");
      if (e.message === "topic_taken") {
        await refreshTaken().catch(() => {});
        render();
      }
    } finally {
      btn.disabled = false;
    }
  }

  async function init() {
    topics = await (await fetch("topics.json")).json();
    const cats = [...new Set(topics.map((t) => t.category))];
    for (const c of cats) $("category").append(new Option(c, c));
    try {
      await refreshTaken();
    } catch {
      $("counter").textContent = "No se pudo consultar la disponibilidad. Recarga la página.";
    }
    render();
    for (const id of ["search", "category", "only-free"]) $(id).addEventListener("input", render);
    $("form").addEventListener("submit", submit);
    $("cancel").addEventListener("click", () => $("dialog").close());
  }

  init();
})();
