(function () {
    var items = [
        { id: "airplay", href: "/product/airplay.html", label: "AirPlay" },
        { id: "dlna", href: "/product/dlna.html", label: "DLNA" }
    ];

    var styleText = [
        ":host{display:block;margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',system-ui,sans-serif;}",
        ".nav-shell{display:flex;justify-content:center;}",
        ".nav-wrap{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px;border-radius:999px;",
        "background:linear-gradient(180deg,rgba(255,255,255,.9),rgba(255,255,255,.78));",
        "border:1px solid rgba(148,163,184,.22);box-shadow:0 12px 28px rgba(15,23,42,.08), inset 0 1px 0 rgba(255,255,255,.7);",
        "backdrop-filter:blur(10px);}",
        ".link{text-decoration:none;color:#334155;border:1px solid transparent;border-radius:999px;padding:10px 16px;font-size:13px;font-weight:700;line-height:1;letter-spacing:.01em;transition:all .18s ease;}",
        ".link:hover{color:#0f172a;background:rgba(255,255,255,.75);border-color:rgba(148,163,184,.22);}",
        ".link.active{color:#0f172a;background:linear-gradient(135deg,rgba(15,118,110,.14),rgba(37,99,235,.16));border-color:rgba(59,130,246,.18);box-shadow:0 4px 14px rgba(37,99,235,.10);}",
        "@media (max-width:560px){:host{margin-bottom:12px}.nav-wrap{gap:8px;padding:6px}.link{padding:9px 13px;font-size:12px;}}"
    ].join("");

    document.querySelectorAll("[data-product-nav]").forEach(function (nav) {
        var current = (nav.getAttribute("data-current") || "").toLowerCase();
        nav.setAttribute("aria-label", "Product navigation");
        nav.innerHTML = "";

        var root = nav.shadowRoot || nav.attachShadow({ mode: "open" });
        var linksHtml = items.map(function (item) {
            var activeClass = item.id === current ? " active" : "";
            return '<a class="link' + activeClass + '" href="' + item.href + '">' + item.label + "</a>";
        }).join("");

        root.innerHTML =
            "<style>" + styleText + "</style>" +
            '<div class="nav-shell"><div class="nav-wrap">' + linksHtml + "</div></div>";
    });
})();
