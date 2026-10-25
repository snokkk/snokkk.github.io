document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".hero__slideshow").forEach((slideshow) => {
    const slides = Array.from(slideshow.querySelectorAll(".hero__slide"));
    const pauseButton = slideshow.querySelector("[data-slide-pause]");
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const intervalMs = 2000;
    const swipeThreshold = 40;
    let currentIndex = 0;
    let timer = null;
    let paused = motionPreference.matches;
    let pointerStart = null;
    let requestId = 0;

    const stop = () => {
      window.clearInterval(timer);
      timer = null;
    };

    const showSlide = async (index) => {
      const nextIndex = (index + slides.length) % slides.length;
      const request = ++requestId;

      try {
        await slides[nextIndex].decode();
      } catch {
        return; // Keep the current image if a frame cannot be loaded.
      }

      if (request !== requestId) return;

      slides[currentIndex].classList.remove("is-active");
      slides[currentIndex].setAttribute("aria-hidden", "true");
      slides[nextIndex].classList.add("is-active");
      slides[nextIndex].setAttribute("aria-hidden", "false");
      currentIndex = nextIndex;
    };

    const start = () => {
      stop();
      if (paused || document.hidden || pointerStart || slideshow.matches(":focus-visible") || slideshow.querySelector(":focus-visible")) return;
      timer = window.setInterval(() => showSlide(currentIndex + 1), intervalMs);
    };

    const step = (direction) => {
      showSlide(currentIndex + direction);
      start();
    };

    const updatePauseButton = () => {
      pauseButton.setAttribute("aria-pressed", String(paused));
      pauseButton.setAttribute("aria-label", paused ? "Play slideshow" : "Pause slideshow");
    };

    slideshow.querySelector("[data-slide-previous]").addEventListener("click", () => step(-1));
    slideshow.querySelector("[data-slide-next]").addEventListener("click", () => step(1));
    pauseButton.addEventListener("click", () => {
      paused = !paused;
      updatePauseButton();
      start();
    });

    slideshow.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      step(event.key === "ArrowLeft" ? -1 : 1);
    });

    slideshow.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || event.button !== 0 || event.target.closest("button")) return;
      pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
      slideshow.setPointerCapture(event.pointerId);
      stop();
    });

    const finishSwipe = (event) => {
      if (!pointerStart || event.pointerId !== pointerStart.id) return;
      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      pointerStart = null;
      if (event.type === "pointerup" && Math.abs(dx) >= swipeThreshold && Math.abs(dx) > Math.abs(dy)) {
        showSlide(currentIndex + (dx < 0 ? 1 : -1));
      }
      start();
    };

    slideshow.addEventListener("pointerup", finishSwipe);
    slideshow.addEventListener("pointercancel", finishSwipe);
    slideshow.addEventListener("lostpointercapture", finishSwipe);
    slideshow.addEventListener("focusin", start);
    slideshow.addEventListener("focusout", () => window.setTimeout(start, 0));
    document.addEventListener("visibilitychange", start);
    motionPreference.addEventListener("change", () => {
      paused = motionPreference.matches;
      updatePauseButton();
      start();
    });

    slideshow.classList.add("is-ready");
    updatePauseButton();
    start();
  });

  const dropdowns = Array.from(document.querySelectorAll(".download-dropdown"));

  if (!dropdowns.length) {
    return;
  }

  const setCardState = (dropdown, isOpen) => {
    const card = dropdown.closest(".gameCard");

    if (card) {
      card.classList.toggle("gameCard--dropdownOpen", isOpen);
    }
  };

  const closeDropdown = (dropdown) => {
    if (!dropdown.open) {
      setCardState(dropdown, false);
      return;
    }

    dropdown.open = false;
    setCardState(dropdown, false);
  };

  dropdowns.forEach((dropdown) => {
    dropdown.addEventListener("toggle", () => {
      if (dropdown.open) {
        dropdowns.forEach((otherDropdown) => {
          if (otherDropdown !== dropdown) {
            closeDropdown(otherDropdown);
          }
        });
      }

      setCardState(dropdown, dropdown.open);
    });
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest(".download-dropdown")) {
      return;
    }

    dropdowns.forEach(closeDropdown);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      dropdowns.forEach(closeDropdown);
    }
  });
});
