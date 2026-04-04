document.addEventListener("DOMContentLoaded", () => {
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
