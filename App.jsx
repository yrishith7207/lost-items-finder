import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "lost-items-finder:items";

const CATEGORIES = [
  "Phone / Electronics",
  "Wallet / Cards",
  "Keys",
  "Bag / Backpack",
  "Clothing",
  "Documents / ID",
  "Jewellery",
  "Pet",
  "Other",
];

const SAMPLE_ITEMS = [
  {
    id: "s1",
    type: "lost",
    title: "Black leather wallet",
    category: "Wallet / Cards",
    description: "Contains ID card and two bank cards. Has a small tear on one corner.",
    location: "Charminar bus stop",
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    contact: "98765 43210",
    returned: false,
  },
  {
    id: "s2",
    type: "found",
    title: "Set of keys with blue keychain",
    category: "Keys",
    description: "Three keys on a blue rubber keychain. Handed to the security desk.",
    location: "Central Library, ground floor",
    date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    contact: "library@example.com",
    returned: false,
  },
];

const emptyForm = {
  type: "lost",
  title: "",
  category: CATEGORIES[0],
  description: "",
  location: "",
  date: new Date().toISOString().slice(0, 10),
  contact: "",
};

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore corrupt data */
  }
  return SAMPLE_ITEMS;
}

export default function App() {
  const [items, setItems] = useState(loadItems);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showReturned, setShowReturned] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage may be unavailable */
    }
  }, [items]);

  const stats = useMemo(
    () => ({
      lost: items.filter((i) => i.type === "lost" && !i.returned).length,
      found: items.filter((i) => i.type === "found" && !i.returned).length,
      returned: items.filter((i) => i.returned).length,
    }),
    [items]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => (showReturned ? true : !i.returned))
      .filter((i) => typeFilter === "all" || i.type === typeFilter)
      .filter((i) => categoryFilter === "all" || i.category === categoryFilter)
      .filter(
        (i) =>
          !q ||
          [i.title, i.description, i.location, i.category]
            .join(" ")
            .toLowerCase()
            .includes(q)
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [items, query, typeFilter, categoryFilter, showReturned]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = "Please enter what the item is.";
    if (!form.location.trim()) e.location = "Please enter where it was lost or found.";
    if (!form.contact.trim()) e.contact = "Please add a phone number or email.";
    if (!form.date) e.date = "Please choose a date.";
    return e;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    const newItem = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      contact: form.contact.trim(),
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      returned: false,
    };
    setItems((prev) => [newItem, ...prev]);
    setForm({ ...emptyForm, type: form.type });
  }

  function toggleReturned(id) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, returned: !i.returned } : i))
    );
  }

  function removeItem(id) {
    if (window.confirm("Delete this report permanently?")) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <h1>Lost Items Finder</h1>
        <p>Report something you lost, or something you found, and help it get home.</p>
        <div className="stats">
          <span className="stat lost">{stats.lost} lost</span>
          <span className="stat found">{stats.found} found</span>
          <span className="stat returned">{stats.returned} returned</span>
        </div>
      </header>

      <main className="layout">
        <section className="card form-card">
          <h2>Report an item</h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="toggle" role="radiogroup" aria-label="Report type">
              {["lost", "found"].map((t) => (
                <button
                  type="button"
                  key={t}
                  role="radio"
                  aria-checked={form.type === t}
                  className={form.type === t ? `active ${t}` : ""}
                  onClick={() => update("type", t)}
                >
                  I {t === "lost" ? "lost" : "found"} something
                </button>
              ))}
            </div>

            <label>
              Item name
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="e.g. Silver watch"
              />
              {errors.title && <span className="error">{errors.title}</span>}
            </label>

            <label>
              Category
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>

            <label>
              Description
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Colour, brand, marks, anything that helps identify it"
              />
            </label>

            <label>
              Where was it {form.type}?
              <input
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="e.g. Metro station, Ameerpet"
              />
              {errors.location && <span className="error">{errors.location}</span>}
            </label>

            <label>
              Date
              <input
                type="date"
                value={form.date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => update("date", e.target.value)}
              />
              {errors.date && <span className="error">{errors.date}</span>}
            </label>

            <label>
              Contact (phone or email)
              <input
                value={form.contact}
                onChange={(e) => update("contact", e.target.value)}
                placeholder="How should people reach you?"
              />
              {errors.contact && <span className="error">{errors.contact}</span>}
            </label>

            <button type="submit" className="primary">
              Submit report
            </button>
          </form>
        </section>

        <section className="list-section">
          <div className="card filters">
            <input
              className="search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, place or description…"
              aria-label="Search items"
            />
            <div className="filter-row">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filter by type"
              >
                <option value="all">Lost and found</option>
                <option value="lost">Lost only</option>
                <option value="found">Found only</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <label className="check">
                <input
                  type="checkbox"
                  checked={showReturned}
                  onChange={(e) => setShowReturned(e.target.checked)}
                />
                Show returned
              </label>
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="card empty">
              No items match. Try clearing the filters or report a new item.
            </div>
          ) : (
            <ul className="items">
              {visible.map((item) => (
                <li key={item.id} className={`card item ${item.returned ? "done" : ""}`}>
                  <div className="item-head">
                    <span className={`badge ${item.type}`}>{item.type.toUpperCase()}</span>
                    {item.returned && <span className="badge returned">RETURNED</span>}
                    <span className="date">{formatDate(item.date)}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="meta">
                    {item.category} · {item.location}
                  </p>
                  {item.description && <p>{item.description}</p>}
                  <p className="contact">
                    Contact: <strong>{item.contact}</strong>
                  </p>
                  <div className="actions">
                    <button onClick={() => toggleReturned(item.id)}>
                      {item.returned ? "Mark as active" : "Mark as returned"}
                    </button>
                    <button className="danger" onClick={() => removeItem(item.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer>Reports are saved in this browser only.</footer>
    </div>
  );
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
