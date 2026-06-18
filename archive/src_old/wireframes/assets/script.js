document.addEventListener("DOMContentLoaded", () => {
  const current = window.location.pathname.split("/").pop() || "index.html";

  if (!document.querySelector(".wf-global-nav")) {
    const nav = document.createElement("nav");
    nav.className = "wf-global-nav";
    nav.innerHTML = `
      <div class="container py-2">
        <div class="d-flex justify-content-between align-items-center gap-3 flex-wrap">
          <a href="index.html" class="fw-bold text-decoration-none text-dark">BEE Wireframes</a>
          <div class="wf-nav-grid">
            <a class="btn btn-sm btn-outline-secondary" data-nav href="index.html">Landing</a>
            <a class="btn btn-sm btn-outline-secondary" data-nav href="login.html">Login</a>
            <a class="btn btn-sm btn-outline-secondary" data-nav href="register.html">Register</a>
            <a class="btn btn-sm btn-outline-secondary" data-nav href="dashboard.html">Dashboard</a>
            <a class="btn btn-sm btn-outline-secondary" data-nav href="experiments.html">Experiments</a>
            <a class="btn btn-sm btn-outline-secondary" data-nav href="experiment-detail.html">Experiment Detail</a>
            <a class="btn btn-sm btn-outline-secondary" data-nav href="models.html">Models</a>
            <a class="btn btn-sm btn-outline-secondary" data-nav href="models-library.html">Models Library</a>
            <a class="btn btn-sm btn-outline-secondary" data-nav href="sfms.html">Blueprints</a>
            <a class="btn btn-sm btn-outline-secondary" data-nav href="sfm-detail.html">Blueprint Detail</a>
            <a class="btn btn-sm btn-outline-secondary" data-nav href="new-experiment.html">New Experiment</a>
            <a class="btn btn-sm btn-outline-secondary" data-nav href="new-sfm.html">New Blueprint</a>
            <a class="btn btn-sm btn-outline-secondary" data-nav href="public-hub.html">Public Hub</a>
            <a class="btn btn-sm btn-outline-secondary" data-nav href="docs.html">Docs</a>
            <a class="btn btn-sm btn-outline-secondary" data-nav href="doc-viewer.html">Doc Viewer</a>
            <a class="btn btn-sm btn-outline-secondary" data-nav href="profile.html">My Profile</a>
            <a class="btn btn-sm btn-outline-secondary" data-nav href="user-profile.html">User Profile</a>
            <a class="btn btn-sm btn-outline-secondary" data-nav href="admin.html">Admin</a>
            <a class="btn btn-sm btn-outline-secondary" data-nav href="settings.html">Settings</a>
            <a class="btn btn-sm btn-outline-secondary" data-nav href="not-found.html">Not Found</a>
          </div>
        </div>
      </div>
    `;

    document.body.prepend(nav);
  }

  document.querySelectorAll("[data-nav]").forEach((link) => {
    const target = link.getAttribute("href");
    if (target === current) {
      link.classList.add(
        "active",
        "btn-primary",
        "text-white",
        "border-primary",
      );
      link.classList.remove("btn-outline-secondary");
      link.setAttribute("aria-current", "page");
    }
  });
});
