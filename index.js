/* =========================================
   SMOOTH SCROLL - LENIS
========================================= */

let lenisInstance = null;

function initSmoothScroll() {
  // Prevent duplicate initialization
  if (lenisInstance) return lenisInstance;

  // Check Lenis availability
  if (!window.Lenis) {
    console.error("Lenis not found");
    return null;
  }

  // Initialize Lenis
  lenisInstance = new window.Lenis({
    autoRaf: false,

    duration: 1.1,

    smoothWheel: true,

    syncTouch: false,

    anchors: true,
  });

  // =====================================
  // GSAP TICKER INTEGRATION
  // =====================================

  gsap.ticker.add((time) => {
    lenisInstance.raf(time * 1000);
  });

  // =====================================
  // SCROLLTRIGGER INTEGRATION
  // =====================================

  if (window.ScrollTrigger) {
    lenisInstance.on("scroll", window.ScrollTrigger.update);
  }

  // Prevent GSAP lag smoothing conflicts
  gsap.ticker.lagSmoothing(0);

  return lenisInstance;
}

/* =========================================
   FIXED SCROLLBAR - LENIS
========================================= */

function initFixedScrollbar(lenis) {
  if (!lenis) return null;

  // Prevent duplicate scrollbar
  document.querySelector(".lenis-scrollbar")?.remove();

  // =====================================
  // CREATE ELEMENTS
  // =====================================

  const track = document.createElement("div");
  const thumb = document.createElement("div");

  track.className = "lenis-scrollbar";
  thumb.className = "lenis-scrollbar-thumb";

  track.setAttribute("role", "scrollbar");
  track.setAttribute("aria-label", "Page scroll");
  track.setAttribute("aria-orientation", "vertical");
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", "100");
  track.setAttribute("aria-valuenow", "0");

  track.tabIndex = 0;

  track.appendChild(thumb);
  document.body.appendChild(track);

  // =====================================
  // VARIABLES
  // =====================================

  const minThumbHeight = 40;

  let isDragging = false;
  let startY = 0;
  let startTop = 0;

  // =====================================
  // UPDATE SCROLLBAR
  // =====================================

  function update() {
    const trackHeight = track.clientHeight;
    const viewportHeight = window.innerHeight;

    const limit = lenis.limit;
    const scroll = lenis.scroll;

    if (!trackHeight) return;

    // Calculate thumb height
    const contentHeight = viewportHeight + limit;

    const thumbHeight = Math.min(
      trackHeight,
      Math.max(minThumbHeight, trackHeight * (viewportHeight / contentHeight)),
    );

    // Calculate scroll progress
    const progress = limit > 0 ? Math.min(1, Math.max(0, scroll / limit)) : 0;

    // Calculate thumb position
    const maxTop = trackHeight - thumbHeight;

    const thumbTop = progress * maxTop;

    // Apply styles
    thumb.style.height = `${thumbHeight}px`;

    thumb.style.transform = `translateY(${thumbTop}px)`;

    // Hide when page doesn't scroll
    track.style.display = limit > 0 ? "block" : "none";

    // Accessibility
    track.setAttribute("aria-valuenow", Math.round(progress * 100));
  }

  // =====================================
  // TRACK CLICK
  // =====================================

  function onTrackClick(event) {
    if (event.target === thumb) return;

    const rect = track.getBoundingClientRect();

    const thumbHeight = thumb.offsetHeight;

    const maxTop = rect.height - thumbHeight;

    if (maxTop <= 0) return;

    const top = Math.max(
      0,
      Math.min(maxTop, event.clientY - rect.top - thumbHeight / 2),
    );

    const progress = top / maxTop;

    lenis.scrollTo(progress * lenis.limit);
  }

  // =====================================
  // DRAG START
  // =====================================

  function onDragStart(event) {
    event.preventDefault();

    isDragging = true;

    startY = event.clientY;

    startTop =
      thumb.getBoundingClientRect().top - track.getBoundingClientRect().top;

    thumb.setPointerCapture(event.pointerId);
  }

  // =====================================
  // DRAG MOVE
  // =====================================

  function onDragMove(event) {
    if (!isDragging) return;

    const trackHeight = track.clientHeight;

    const thumbHeight = thumb.offsetHeight;

    const maxTop = trackHeight - thumbHeight;

    if (maxTop <= 0) return;

    const deltaY = event.clientY - startY;

    const top = Math.max(0, Math.min(maxTop, startTop + deltaY));

    const progress = top / maxTop;

    lenis.scrollTo(progress * lenis.limit, {
      immediate: true,
    });
  }

  // =====================================
  // DRAG END
  // =====================================

  function onDragEnd() {
    isDragging = false;
  }

  // =====================================
  // KEYBOARD SUPPORT
  // =====================================

  function onKeyDown(event) {
    const current = lenis.scroll;

    const step = 100;

    let target = current;

    switch (event.key) {
      case "ArrowDown":
        target += step;
        break;

      case "ArrowUp":
        target -= step;
        break;

      case "PageDown":
        target += window.innerHeight * 0.9;
        break;

      case "PageUp":
        target -= window.innerHeight * 0.9;
        break;

      case "Home":
        target = 0;
        break;

      case "End":
        target = lenis.limit;
        break;

      default:
        return;
    }

    event.preventDefault();

    lenis.scrollTo(target);
  }

  // =====================================
  // EVENTS
  // =====================================

  lenis.on("scroll", update);

  window.addEventListener("resize", update);

  track.addEventListener("pointerdown", onTrackClick);

  thumb.addEventListener("pointerdown", onDragStart);
  thumb.addEventListener("pointermove", onDragMove);
  thumb.addEventListener("pointerup", onDragEnd);
  thumb.addEventListener("pointercancel", onDragEnd);

  track.addEventListener("keydown", onKeyDown);

  // Initial update
  update();

  // =====================================
  // PUBLIC METHODS
  // =====================================

  return {
    update,

    destroy() {
      lenis.off("scroll", update);

      window.removeEventListener("resize", update);

      track.removeEventListener("pointerdown", onTrackClick);

      thumb.removeEventListener("pointerdown", onDragStart);
      thumb.removeEventListener("pointermove", onDragMove);
      thumb.removeEventListener("pointerup", onDragEnd);
      thumb.removeEventListener("pointercancel", onDragEnd);

      track.removeEventListener("keydown", onKeyDown);

      track.remove();
    },
  };
}

/* =========================================
   1. GENERATE PIXELS
========================================= */

function generatePixels(root) {
  const pixelContainers = root.matches?.(".preload-bg")
    ? [root, ...root.querySelectorAll(".preload-bg")]
    : [...root.querySelectorAll(".preload-bg")];

  pixelContainers.forEach((pixelContainer) => {
    const pixelSize = 40;

    const width = pixelContainer.clientWidth;
    const height = pixelContainer.clientHeight;

    if (!width || !height) return;

    const cols = Math.ceil(width / pixelSize);
    const rows = Math.ceil(height / pixelSize);

    pixelContainer.innerHTML = "";

    pixelContainer.dataset.cols = cols;
    pixelContainer.dataset.rows = rows;

    pixelContainer.style.display = "grid";
    pixelContainer.style.gridTemplateColumns = `repeat(${cols}, ${pixelSize}px)`;
    pixelContainer.style.gridAutoRows = `${pixelSize}px`;
    pixelContainer.style.gap = "0";
    pixelContainer.style.overflow = "hidden";

    for (let i = 0; i < cols * rows; i++) {
      const pixel = document.createElement("div");

      pixel.style.width = `${pixelSize}px`;
      pixel.style.height = `${pixelSize}px`;
      pixel.style.backgroundColor = "transparent";

      pixelContainer.appendChild(pixel);
    }
  });
}

/* =========================================
   PIXEL ZIPPER ORDER
   Bottom/Top Rows + Odd/Even Columns
========================================= */

function getZipperPixelOrder(pixelContainer, { direction = "bottom" } = {}) {
  const pixels = Array.from(pixelContainer.children);

  const cols = Number(pixelContainer.dataset.cols);
  const rows = Number(pixelContainer.dataset.rows);

  if (!pixels.length || !cols || !rows) {
    return {
      pixels: [],
      stagger: () => () => 0,
    };
  }

  // =====================================
  // ORDER MAP
  // =====================================

  const orderMap = new Map();
  const maxOrder = Math.max(rows * 2 - 1, 1);

  pixels.forEach((pixel, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    // 1-based column:
    // col 0 => column 1 (odd)
    // col 1 => column 2 (even)
    const isEvenColumn = (col + 1) % 2 === 0;

    // Row progression:
    // bottom => bottom row starts at 0
    // top => top row starts at 0
    const rowProgress = direction === "bottom" ? rows - 1 - row : row;

    // Interleaved order:
    // odd columns first, even columns second
    const order = rowProgress * 2 + (isEvenColumn ? 1 : 0);

    orderMap.set(pixel, order);
  });

  // =====================================
  // STAGGER
  // =====================================

  function stagger(amount = 1, reverse = false) {
    return (index, target) => {
      const order = orderMap.get(target) ?? 0;

      const progress = maxOrder > 0 ? order / maxOrder : 0;

      return (reverse ? 1 - progress : progress) * amount;
    };
  }

  // =====================================
  // RETURN
  // =====================================

  return {
    pixels,
    stagger,
  };
}

/* =========================================
   2. ANIMATE PRELOAD
========================================= */

function animatePreload(root) {
  const wrap = root.querySelector(".preload-wrap");
  const page = root.querySelector(".page-main");
  const logo = root.querySelector(".preload-logo");
  const pixelContainer = root.querySelector(".preload-bg");

  if (!wrap || !logo || !pixelContainer) return null;

  const pixels = Array.from(pixelContainer.children);

  const cols = Number(pixelContainer.dataset.cols);
  const rows = Number(pixelContainer.dataset.rows);

  if (!pixels.length || !cols || !rows) return null;

  // SPLIT TEXT
  const split = SplitText.create(logo, {
    type: "lines",
    mask: "lines",
  });

  // INITIAL STATE
  // gsap.set(wrap, {
  //   position: "fixed",
  //   clipPath: "inset(0% 0% 0% 0%)",
  // });

  gsap.set(logo, {
    opacity: 1,
  });

  gsap.set(split.lines, {
    yPercent: 110,
  });

  // PIXEL INITIAL STATE
  gsap.set(pixels, {
    backgroundColor: "transparent",
    opacity: 0,
    scale: 0.85,
    transformOrigin: "center center",
  });

  // ZIPPER PIXEL ORDER

  const zipperTop = getZipperPixelOrder(pixelContainer, { direction: "top" });
  const zipperBottom = getZipperPixelOrder(pixelContainer, {
    direction: "bottom",
  });

  const topPixels = zipperTop.pixels;
  const bottomPixels = zipperBottom.pixels;

  // MAIN TIMELINE
  const tl = gsap.timeline();

  // 02. CINEMATIC PIXEL ZIPPER
  tl.to(
    bottomPixels,
    {
      backgroundColor: "#000000",
      opacity: 1,
      scale: 1,
      duration: 0.25,
      ease: "power2.in",

      stagger: zipperBottom.stagger(0.6),
    },
    "+=0.3",
  );

  // 01. LOGO REVEAL
  tl.to(
    split.lines,
    {
      yPercent: 0,
      duration: 0.8,
      ease: "power2.out",
    },
    "-=0.2",
  );

  tl.to(
    page,
    {
      y: "20vh",
    },
    "<",
  );

  tl.set(
    wrap,
    {
      backgroundColor: "transparent",
    },
    "+=0.5",
  );

  tl.to(
    topPixels,
    {
      backgroundColor: "transparent",
      opacity: 1,
      scale: 1,
      duration: 0.25,
      ease: "power2.out",

      stagger: zipperTop.stagger(0.6, true),
    },
    "<0.2",
  );

  tl.to(
    split.lines,
    {
      yPercent: -100,
      duration: 0.8,
      ease: "power2.in",
    },
    "<-0.4",
  );

  tl.to(
    page,
    {
      y: "0vh",
      duration: 1,
      ease: "power2.out",
    },
    "<",
  );

  // RESET PIXELS FOR FUTURE TRANSITIONS

  tl.call(() => {
    gsap.set(pixels, {
      backgroundColor: "transparent",
      opacity: 0,
      scale: 0.85,
    });

    gsap.set(logo, {
      autoAlpha: 0,
    });

    gsap.set(wrap, {
      pointerEvents: "none",
      backgroundColor: "transparent",
      clipPath: "inset(0% 0% 100% 0%)",
    });

    split.revert();
  });

  return tl;
}

/* =========================================
   3. HERO LAYOUT TOGGLE
========================================= */

function initHeroLayoutToggle({
  root = document,
  duration = 0.8,
  stagger = 0.08,
  ease = "power3.inOut",
} = {}) {
  // SELECTORS
  const selectAll = (selector) => Array.from(root.querySelectorAll(selector));

  const ratedItems = selectAll("[data-hero-rated]");
  const heroImages = selectAll("[data-hero-img]");
  const curatedImages = selectAll(".hero-curated-img");
  const bottomDescriptions = selectAll(".hero-bottom-desc");

  const line1Targets = selectAll('[data-hero-line="1"]');
  const line2Targets = selectAll('[data-hero-line="2"]');

  const toggleElements = selectAll("[data-layout-toggle]");

  // SPLIT TEXT
  const createLineSplits = (elements) =>
    elements.map((element) =>
      SplitText.create(element, {
        type: "lines",
        mask: "lines",
      }),
    );

  const line1Splits = createLineSplits(line1Targets);
  const line2Splits = createLineSplits(line2Targets);

  const line1Lines = line1Splits.flatMap((split) => split.lines);

  const line2Lines = line2Splits.flatMap((split) => split.lines);

  // INITIAL STATES

  // Hero layout
  gsap.set(ratedItems, {
    xPercent: 0,
  });

  // Hero images initially visible
  gsap.set(heroImages, {
    clipPath: "inset(0% 0% 0% 0%)",
  });

  // First line visible
  gsap.set(line1Lines, {
    yPercent: 0,
  });

  // Second line hidden
  gsap.set(line2Lines, {
    yPercent: 100,
  });

  // Curated images hidden
  gsap.set(curatedImages, {
    clipPath: "inset(0% 0% 100% 0%)",
  });

  // MAIN TIMELINE
  const tl = gsap.timeline({
    paused: true,
  });

  // ---------------------------------
  // PHASE 1
  // ---------------------------------

  const phase1 = gsap.timeline();

  phase1
    .to(
      ratedItems,
      {
        xPercent: -34,
        duration,
        ease,
      },
      0,
    )
    .to(
      heroImages,
      {
        clipPath: "inset(0% 0% 100% 0%)",
        duration,
        stagger,
        ease,
      },
      0,
    )
    .to(
      line1Lines,
      {
        yPercent: 100,
        duration,
        ease,
      },
      0,
    );

  tl.add(phase1);

  // ---------------------------------
  // PHASE 2
  // ---------------------------------

  tl.to(
    line2Lines,
    {
      yPercent: 0,
      duration,
      ease,
    },
    ">",
  )
    .to(
      bottomDescriptions,
      {
        height: 0,
        marginTop: 0,
        duration,
        ease,
      },
      "<",
    )
    .to(
      curatedImages,
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration,
        stagger,
        ease,
      },
      "<",
    );

  // START IN REVERSED STATE
  tl.reversed(true);

  // ---------------------------------
  // TOGGLE
  // ---------------------------------

  const toggle = () => {
    tl.reversed() ? tl.play() : tl.reverse();
  };

  toggleElements.forEach((element) => {
    element.addEventListener("click", toggle);
  });

  // ---------------------------------
  // CLEANUP
  // ---------------------------------

  return {
    timeline: tl,

    destroy() {
      toggleElements.forEach((element) => {
        element.removeEventListener("click", toggle);
      });

      tl.kill();

      [...line1Splits, ...line2Splits].forEach((split) => {
        split.revert();
      });
    },
  };
}

function createPageTransition(root = document) {
  const wrap = root.querySelector(".preload-wrap");
  const logo = root.querySelector(".preload-logo");
  const pixelContainer = root.querySelector(".preload-bg");

  // PRELOAD TAG ELEMENTS
  const tagWraps = Array.from(root.querySelectorAll(".preload-tag-wrap"));

  const tagTexts = Array.from(root.querySelectorAll(".preload-tag .text-24"));

  if (!wrap || !pixelContainer) {
    console.warn("Page transition elements not found");

    return {
      cover: () => gsap.timeline(),
      reveal: () => gsap.timeline(),
    };
  }

  const pixels = Array.from(pixelContainer.children);

  const cols = Number(pixelContainer.dataset.cols);
  const rows = Number(pixelContainer.dataset.rows);

  if (!pixels.length || !cols || !rows) {
    return {
      cover: () => gsap.timeline(),
      reveal: () => gsap.timeline(),
    };
  }

  // ZIPPER PIXEL ORDER

  const zipperTop = getZipperPixelOrder(pixelContainer, { direction: "top" });
  const zipperBottom = getZipperPixelOrder(pixelContainer, {
    direction: "bottom",
  });

  const topPixels = zipperTop.pixels;
  const bottomPixels = zipperBottom.pixels;

  // =====================================
  // COVER CURRENT PAGE
  // =====================================

  function cover(page, nextPageName = "") {
    const tl = gsap.timeline();

    tl.set(wrap, {
      autoAlpha: 1,
      clipPath: "inset(0% 0% 0% 0%)",
      pointerEvents: "auto",
    });

    if (logo) {
      tl.set(logo, {
        autoAlpha: 0,
      });
    }

    tl.set(bottomPixels, {
      backgroundColor: "transparent",
      opacity: 0,
      scale: 0.85,
    });

    // 01. PIXEL COVER

    tl.to(
      bottomPixels,
      {
        backgroundColor: "#000000",
        opacity: 1,
        scale: 1,

        duration: 0.2,
        ease: "power2.out",

        stagger: zipperBottom.stagger(0.8),
      },
      0,
    );

    // 02. PRELOAD TAG REVEAL

    if (tagWraps.length) {
      tl.set(
        tagWraps,
        {
          yPercent: 100,
        },
        0,
      );

      tl.to(
        tagWraps,
        {
          yPercent: 0,

          duration: 0.8,
          ease: "power4.out",
        },
        0,
      );
    }

    // 03. SCRAMBLE TEXT

    if (nextPageName && tagTexts.length) {
      tl.to(
        tagTexts,
        {
          duration: 0.8,

          scrambleText: {
            text: nextPageName,
            chars: "upperAndLowerCase",
            revealDelay: 0.2,
            speed: 0.3,
          },

          ease: "none",
        },
        0,
      );
    }

    // 04. CURRENT PAGE MOVEMENT

    if (page) {
      tl.to(
        page,
        {
          y: "-20vh",

          duration: 1,
          ease: "power2.in",
        },
        0,
      );
    }

    return tl;
  }

  // =====================================
  // REVEAL NEXT PAGE
  // =====================================

  function reveal(page) {
    const tl = gsap.timeline({
      onComplete() {
        gsap.set(wrap, {
          clipPath: "inset(0% 0% 100% 0%)",
          pointerEvents: "none",
        });
      },
    });

    // 01. PRELOAD TAG REVEAL

    if (tagWraps.length) {
      tl.set(
        tagWraps,
        {
          yPercent: 0,
        },
        0,
      );

      tl.to(
        tagWraps,
        {
          yPercent: 100,

          duration: 0.8,
          ease: "power4.out",
        },
        0.2,
      );
    }

    // 02. PIXEL REVEAL

    tl.to(
      topPixels,
      {
        backgroundColor: "transparent",
        opacity: 0,
        scale: 0.85,

        duration: 0.2,
        ease: "power2.in",

        stagger: zipperTop.stagger(0.8, true),
      },
      0.2,
    );

    // 03. NEXT PAGE MOVEMENT

    if (page) {
      tl.from(
        page,
        {
          y: "20vh",

          duration: 1,
          ease: "power2.out",
        },
        0.2,
      );
    }

    return tl;
  }

  // PUBLIC METHODS

  return {
    cover,
    reveal,
  };
}

function initLineReveal(root = document) {
  const instances = [];

  root.querySelectorAll("[data-line]").forEach((element) => {
    const computed = getComputedStyle(element);

    // Get text-indent and convert it to em
    const indent = parseFloat(computed.textIndent) || 0;
    const fontSize = parseFloat(computed.fontSize) || 16;
    const indentEm = indent / fontSize;

    // Save original inline style
    const originalIndent = element.style.getPropertyValue("text-indent");
    const originalPriority = element.style.getPropertyPriority("text-indent");

    let spacer = null;

    if (indent !== 0) {
      // Create an inline spacer
      spacer = document.createElement("span");

      spacer.setAttribute("aria-hidden", "true");

      Object.assign(spacer.style, {
        display: "inline-block",
        width: `${Math.max(0, indentEm)}em`,
        height: "0",
        lineHeight: "0",
        marginInlineStart: `${Math.min(0, indentEm)}em`,
        overflow: "hidden",
        verticalAlign: "baseline",
        pointerEvents: "none",
      });

      // Insert spacer before text
      element.insertBefore(spacer, element.firstChild);

      // Disable original text-indent
      element.style.textIndent = "0px";
    }

    const split = SplitText.create(element, {
      type: "lines",
      mask: "lines",
      autoSplit: true,

      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 100,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",

          scrollTrigger: {
            trigger: element,
            start: "top 85%",
            once: true,
          },
        });
      },
    });

    instances.push({
      element,
      split,
      spacer,
      originalIndent,
      originalPriority,
    });
  });

  // Cleanup
  return () => {
    instances.forEach((instance) => {
      const { element, split, spacer, originalIndent, originalPriority } =
        instance;

      split.revert();

      spacer?.remove();

      if (originalIndent) {
        element.style.setProperty(
          "text-indent",
          originalIndent,
          originalPriority,
        );
      } else {
        element.style.removeProperty("text-indent");
      }
    });
  };
}

function initStaggerReveal(root = document) {
  const animations = [];

  root.querySelectorAll('[data-stagger="wrapper"]').forEach((wrapper) => {
    const targets = wrapper.querySelectorAll('[data-stagger="target"]');

    if (!targets.length) return;

    const animation = gsap.from(targets, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: "power3.out",

      scrollTrigger: {
        trigger: wrapper,
        start: "top 85%",
        once: true,
      },
    });

    animations.push(animation);
  });

  // Cleanup
  return () => {
    animations.forEach((animation) => {
      animation.scrollTrigger?.kill();
      animation.kill();
    });
  };
}

/* =========================================
   WORK HOVER + SCRAMBLE TEXT
========================================= */

function initWorkHover(root = document) {
  const wrappers = root.querySelectorAll('[data-work="wrapper"]');
  const cleanups = [];

  wrappers.forEach((wrapper) => {
    const items = Array.from(wrapper.querySelectorAll('[data-work="item"]'));

    if (!items.length) return;

    const textElements = new Map();
    const textTweens = new Map();

    // =====================================
    // SCRAMBLE CHARACTERS
    // =====================================

    const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowerChars = "abcdefghijklmnopqrstuvwxyz";
    const numberChars = "0123456789";

    function randomChar(char) {
      let pool = lowerChars;

      if (/\p{Lu}/u.test(char)) {
        pool = upperChars;
      } else if (/\p{N}/u.test(char)) {
        pool = numberChars;
      }

      return pool[Math.floor(Math.random() * pool.length)];
    }

    // =====================================
    // INIT TEXT
    // =====================================

    items.forEach((item) => {
      const texts = item.querySelectorAll('[data-work="text"]');

      texts.forEach((element) => {
        textElements.set(element, element.textContent);
      });
    });

    // =====================================
    // SCRAMBLE TEXT ANIMATION
    // =====================================

    function scrambleText(element) {
      const original = textElements.get(element);

      if (!original) return;

      // Kill previous animation
      textTweens.get(element)?.kill();

      const chars = Array.from(original);

      // Track letters and numbers only
      const charOrder = new Map();

      chars.forEach((char, index) => {
        if (/[\p{L}\p{N}]/u.test(char)) {
          charOrder.set(index, charOrder.size);
        }
      });

      const totalChars = charOrder.size;

      if (!totalChars) return;

      const scrambleState = { value: 0 };
      const resolveState = { progress: 0 };

      // =====================================
      // RANDOM SCRAMBLE
      // =====================================

      function renderScramble() {
        element.textContent = chars
          .map((char, index) => {
            return charOrder.has(index) ? randomChar(char) : char;
          })
          .join("");
      }

      // =====================================
      // RESOLVE TO ORIGINAL TEXT
      // =====================================

      function renderResolve() {
        const revealed = Math.floor(resolveState.progress * totalChars);

        element.textContent = chars
          .map((char, index) => {
            if (!charOrder.has(index)) return char;

            const order = charOrder.get(index);

            return order < revealed ? char : randomChar(char);
          })
          .join("");
      }

      // =====================================
      // TIMELINE
      // =====================================

      const timeline = gsap.timeline({
        onComplete: () => {
          element.textContent = original;
          textTweens.delete(element);
        },
      });

      // Scramble phase
      timeline.to(scrambleState, {
        value: 1,
        duration: 0.25,
        ease: "none",
        onUpdate: renderScramble,
      });

      // Resolve phase
      timeline.to(resolveState, {
        progress: 1,
        duration: 0.65,
        ease: "power2.out",
        onUpdate: renderResolve,
      });

      textTweens.set(element, timeline);
    }

    // =====================================
    // HOVER ITEM
    // =====================================

    function handleEnter(activeItem) {
      items.forEach((item) => {
        const isActive = item === activeItem;

        gsap.to(item, {
          filter: isActive ? "grayscale(0%)" : "grayscale(100%)",
          opacity: isActive ? 1 : 0.2,
          scale: isActive ? 1 : 0.9,
          duration: 0.4,
          ease: "power3.out",
          overwrite: "auto",
        });
      });

      // Scramble active item text
      const texts = activeItem.querySelectorAll('[data-work="text"]');

      texts.forEach(scrambleText);
    }

    // =====================================
    // RESET
    // =====================================

    function handleLeave() {
      gsap.to(items, {
        filter: "grayscale(0%)",
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: "power3.out",
        overwrite: "auto",
      });
    }

    // =====================================
    // EVENTS
    // =====================================

    items.forEach((item) => {
      const onEnter = () => handleEnter(item);

      item.addEventListener("mouseenter", onEnter);

      cleanups.push(() => {
        item.removeEventListener("mouseenter", onEnter);
      });
    });

    wrapper.addEventListener("mouseleave", handleLeave);

    cleanups.push(() => {
      wrapper.removeEventListener("mouseleave", handleLeave);

      gsap.killTweensOf(items);

      textTweens.forEach((timeline, element) => {
        timeline.kill();
        element.textContent = textElements.get(element);
      });

      textTweens.clear();
    });
  });

  // =====================================
  // CLEANUP
  // =====================================

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}

/* =========================================
   CUSTOM CURSOR
   Global Event Delegation
========================================= */

function initCustomCursor() {
  const media = window.matchMedia("(min-width: 768px)");

  const cursor = document.querySelector(".custom-cursor");

  if (!cursor) return () => {};

  let activeLink = null;
  let cursorSize = 12;

  let pointerX = 0;
  let pointerY = 0;

  let moveX;
  let moveY;
  let moveWidth;
  let moveHeight;

  let isActive = false;

  // =====================================
  // INITIALIZE
  // =====================================

  function setupCursor() {
    if (!media.matches || isActive) return;

    isActive = true;

    cursorSize = parseFloat(getComputedStyle(cursor).width) || 12;

    gsap.set(cursor, {
      x: -100,
      y: -100,
      width: cursorSize,
      height: cursorSize,
    });

    // Smooth movement
    moveX = gsap.quickTo(cursor, "x", {
      duration: 0.18,
      ease: "power3.out",
    });

    moveY = gsap.quickTo(cursor, "y", {
      duration: 0.18,
      ease: "power3.out",
    });

    moveWidth = gsap.quickTo(cursor, "width", {
      duration: 0.3,
      ease: "power3.out",
    });

    moveHeight = gsap.quickTo(cursor, "height", {
      duration: 0.3,
      ease: "power3.out",
    });

    // Global events
    document.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    document.documentElement.addEventListener(
      "pointerleave",
      handlePointerLeave,
    );

    window.addEventListener("scroll", updateActiveLink, true);
    window.addEventListener("resize", handleResize);
    window.addEventListener("blur", handlePointerLeave);
  }

  // =====================================
  // MOVE CURSOR
  // =====================================

  function moveCursor(x, y, width, height) {
    moveX(x);
    moveY(y);
    moveWidth(width);
    moveHeight(height);
  }

  // =====================================
  // UPDATE LINK BOUNDS
  // =====================================

  function updateActiveLink() {
    if (!activeLink) return;

    if (!activeLink.isConnected) {
      activeLink = null;
      cursor.classList.remove("is-active");
      return;
    }

    const rect = activeLink.getBoundingClientRect();

    const styles = getComputedStyle(cursor);

    const fontSize = parseFloat(styles.fontSize) || 16;
    const padding =
      (parseFloat(styles.getPropertyValue("--link-padding")) || 0) * fontSize;

    moveCursor(
      rect.left - padding,
      rect.top - padding,
      rect.width + padding * 2,
      rect.height + padding * 2,
    );
  }

  // =====================================
  // POINTER MOVE
  // =====================================

  function handlePointerMove(event) {
    if (event.pointerType === "touch") return;

    pointerX = event.clientX;
    pointerY = event.clientY;

    cursor.classList.add("is-visible");

    // Global link detection
    const target =
      event.target instanceof Element
        ? event.target.closest("[data-link]")
        : null;

    // =====================================
    // ACTIVE LINK
    // =====================================

    if (target) {
      if (activeLink !== target) {
        activeLink = target;
        cursor.classList.add("is-active");
      }

      updateActiveLink();

      return;
    }

    // =====================================
    // DEFAULT STATE
    // =====================================

    activeLink = null;

    cursor.classList.remove("is-active");

    moveCursor(
      pointerX - cursorSize / 2,
      pointerY - cursorSize / 2,
      cursorSize,
      cursorSize,
    );
  }

  // =====================================
  // POINTER LEAVE
  // =====================================

  function handlePointerLeave() {
    activeLink = null;

    cursor.classList.remove("is-active");
    cursor.classList.remove("is-visible");
  }

  // =====================================
  // RESIZE
  // =====================================

  function handleResize() {
    cursorSize = parseFloat(getComputedStyle(cursor).width) || cursorSize;

    if (activeLink) {
      updateActiveLink();
    } else {
      moveCursor(
        pointerX - cursorSize / 2,
        pointerY - cursorSize / 2,
        cursorSize,
        cursorSize,
      );
    }
  }

  // =====================================
  // DESTROY
  // =====================================

  function destroyCursor() {
    if (!isActive) return;

    isActive = false;

    document.removeEventListener("pointermove", handlePointerMove);

    document.documentElement.removeEventListener(
      "pointerleave",
      handlePointerLeave,
    );

    window.removeEventListener("scroll", updateActiveLink, true);
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("blur", handlePointerLeave);

    gsap.killTweensOf(cursor);

    cursor.classList.remove("is-visible", "is-active");

    gsap.set(cursor, {
      clearProps: "transform,width,height",
    });

    activeLink = null;
  }

  // =====================================
  // BREAKPOINT
  // =====================================

  function handleBreakpoint() {
    if (media.matches) {
      setupCursor();
    } else {
      destroyCursor();
    }
  }

  media.addEventListener("change", handleBreakpoint);

  handleBreakpoint();

  // =====================================
  // CLEANUP
  // =====================================

  return () => {
    media.removeEventListener("change", handleBreakpoint);
    destroyCursor();
  };
}

/* =========================================
   4. INIT PAGE
========================================= */


function initPage(container, { initial = false } = {}) {
  if (!container) return () => {};

  const cleanups = [];

  // =====================================
  // GSAP CONTEXT
  // =====================================

  const ctx = gsap.context(() => {

    // =====================================
    // PRELOADER
    // Initial page load only
    // =====================================

    if (initial) {
      generatePixels(container);

      const preloadCleanup = animatePreload(container);

      if (preloadCleanup) {
        cleanups.push(preloadCleanup);
      }
    }

    // =====================================
    // PAGE ANIMATIONS
    // =====================================

    const heroToggle = initHeroLayoutToggle({
      root: container,
    });

    cleanups.push(() => {
      heroToggle.destroy();
    });

    // =====================================
    // LINE REVEAL
    // =====================================

    const lineRevealCleanup = initLineReveal(container);

    if (lineRevealCleanup) {
      cleanups.push(lineRevealCleanup);
    }

    // =====================================
    // STAGGER REVEAL
    // =====================================

    const staggerRevealCleanup = initStaggerReveal(container);

    if (staggerRevealCleanup) {
      cleanups.push(staggerRevealCleanup);
    }

    // =====================================
    // WORK HOVER
    // =====================================

    const workHoverCleanup = initWorkHover(container);

    if (workHoverCleanup) {
      cleanups.push(workHoverCleanup);
    }

    // ---------------------------------
    // ADD MORE ANIMATIONS HERE
    // ---------------------------------

  }, container);

  // =====================================
  // DESTROY PAGE
  // =====================================

  return () => {
    cleanups.reverse().forEach((cleanup) => {
      cleanup();
    });

    ctx.revert();
  };
}


/* =========================================
   5. WEBFLOW DOCUMENT UPDATE
========================================= */

function updateWebflowDocument(data) {
  const parser = new DOMParser();

  const nextDoc = parser.parseFromString(data.next.html, "text/html");

  // Update page title
  document.title = nextDoc.title;

  // Update Webflow page ID
  const nextPageId = nextDoc.documentElement.getAttribute("data-wf-page");

  if (nextPageId) {
    document.documentElement.setAttribute("data-wf-page", nextPageId);
  }
}

/* =========================================
   6. WEBFLOW REINITIALIZATION
========================================= */

function destroyWebflow() {
  if (window.Webflow?.destroy) {
    window.Webflow.destroy();
  }
}

function reinitWebflow() {
  if (!window.Webflow) return;

  window.Webflow.ready();

  // Legacy Webflow IX2
  try {
    const ix2 = window.Webflow.require?.("ix2");

    if (ix2?.init) {
      ix2.init();
    }
  } catch (error) {
    console.warn("Webflow IX2 reinitialization:", error);
  }
}

/* =========================================
   7. BARBA INITIALIZATION
========================================= */

function initBarba() {
  const wrapper = document.querySelector('[data-barba="wrapper"]');

  const initialContainer = document.querySelector('[data-barba="container"]');

  if (!wrapper || !initialContainer) return;

  const lenis = initSmoothScroll();

  // Initialize custom scrollbar
  const fixedScrollbar = initFixedScrollbar(lenis);

  // =====================================
  // INITIAL SETUP
  // =====================================

  generatePixels(wrapper);

  const preloadTimeline = animatePreload(wrapper);

  const pageTransition = createPageTransition(wrapper);

  // =====================================
  // INIT INITIAL PAGE
  // =====================================

  let destroyCurrentPage = initPage(initialContainer);

  // =====================================
  // BARBA INIT
  // =====================================

  barba.init({
    preventRunning: true,

    transitions: [
      {
        name: "pixel-transition",

        sync: true,

        // =================================
        // BEFORE ENTER
        // =================================

        beforeEnter({ current, next }) {
          const wrapperRect = wrapper.getBoundingClientRect();
          const currentRect = current.container.getBoundingClientRect();

          const top = currentRect.top - wrapperRect.top + wrapper.scrollTop;
          const left = currentRect.left - wrapperRect.left + wrapper.scrollLeft;

          gsap.set(next.container, {
            position: "absolute",
            top,
            left,

            width: currentRect.width,
            zIndex: 2,

            // Keep layout measurable, but visually hidden
            opacity: 0,
            visibility: "visible",

            pointerEvents: "none",
          });
        },

        // =================================
        // LEAVE
        // =================================

        leave() {
          // Keep current container visible.
          // Do not animate or hide it here.
        },

        // =================================
        // ENTER
        // =================================

        enter(data) {
          const { current, next } = data;

          const currentPage = current.container;
          const nextPage = next.container;

          const nextPageName =
            nextPage.dataset.pageName || next.namespace || "Page";

          // Stop scrolling during transition
          lenis?.stop();

          const tl = gsap.timeline();

          // =====================================
          // 01. COVER CURRENT PAGE
          // =====================================

          tl.add(pageTransition.cover(currentPage, nextPageName));

          // =====================================
          // 02. DESTROY & INITIALIZE PAGE
          // =====================================

          tl.call(
            () => {
              // Destroy old page
              destroyCurrentPage();

              destroyCurrentPage = () => {};

              // Update Webflow
              destroyWebflow();

              updateWebflowDocument(data);

              reinitWebflow();

              // Reset scroll
              if (!next.url.hash) {
                if (lenis) {
                  lenis.scrollTo(0, {
                    immediate: true,
                    force: true,
                  });
                } else {
                  window.scrollTo(0, 0);
                }
              }

              // Initialize all animations
              // while container is still transparent
              destroyCurrentPage = initPage(next.container);

              // Show page AFTER all initial states
              // have been applied
              gsap.set(nextPage, {
                opacity: 1,
              });
            },
            null,
            ">",
          );

          // =====================================
          // 03. REVEAL NEXT PAGE
          // =====================================

          tl.add(pageTransition.reveal(nextPage), ">");

          // 04. RESUME SCROLL
          tl.call(
            () => {
              lenis?.start();
            },
            null,
            ">",
          );

          return tl;
        },

        // =================================
        // AFTER ENTER
        // =================================

        afterEnter({ next }) {
          // Restore normal document flow
          gsap.set(next.container, {
            clearProps:
              "position,top,left,width,zIndex,opacity,visibility,pointerEvents",
          });

          // Update Lenis dimensions
          lenis?.resize();

          // Update scrollbar dimensions
          fixedScrollbar?.update();

          // Refresh ScrollTrigger
          ScrollTrigger?.refresh();

          const fsModules = window.FinsweetAttributes?.modules;

          if (fsModules) {
            Object.values(fsModules).forEach((module) => {
              if (module.restart) {
                module.restart();
              }
            });
          }
        },
      },
    ],
  });
}

const cleanupCustomCursor = initCustomCursor();

/* =========================================
   8. DOM READY
========================================= */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBarba, { once: true });
} else {
  initBarba();
}
