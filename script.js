const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(pointer: fine)");

const header = document.querySelector("[data-header]");
const revealElements = document.querySelectorAll(".reveal");
const navLinks = [...document.querySelectorAll("[data-nav]")];
const navSections = [...document.querySelectorAll("main section[id], footer[id]")];

// React Bits inspired Split Text: preserve the semantic heading while animating
// each character behind its own mask.
const splitHeading = document.querySelector("[data-split-text]");

if (splitHeading && !reducedMotion.matches) {
  const fullHeading = splitHeading.textContent.replace(/\s+/g, " ").trim();
  splitHeading.setAttribute("aria-label", fullHeading);
  let characterIndex = 0;

  splitHeading.querySelectorAll(".hero-line").forEach((line) => {
    const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
    const textNodes = [];

    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach((textNode) => {
      const fragment = document.createDocumentFragment();
      [...textNode.textContent].forEach((character) => {
        if (/\s/.test(character)) {
          fragment.append(document.createTextNode(character));
          return;
        }

        const mask = document.createElement("span");
        const characterSpan = document.createElement("span");
        mask.className = "split-mask";
        characterSpan.className = "split-char";
        characterSpan.textContent = character;
        characterSpan.style.setProperty("--char-index", characterIndex);
        mask.append(characterSpan);
        fragment.append(mask);
        characterIndex += 1;
      });
      textNode.replaceWith(fragment);
    });
  });

  splitHeading.classList.add("is-split");
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => splitHeading.classList.add("is-revealed"));
  });
}

function updateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 64);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

if (revealElements.length) {
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.08,
      },
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  }
}

if (navSections.length && navLinks.length && "IntersectionObserver" in window) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (!visible.length) return;

      const currentId = visible[0].target.id;
      navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${currentId}`;
        link.classList.toggle("is-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    },
    {
      rootMargin: "-32% 0px -55% 0px",
      threshold: [0, 0.1, 0.4],
    },
  );

  navSections.forEach((section) => navObserver.observe(section));
}

const heroArt = document.querySelector("[data-hero-art]");
const artCards = heroArt ? [...heroArt.querySelectorAll("[data-depth]")] : [];

if (heroArt && artCards.length && finePointer.matches && !reducedMotion.matches) {
  let pointerFrame = 0;
  let pointerX = 0;
  let pointerY = 0;

  const renderPointer = () => {
    const width = heroArt.clientWidth || 1;
    const height = heroArt.clientHeight || 1;
    const normalizedX = pointerX / width - 0.5;
    const normalizedY = pointerY / height - 0.5;

    artCards.forEach((card) => {
      const depth = Number(card.dataset.depth || 1);
      card.style.setProperty("--mx", `${normalizedX * depth * 2.8}px`);
      card.style.setProperty("--my", `${normalizedY * depth * 2.2}px`);
    });

    pointerFrame = 0;
  };

  heroArt.addEventListener(
    "pointermove",
    (event) => {
      const rect = heroArt.getBoundingClientRect();
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
      if (!pointerFrame) {
        pointerFrame = window.requestAnimationFrame(renderPointer);
      }
    },
    { passive: true },
  );

  heroArt.addEventListener("pointerleave", () => {
    artCards.forEach((card) => {
      card.style.setProperty("--mx", "0px");
      card.style.setProperty("--my", "0px");
    });
  });
}

// React Bits inspired Spotlight Card: a soft light follows the pointer across
// project and strength cards, with a slightly brighter press state.
const spotlightCards = [...document.querySelectorAll("[data-spotlight]")];

if (spotlightCards.length && finePointer.matches && !reducedMotion.matches) {
  spotlightCards.forEach((card) => {
    let pointerInside = false;

    const moveSpotlight = (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      card.style.setProperty("--spot-x", `${x}px`);
      card.style.setProperty("--spot-y", `${y}px`);
    };

    card.addEventListener("pointerenter", (event) => {
      pointerInside = true;
      card.classList.add("is-spotlighting");
      moveSpotlight(event);
    });

    card.addEventListener("pointermove", moveSpotlight, { passive: true });

    card.addEventListener("pointerleave", () => {
      pointerInside = false;
      card.classList.remove("is-spotlighting", "is-spotlight-pressed");
    });

    card.addEventListener("pointerdown", () => {
      card.classList.add("is-spotlight-pressed");
    });

    ["pointerup", "pointercancel"].forEach((eventName) => {
      card.addEventListener(eventName, () => {
        card.classList.remove("is-spotlight-pressed");
      });
    });

    card.addEventListener("focusin", () => {
      if (pointerInside) return;
      card.style.setProperty("--spot-x", "50%");
      card.style.setProperty("--spot-y", "20%");
      card.classList.add("is-spotlighting");
    });

    card.addEventListener("focusout", () => {
      if (pointerInside) return;
      card.classList.remove("is-spotlighting", "is-spotlight-pressed");
    });
  });
}

// React Bits inspired Magnet: nearby call-to-action elements drift slightly
// toward the cursor with a lightweight spring and return to their resting spot.
const magnets = [...document.querySelectorAll("[data-magnet]")];

if (magnets.length && finePointer.matches && !reducedMotion.matches) {
  const magnetStates = magnets.map((element) => ({
    element,
    strength: Number(element.dataset.magnet || 5),
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  }));
  const attractionPadding = 72;
  let magnetFrame = 0;

  const settleMagnets = () => {
    let needsFrame = false;

    magnetStates.forEach((state) => {
      state.x += (state.targetX - state.x) * 0.16;
      state.y += (state.targetY - state.y) * 0.16;

      if (Math.abs(state.targetX - state.x) < 0.08) state.x = state.targetX;
      if (Math.abs(state.targetY - state.y) < 0.08) state.y = state.targetY;

      state.element.style.setProperty("--magnet-x", `${state.x.toFixed(2)}px`);
      state.element.style.setProperty("--magnet-y", `${state.y.toFixed(2)}px`);

      if (state.x !== state.targetX || state.y !== state.targetY) {
        needsFrame = true;
      }
    });

    magnetFrame = needsFrame ? window.requestAnimationFrame(settleMagnets) : 0;
  };

  const requestMagnetFrame = () => {
    if (!magnetFrame) {
      magnetFrame = window.requestAnimationFrame(settleMagnets);
    }
  };

  document.addEventListener(
    "pointermove",
    (event) => {
      magnetStates.forEach((state) => {
        const rect = state.element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2 - state.x;
        const centerY = rect.top + rect.height / 2 - state.y;
        const inRange =
          event.clientX > rect.left - attractionPadding &&
          event.clientX < rect.right + attractionPadding &&
          event.clientY > rect.top - attractionPadding &&
          event.clientY < rect.bottom + attractionPadding;

        if (!inRange) {
          state.targetX = 0;
          state.targetY = 0;
          return;
        }

        state.targetX = Math.max(
          -10,
          Math.min(10, (event.clientX - centerX) / state.strength),
        );
        state.targetY = Math.max(
          -8,
          Math.min(8, (event.clientY - centerY) / state.strength),
        );
      });
      requestMagnetFrame();
    },
    { passive: true },
  );

  document.documentElement.addEventListener("pointerleave", () => {
    magnetStates.forEach((state) => {
      state.targetX = 0;
      state.targetY = 0;
    });
    requestMagnetFrame();
  });
}

const dialogs = [...document.querySelectorAll(".case-dialog")];

function syncModalState() {
  const anyOpen = dialogs.some((dialog) => dialog.open);
  document.body.classList.toggle("modal-open", anyOpen);
}

document.querySelectorAll("[data-case-open]").forEach((button) => {
  button.addEventListener("click", () => {
    const dialog = document.getElementById(`case-${button.dataset.caseOpen}`);
    if (!(dialog instanceof HTMLDialogElement)) return;
    dialog.showModal();
    syncModalState();
  });
});

document.querySelectorAll("[data-dialog-close]").forEach((button) => {
  button.addEventListener("click", () => {
    const dialog = button.closest("dialog");
    if (dialog instanceof HTMLDialogElement) dialog.close();
  });
});

dialogs.forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", syncModalState);
});
