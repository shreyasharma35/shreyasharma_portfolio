const portrait = document.querySelector(".portrait");

if (portrait instanceof HTMLImageElement) {
  const gazeSources = new Map([
    ["center", "centerr.png"],
    ["left", "left.jpg"],
    ["right", "right.jpg"],
    ["up", "upwards.jpg"],
    ["down", "downwards.jpg"],
  ]);
  const loadedDirections = new Set(["center"]);
  const neutralThreshold = 0.16;
  const directionHysteresis = 0.1;
  let currentDirection = "center";
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let pointerInside = false;
  let animationFrame = 0;

  const clamp = (value) => Math.min(Math.max(value, -1), 1);

  const setDirection = (direction) => {
    if (direction === currentDirection) {
      return;
    }

    const source = gazeSources.get(direction);
    if (!source || !loadedDirections.has(direction)) {
      return;
    }

    currentDirection = direction;
    portrait.dataset.direction = direction;
    portrait.src = source;
  };

  const chooseDirection = (normalizedX, normalizedY) => {
    const horizontalDistance = Math.abs(normalizedX);
    const verticalDistance = Math.abs(normalizedY);

    if (currentDirection === "center") {
      if (Math.max(horizontalDistance, verticalDistance) < neutralThreshold) {
        return "center";
      }
    } else {
      const remainsInCurrentDirection = {
        left: normalizedX <= -(neutralThreshold - directionHysteresis),
        right: normalizedX >= neutralThreshold - directionHysteresis,
        up: normalizedY <= -(neutralThreshold - directionHysteresis),
        down: normalizedY >= neutralThreshold - directionHysteresis,
      }[currentDirection];

      if (remainsInCurrentDirection) {
        return currentDirection;
      }
    }

    if (Math.max(horizontalDistance, verticalDistance) < neutralThreshold) {
      return "center";
    }

    if (horizontalDistance > verticalDistance) {
      return normalizedX < 0 ? "left" : "right";
    }

    return normalizedY < 0 ? "up" : "down";
  };

  const updateGaze = () => {
    animationFrame = 0;

    if (!pointerInside) {
      setDirection("center");
      return;
    }

    const bounds = portrait.getBoundingClientRect();
    const faceCenterX = bounds.left + bounds.width / 2;
    const faceCenterY = bounds.top + bounds.height * 0.356;
    const normalizedX = clamp(
      (pointerX - faceCenterX) / Math.max(window.innerWidth / 2, 1),
    );
    const normalizedY = clamp(
      (pointerY - faceCenterY) / Math.max(window.innerHeight / 2, 1),
    );

    setDirection(chooseDirection(normalizedX, normalizedY));
  };

  const scheduleGazeUpdate = () => {
    if (!animationFrame) {
      animationFrame = window.requestAnimationFrame(updateGaze);
    }
  };

  const resetGaze = () => {
    pointerInside = false;
    scheduleGazeUpdate();
  };

  gazeSources.forEach((source, direction) => {
    if (direction === "center") {
      return;
    }

    const preload = new Image();
    preload.src = source;
    preload.decode().then(
      () => {
        loadedDirections.add(direction);
        scheduleGazeUpdate();
      },
      (error) => console.error(`Unable to preload gaze image: ${source}`, error),
    );
  });

  portrait.addEventListener("error", () => {
    console.error(`Unable to load portrait image: ${portrait.currentSrc || portrait.src}`);
  });

  window.addEventListener("mousemove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerInside = true;
    scheduleGazeUpdate();
  });

  window.addEventListener("mouseleave", resetGaze);
  window.addEventListener("mouseout", (event) => {
    if (!event.relatedTarget) {
      resetGaze();
    }
  });
  window.addEventListener("blur", resetGaze);
  window.addEventListener("resize", scheduleGazeUpdate, { passive: true });
  window.addEventListener("scroll", scheduleGazeUpdate, { passive: true });
}

const currentYear = document.querySelector("#current-year");
if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector("#nav-links");

if (
  navToggle instanceof HTMLButtonElement &&
  navLinks instanceof HTMLElement
) {
  const closeNavigation = () => {
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
    navLinks.classList.remove("is-open");
  };

  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    navToggle.setAttribute(
      "aria-label",
      isOpen ? "Open navigation" : "Close navigation",
    );
    navLinks.classList.toggle("is-open", !isOpen);
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      closeNavigation();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      navToggle.getAttribute("aria-expanded") === "true"
    ) {
      closeNavigation();
      navToggle.focus();
    }
  });
}

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const sectionLinks = document.querySelectorAll('.nav-links a[href^="#"]');
const sections = document.querySelectorAll("main section[id]");
if ("IntersectionObserver" in window && sectionLinks.length > 0) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          sectionLinks.forEach((link) => {
            if (link.getAttribute("href") === `#${entry.target.id}`) {
              link.setAttribute("aria-current", "location");
            } else {
              link.removeAttribute("aria-current");
            }
          });
        }
      });
    },
    { rootMargin: "-35% 0px -55% 0px" },
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

const backToTop = document.querySelector(".back-to-top");
if (backToTop instanceof HTMLAnchorElement) {
  let scrollFrame = 0;
  window.addEventListener(
    "scroll",
    () => {
      if (!scrollFrame) {
        scrollFrame = window.requestAnimationFrame(() => {
          backToTop.classList.toggle("is-visible", window.scrollY > 600);
          scrollFrame = 0;
        });
      }
    },
    { passive: true },
  );
}
