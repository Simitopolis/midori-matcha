
/* MOBILE NAVIGATION — STORY & MENU */

const page = document.querySelector(
  ".story-page, .menu-page, .product-page"
);

if (page) {
  const toggle = page.querySelector(".menu-toggle");
  const navigation = page.querySelector(".navigation");

  if (toggle && navigation) {

    function setMenuOpen(open) {
      toggle.classList.toggle("is-open", open);
      navigation.classList.toggle("is-open", open);

      toggle.setAttribute(
        "aria-expanded",
        String(open)
      );

      toggle.setAttribute(
        "aria-label",
        open ? "Close menu" : "Open menu"
      );
    }

    // Open / close
    toggle.addEventListener("click", () => {
      const isOpen =
        toggle.getAttribute("aria-expanded") === "true";

      setMenuOpen(!isOpen);
    });

    // Close after clicking a link
    navigation.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        setMenuOpen(false);
      });
    });

    // Close with Escape
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    });

    // Close when clicking outside
    document.addEventListener("click", event => {
      if (
        !toggle.contains(event.target) &&
        !navigation.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    });

    // Reset on desktop
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
    });
  }
}
