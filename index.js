/* =========================================
   SMOOTH SCROLL - LENIS
========================================= */

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

let lenisInstance = null;

function resetPageScrollPosition(event) {
  if (event?.persisted) return;

  const root = document.documentElement;
  const reset = () => {
    if (lenisInstance) {
      lenisInstance.scrollTo(0, {
        immediate: true,
        force: true,
      });
    }

    window.scrollTo(0, 0);
    root.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };

  reset();
  requestAnimationFrame(reset);
}

window.addEventListener("pageshow", resetPageScrollPosition);

if (document.readyState === "complete") {
  resetPageScrollPosition();
}

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

  // GSAP TICKER INTEGRATION

  gsap.ticker.add((time) => {
    lenisInstance.raf(time * 1000);
  });

  // SCROLLTRIGGER INTEGRATION

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

  // CREATE ELEMENTS

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

  // VARIABLES

  const minThumbHeight = 40;

  let isDragging = false;
  let startY = 0;
  let startTop = 0;

  // UPDATE SCROLLBAR

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

  // TRACK CLICK

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

  // DRAG START

  function onDragStart(event) {
    event.preventDefault();

    isDragging = true;

    startY = event.clientY;

    startTop =
      thumb.getBoundingClientRect().top - track.getBoundingClientRect().top;

    thumb.setPointerCapture(event.pointerId);
  }

  // DRAG MOVE

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

  // DRAG END

  function onDragEnd() {
    isDragging = false;
  }

  // KEYBOARD SUPPORT

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

  // EVENTS

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

  // PUBLIC METHODS

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
   PRELOAD ANIMATION
========================================= */

function animatePreload(root) {
  const wrap = root.querySelector(".preload-wrap");
  if (!wrap) return null;

  const logo = wrap.querySelector(".preload-logo");
  const bg = wrap.querySelector(".preload-bg");
  const vLinesWrap = wrap.querySelector(".preload-lines-vertical");
  const vLine = wrap.querySelector(".preload-line-v");
  const hLinesWrap = wrap.querySelector(".preload-lines-horizontal");
  const hLine = wrap.querySelector(".preload-line-h");
  const content = root.querySelector("[data-preload-content]");

  const logoLetters = logo
    ? Array.from(logo.querySelectorAll(":scope > div"))
    : [];

  const eLetter = logo?.querySelector("[data-turn-e]");

  // Duration settings
  const LINES_INTRO_DURATION = 0.8;

  const SCALE_DURATION = 0.8;

  const LETTER_IN_DURATION = 0.5;
  const LETTER_IN_STAGGER = 0.06;

  const EXPAND_DURATION = 0.8;
  const FLIP_DURATION = 0.8;

  const LETTER_OUT_DURATION = 0.4;

  const EXIT_DURATION = 0.8;

  // SplitText: Letter + Mask
  const logoSplits = logoLetters.map((letter) =>
    SplitText.create(letter, {
      type: "chars",
      mask: "chars",
    }),
  );

  const logoChars = logoSplits.flatMap((split) => split.chars);

  // Calculate phase durations
  const LETTER_IN_TOTAL =
    LETTER_IN_DURATION + Math.max(0, logoChars.length - 1) * LETTER_IN_STAGGER;

  const PHASE_0_DURATION = vLinesWrap || hLinesWrap ? LINES_INTRO_DURATION : 0;

  const PHASE_1_DURATION = Math.max(SCALE_DURATION, LETTER_IN_TOTAL);

  const PHASE_2_DURATION = Math.max(EXPAND_DURATION, FLIP_DURATION);

  const PHASE_1_START = PHASE_0_DURATION;

  const PHASE_2_START = PHASE_1_START + PHASE_1_DURATION;

  const PHASE_3_START = PHASE_2_START + PHASE_2_DURATION;

  gsap.set(wrap, {
    clipPath: "inset(0% 0% 0% 0%)",
    pointerEvents: "auto",
  });

  gsap.set(logo, {
    opacity: 1,
  });

  gsap.set(content, {
    opacity: 0,
  });

  // Initial letter position
  if (logoChars.length) {
    gsap.set(logoChars, {
      yPercent: 100,
    });
  }

  // Prepare E letter for 3D rotation
  if (eLetter) {
    gsap.set(eLetter, {
      rotationY: 0,
      transformPerspective: 800,
      transformOrigin: "50% 50%",
      backfaceVisibility: "visible",
      force3D: true,
    });
  }

  lenisInstance?.stop();

  const tl = gsap.timeline({
    delay: 0.5,
    onComplete() {
      logoSplits.forEach((split) => split.revert());

      gsap.set(wrap, {
        autoAlpha: 0,
        pointerEvents: "none",
      });

      lenisInstance?.start();
    },
  });

  // ==================================
  // PHASE 0: LINE INTRO
  // ==================================

  tl.addLabel("phase0", 0);

  if (vLinesWrap) {
    tl.to(
      vLinesWrap,
      {
        width: "24em",
        duration: LINES_INTRO_DURATION,
        ease: "power2.out",
      },
      "phase0",
    );
  }

  if (hLinesWrap) {
    tl.to(
      hLinesWrap,
      {
        height: "24em",
        duration: LINES_INTRO_DURATION,
        ease: "power2.out",
      },
      "phase0",
    );
  }

  // ==================================
  // PHASE 1: SCALE + LETTER REVEAL
  // ==================================

  tl.addLabel("phase1", PHASE_1_START);

  if (bg) {
    tl.to(
      bg,
      {
        scale: 1,
        duration: SCALE_DURATION,
        ease: "power2.out",
      },
      "phase1",
    );
  }

  if (vLine) {
    tl.to(
      vLine,
      {
        width: "100%",
        duration: SCALE_DURATION,
        ease: "power2.out",
      },
      "phase1",
    );
  }

  if (hLine) {
    tl.to(
      hLine,
      {
        height: "100%",
        duration: SCALE_DURATION,
        ease: "power2.out",
      },
      "phase1",
    );
  }

  if (logoChars.length) {
    tl.to(
      logoChars,
      {
        yPercent: 0,
        duration: LETTER_IN_DURATION,
        stagger: LETTER_IN_STAGGER,
        ease: "power3.out",
      },
      "phase1",
    );
  }

  // ==================================
  // PHASE 2: BG EXPAND + E FLIP
  // ==================================

  tl.addLabel("phase2", PHASE_2_START);

  if (bg) {
    tl.to(
      bg,
      {
        width: "101%",
        height: "101%",
        duration: EXPAND_DURATION,
        ease: "power2.inOut",
      },
      "phase2",
    );
  }

  if (vLinesWrap) {
    tl.to(
      vLinesWrap,
      {
        width: "100%",
        duration: EXPAND_DURATION,
        ease: "power2.inOut",
      },
      "phase2",
    );
  }

  if (hLinesWrap) {
    tl.to(
      hLinesWrap,
      {
        height: "100%",
        duration: EXPAND_DURATION,
        ease: "power2.inOut",
      },
      "phase2",
    );
  }

  if (eLetter) {
    tl.to(
      eLetter,
      {
        rotationY: 180,
        duration: FLIP_DURATION,
        ease: "power2.inOut",
        force3D: true,
      },
      "phase2",
    );
  }

  // ==================================
  // PHASE 3: LOGO + WRAP EXIT
  // ==================================

  tl.addLabel("phase3", PHASE_3_START);

  if (logo) {
    tl.to(
      logo,
      {
        scale: 0.8,
        autoAlpha: 0.5,
        duration: LETTER_OUT_DURATION,
        ease: "power2.in",
      },
      "phase3",
    );
  }

  tl.to(
    wrap,
    {
      clipPath: "inset(0% 0% 100% 0%)",
      duration: EXIT_DURATION,
      ease: "power2.inOut",
    },
    "phase3",
  );

  tl.to(
    content,
    {
      opacity: 1,
      duration: EXIT_DURATION,
      ease: "power2.inOut",
    },
    "phase3",
  );

  return tl;
}

/* =========================================
   1. HERO LAYOUT TOGGLE
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

  // PHASE 1

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

  // PHASE 2

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

  // TOGGLE

  const toggle = () => {
    tl.reversed() ? tl.play() : tl.reverse();
  };

  toggleElements.forEach((element) => {
    element.addEventListener("click", toggle);
  });

  // CLEANUP

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
  const logo = wrap?.querySelector(".preload-logo");

  const createEmptyTransition = () => ({
    cover: () => gsap.timeline(),
    reveal: () => gsap.timeline(),
  });

  if (!wrap) {
    console.warn("Page transition elements not found");
    return createEmptyTransition();
  }

  // Duration settings
  const PAGE_DURATION = 1;
  const WIPE_DURATION = 0.8;

  // ==================================
  // COVER CURRENT PAGE
  // ==================================

  function cover(page, nextPageName = "") {
    const tl = gsap.timeline();

    // Reset wrap to hidden state
    tl.set(wrap, {
      autoAlpha: 1,
      clipPath: "inset(100% 0% 0% 0%)",
      backgroundColor: "#000000",
      pointerEvents: "auto",
    });

    // Hide logo
    if (logo) {
      tl.set(
        logo,
        {
          autoAlpha: 0,
        },
        0,
      );
    }

    // Page moves upward
    if (page) {
      tl.to(
        page,
        {
          y: "-20vh",
          duration: PAGE_DURATION,
          ease: "power2.in",
        },
        0,
      );
    }

    // Wrap reveals from top to bottom
    tl.to(
      wrap,
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: WIPE_DURATION,
        ease: "power2.inOut",
      },
      0,
    );

    return tl;
  }

  // ==================================
  // REVEAL NEXT PAGE
  // ==================================

  function reveal(page) {
    const tl = gsap.timeline({
      onComplete() {
        gsap.set(wrap, {
          autoAlpha: 0,
          pointerEvents: "none",
        });
      },
    });

    // Ensure wrap is fully covering the screen
    tl.set(wrap, {
      autoAlpha: 1,
      clipPath: "inset(0% 0% 0% 0%)",
      pointerEvents: "auto",
    });

    // Page enters from below
    if (page) {
      tl.fromTo(
        page,
        {
          y: "20vh",
        },
        {
          y: 0,
          duration: PAGE_DURATION,
          ease: "power2.out",
        },
        0,
      );
    }

    // Wrap exits upward
    tl.to(
      wrap,
      {
        clipPath: "inset(0% 0% 100% 0%)",
        duration: WIPE_DURATION,
        ease: "power2.inOut",
      },
      0,
    );

    return tl;
  }

  // ==================================
  // PUBLIC METHODS
  // ==================================

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

    gsap.set(element, {
      opacity: 1,
    });

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

function initLineRevealOpacity(root = document) {
  const splits = [];

  root.querySelectorAll("[data-line-opacity]").forEach((element) => {
    const split = SplitText.create(element, {
      type: "words",
      autoSplit: true,
      onSplit(self) {
        return gsap.fromTo(
          self.words,
          { opacity: 0.48 },
          {
            opacity: 1,
            stagger: 0.75,
            ease: "none",
            scrollTrigger: {
              trigger: element,
              start: "50% bottom",
              end: "50% top",
              scrub: true,
            },
          },
        );
      },
    });

    splits.push(split);
  });

  return () => {
    splits.forEach((split) => split.revert());
  };
}

function initStaggerReveal(root = document) {
  const animations = [];

  root.querySelectorAll('[data-stagger="wrapper"]').forEach((wrapper) => {
    const targets = wrapper.querySelectorAll('[data-stagger="target"]');

    if (!targets.length) return;

    gsap.set(wrapper, {
      opacity: 1,
    });

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

function initPeopleItemAnimation(root) {
  const peopleItems = [
    ...(root.matches?.(".people-item") ? [root] : []),
    ...root.querySelectorAll(".people-item"),
  ];
  const imageWraps = [
    ...(root.matches?.(".people-item-img-wrap") ? [root] : []),
    ...root.querySelectorAll(".people-item-img-wrap"),
  ];
  const timelines = [];

  root.querySelectorAll(".people-item").forEach((item, i) => {
    console.log(`Item ${i + 1}:`, getComputedStyle(item).top);
  });

  imageWraps.forEach((imageWrap) => {
    const peopleItem = imageWrap.closest(".people-item");
    const peopleItemIndex = peopleItems.indexOf(peopleItem);
    const nextPeopleItem =
      peopleItemIndex >= 0 ? peopleItems[peopleItemIndex + 1] : null;

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: imageWrap,
        ...(nextPeopleItem
          ? {
              endTrigger: nextPeopleItem,
              end: () =>
                `top ${parseFloat(getComputedStyle(nextPeopleItem).top) || 0}px`,
            }
          : {
              end: () => `+=${window.innerHeight + imageWrap.offsetHeight}`,
            }),
        start: "top bottom",
        scrub: true,
      },
    });

    timeline.fromTo(
      imageWrap,
      { scale: 0, transformOrigin: "100% 0%" },
      { scale: 1, duration: 0.5, ease: "none" },
    );
    timeline.set(imageWrap, { transformOrigin: "0% 0%" });
    timeline.to(imageWrap, { scale: 0, duration: 0.5, ease: "none" });

    timelines.push(timeline);
  });

  return () => {
    timelines.forEach((timeline) => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
    });
  };
}

function initWTAScale(root) {
  const marquees = [
    ...(root.matches?.(".wta-marquee") ? [root] : []),
    ...root.querySelectorAll(".wta-marquee"),
  ];
  const animations = [];

  marquees.forEach((marquee) => {
    const animation = gsap.fromTo(
      marquee,
      { scale: 2.5, transformOrigin: "top left" },
      {
        scale: 1,
        ease: "none",
        scrollTrigger: {
          trigger: marquee,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );

    animations.push(animation);
  });

  return () => {
    animations.forEach((animation) => {
      animation.scrollTrigger?.kill();
      animation.kill();
    });
  };
}

function initWTARunning(root) {
  const wrappers = [
    ...(root.matches?.(".wta-running-wrap") ? [root] : []),
    ...root.querySelectorAll(".wta-running-wrap"),
  ];
  const animations = [];

  wrappers.forEach((wrapper) => {
    const text = wrapper.querySelectorAll(".wta-running-text");

    if (!text.length) return;

    const animation = gsap.fromTo(
      text,
      { xPercent: 60 },
      {
        xPercent: -20,
        ease: "none",
        scrollTrigger: {
          trigger: wrapper,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );

    animations.push(animation);
  });

  return () => {
    animations.forEach((animation) => {
      animation.scrollTrigger?.kill();
      animation.kill();
    });
  };
}

function initHeroStudioMouseMove(root = document) {
  const wrappers = [
    ...(root.matches?.("[data-hero-studio]") ? [root] : []),
    ...root.querySelectorAll("[data-hero-studio]"),
  ];

  const cleanups = [];

  wrappers.forEach((wrapper) => {
    const track = wrapper.querySelector(".hero-studio-imgs");
    if (!track) return;

    const images = gsap.utils.toArray(track.querySelectorAll("img"));

    if (!images.length) return;

    // Initial state
    gsap.set(track, {
      xPercent: 0,
    });

    gsap.set(images, {
      zIndex: 0,
    });

    gsap.set(images[0], {
      zIndex: 1,
    });

    let activeIndex = 0;

    // Smooth movement
    const moveTrack = gsap.quickTo(track, "xPercent", {
      duration: 0.6,
      ease: "power3.out",
    });

    // Change active image
    function activateImage(index) {
      if (index === activeIndex) return;

      activeIndex = index;

      gsap.set(images, {
        zIndex: 0,
      });

      gsap.set(images[index], {
        zIndex: 1,
      });
    }

    // Mouse movement
    function handleMouseMove(e) {
      const rect = wrapper.getBoundingClientRect();

      if (!rect.width) return;

      const progress = gsap.utils.clamp(
        0,
        1,
        (e.clientX - rect.left) / rect.width,
      );

      // Move track from 0% to 300%
      moveTrack(progress * 300);

      // Determine active image
      const imageIndex = Math.min(
        images.length - 1,
        Math.floor(progress * images.length),
      );

      activateImage(imageIndex);
    }

    // Reset when mouse leaves
    function handleMouseLeave() {
      moveTrack(0);
      activateImage(0);
    }

    // Event listeners
    wrapper.addEventListener("mousemove", handleMouseMove);
    wrapper.addEventListener("mouseleave", handleMouseLeave);

    // Cleanup for this wrapper
    cleanups.push(() => {
      wrapper.removeEventListener("mousemove", handleMouseMove);
      wrapper.removeEventListener("mouseleave", handleMouseLeave);

      // Kill quickTo tween
      moveTrack.tween?.kill();

      // Reset GSAP styles
      gsap.set(track, {
        xPercent: 0,
      });

      gsap.set(images, {
        zIndex: 0,
      });

      gsap.set(images[0], {
        zIndex: 1,
      });
    });
  });

  // Return cleanup function
  return () => {
    cleanups.forEach((cleanup) => cleanup());
    cleanups.length = 0;
  };
}

function initCsSpacer(root = document) {
  const spacers = [
    ...(root.matches?.(".cs-spacer-wrap") ? [root] : []),
    ...root.querySelectorAll(".cs-spacer-wrap"),
  ];
  const contexts = [];

  spacers.forEach((spacer) => {
    const bg = spacer.querySelector(".cs-spacer-bg");

    if (!bg) return;

    const context = gsap.context(() => {
      gsap.set(bg, {
        y: "-100vh",
      });

      gsap.to(bg, {
        y: "0vh",
        ease: "none",
        scrollTrigger: {
          trigger: spacer,
          start: "top bottom",
          end: "top top",
          scrub: true,
        },
      });

      gsap.to(bg, {
        width: "100%",
        height: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: spacer,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });
    }, spacer);

    contexts.push(context);
  });

  return () => {
    contexts.reverse().forEach((context) => context.revert());
  };
}

function initDisciplinesRunning(root) {
  const wrappers = [
    ...(root.matches?.(".cs-running-wrap") ? [root] : []),
    ...root.querySelectorAll(".cs-running-wrap"),
  ];
  const animations = [];

  wrappers.forEach((wrapper) => {
    const text = wrapper.querySelectorAll(".cs-running-text");

    if (!text.length) return;

    const animation = gsap.fromTo(
      text,
      { xPercent: 60 },
      {
        xPercent: -20,
        ease: "none",
        scrollTrigger: {
          trigger: wrapper,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );

    animations.push(animation);
  });

  return () => {
    animations.forEach((animation) => {
      animation.scrollTrigger?.kill();
      animation.kill();
    });
  };
}

function addSplitTextSequence({
  target,
  sources,
  splitInstances,
  cleanups,
  duration = 0.8,
}) {
  if (!target || sources.length !== 4) return;

  const parent = target.parentElement;
  if (!parent) return;

  const originalHTML = target.innerHTML;

  // Set initial value
  target.innerHTML = sources[0].innerHTML;

  // Positioning context
  if (getComputedStyle(parent).position === "static") {
    gsap.set(parent, { position: "relative" });
  }

  const targetRect = target.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();

  const top =
    targetRect.top -
    parentRect.top -
    (parseFloat(getComputedStyle(parent).borderTopWidth) || 0) +
    parent.scrollTop;

  const left =
    targetRect.left -
    parentRect.left -
    (parseFloat(getComputedStyle(parent).borderLeftWidth) || 0) +
    parent.scrollLeft;

  const layers = sources.map((source, index) => {
    const element = index === 0 ? target : target.cloneNode(false);

    if (index > 0) {
      element.innerHTML = source.innerHTML;

      element.removeAttribute("id");
      element.removeAttribute("data-fd-text");
      element.setAttribute("aria-hidden", "true");

      parent.appendChild(element);

      gsap.set(element, {
        position: "absolute",
        top,
        left,
        width: targetRect.width,
        margin: 0,
        pointerEvents: "none",
      });
    }

    const split = new SplitText(element, {
      type: "lines",
      mask: "lines",
    });

    splitInstances.push(split);

    return {
      element,
      lines: split.lines,
    };
  });

  // Initial states
  layers.forEach(({ lines }) => {
    gsap.set(lines, {
      yPercent: 100,
    });
  });

  let currentIndex = -1;
  const allLines = layers.flatMap(({ lines }) => lines);

  const animateToStage = (index) => {
    if (index === currentIndex) return;

    const previousIndex = currentIndex;
    const direction = index > previousIndex ? 1 : -1;

    gsap.killTweensOf(allLines);

    layers.forEach(({ lines }, layerIndex) => {
      const yPercent =
        layerIndex === previousIndex
          ? 0
          : index >= 0 &&
              (layerIndex < index || (layerIndex === index && direction < 0))
            ? -100
            : 100;

      gsap.set(lines, { yPercent });
    });

    if (previousIndex >= 0) {
      gsap.to(layers[previousIndex].lines, {
        yPercent: index < 0 ? 100 : direction > 0 ? -100 : 100,
        duration,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    if (index >= 0) {
      gsap.to(layers[index].lines, {
        yPercent: 0,
        duration,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    currentIndex = index;
  };

  // Cleanup
  cleanups.push(() => {
    gsap.killTweensOf(allLines);

    layers.slice(1).forEach(({ element }) => {
      element.remove();
    });

    target.innerHTML = originalHTML;
  });

  return animateToStage;
}

function initDisciplineScroll(root = document) {
  const scope = typeof root === "string" ? document.querySelector(root) : root;

  if (!scope) return () => {};

  const rails = scope.matches?.(".cs-rail")
    ? [scope]
    : Array.from(scope.querySelectorAll(".cs-rail"));

  const cleanups = [];

  rails.forEach((rail) => {
    const wrap = rail.querySelector(".cs-wrap");
    const card = wrap?.querySelector(".cs-card");
    const imgList = wrap?.querySelector(".cs-img-list");
    const imgWrap = card?.querySelector("[data-fd-img]");

    if (!card || !imgList) return;

    const imageSequences = [imgWrap, imgList]
      .filter(Boolean)
      .map((group) => Array.from(group.querySelectorAll("[data-cs-img]")))
      .filter((images) => images.length);
    const parallaxImages = imageSequences
      .flatMap((images) => images.map((group) => group.querySelector("img")))
      .filter(Boolean);
    const splitInstances = [];
    const sequenceCleanups = [];
    const stageAnimations = [];

    const headLines = [];
    const textLines = [];

    // =================================
    // DYNAMIC TEXT CONFIG
    // =================================

    const textSequences = [
      {
        target: card.querySelector(".cs-card-grid-text .text-32"),
        sources: Array.from(rail.querySelectorAll(".cs-text-list .text-32")),
      },
      {
        target: card.querySelector(".cs-card-number .tc-geist-mono .text-16"),
        sources: Array.from(
          rail.querySelectorAll(".cs-card-number-list .text-16"),
        ),
      },
      {
        target: card.querySelector(".cs-card-bottom-title .h1"),
        sources: Array.from(
          rail.querySelectorAll(".cs-card-bottom-title-list .h1"),
        ),
      },
    ];

    // Elements managed by dynamic sequence
    const sequenceTargets = textSequences
      .map(({ target }) => target)
      .filter(Boolean);

    const ctx = gsap.context(() => {
      // =================================
      // INITIAL STATES
      // =================================

      gsap.set(card, {
        height: "7.125em",
      });

      // gsap.set(imgList, {
      //   clipPath: "inset(50% 0% 50% 0%)",
      // });

      if (imgWrap) {
        gsap.set(imgWrap, {
          clipPath: "inset(100% 0% 0% 0%)",
        });
      }

      gsap.set(imageSequences.map((images) => images[0]).filter(Boolean), {
        clipPath: "inset(0% 0% 0% 0%)",
      });

      gsap.set(
        imageSequences.flatMap((images) => images.slice(1, 4)),
        {
          clipPath: "inset(100% 0% 0% 0%)",
        },
      );
      gsap.set(parallaxImages, { yPercent: 15 });

      // =================================
      // SPLIT HEAD
      // =================================

      card.querySelectorAll("[data-fd-head]").forEach((el) => {
        const split = new SplitText(el, {
          type: "lines",
          mask: "lines",
        });

        splitInstances.push(split);
        headLines.push(...split.lines);
      });

      // =================================
      // SPLIT REGULAR TEXT
      // Exclude dynamic sequence targets
      // =================================

      card.querySelectorAll("[data-fd-text]").forEach((el) => {
        const isSequenceTarget = sequenceTargets.some(
          (target) =>
            el === target || el.contains(target) || target.contains(el),
        );

        if (isSequenceTarget) return;

        const split = new SplitText(el, {
          type: "lines",
          mask: "lines",
        });

        splitInstances.push(split);
        textLines.push(...split.lines);
      });

      // Initial states
      gsap.set(headLines, {
        yPercent: 0,
      });

      gsap.set(textLines, {
        yPercent: 100,
      });

      // =================================
      // MAIN TIMELINE
      // =================================

      const progress = { value: 0 };

      const tl = gsap.timeline({
        defaults: {
          ease: "none",
        },

        scrollTrigger: {
          trigger: rail,
          start: "top top",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      // Fixed timeline duration: 5 units
      tl.to(
        progress,
        {
          value: 4,
          duration: 4,
        },
        0,
      );

      // =================================
      // STAGE 1 — 0% to 20%
      // INITIAL REVEAL
      // =================================

      tl.to(
        card,
        {
          height: "47.625em",
          backgroundColor: "white",
          duration: 1,
        },
        0,
      );

      tl.fromTo(
        imgList,
        {
          clipPath: "inset(50% 0% 50% 0%)",
        },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1,
        },
        0,
      );

      if (imgWrap) {
        tl.fromTo(
          imgWrap,
          {
            clipPath: "inset(100% 0% 0% 0%)",
          },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1,
          },
          0,
        );
      }

      imageSequences.forEach((images) => {
        images.forEach((group, index) => {
          if (index > 0) {
            tl.to(
              group,
              {
                clipPath: "inset(0% 0% 0% 0%)",
                duration: 1,
              },
              index,
            );
          }

          const image = group.querySelector("img");
          if (!image) return;

          tl.to(
            image,
            {
              yPercent: 0,
              duration: 1,
            },
            index,
          ).to(
            image,
            {
              yPercent: -15,
              duration: 1,
            },
            index + 1,
          );
        });
      });

      // =================================
      // DYNAMIC TEXT SEQUENCES
      // =================================

      textSequences.forEach(({ target, sources }) => {
        const animateToStage = addSplitTextSequence({
          target,
          sources,
          splitInstances,
          cleanups: sequenceCleanups,
          duration: 0.8,
        });

        if (animateToStage) stageAnimations.push(animateToStage);
      });

      let activeStage = 0;

      tl.eventCallback("onUpdate", () => {
        const stage = Math.max(
          0,
          Math.min(4, Math.floor(progress.value + 0.5)),
        );

        if (stage === activeStage) return;

        activeStage = stage;

        if (headLines.length) {
          gsap.to(headLines, {
            yPercent: stage > 0 ? -100 : 0,
            duration: 0.5,
            ease: "power2.out",
            overwrite: "auto",
          });
        }

        if (textLines.length) {
          gsap.to(textLines, {
            yPercent: stage > 0 ? 0 : 100,
            duration: 0.5,
            delay: 0.5,
            ease: "power2.out",
            overwrite: "auto",
          });
        }

        stageAnimations.forEach((animateToStage) => animateToStage(stage - 1));
      });

      // =================================
      // STAGE 2 — 20% to 40%
      // VALUE 1 → VALUE 2
      // =================================

      // Handled by addSplitTextSequence

      // =================================
      // STAGE 3 — 40% to 60%
      // VALUE 2 → VALUE 3
      // =================================

      // Handled by addSplitTextSequence

      // =================================
      // STAGE 4 — 60% to 80%
      // VALUE 3 → VALUE 4
      // =================================

      // Handled by addSplitTextSequence

      // =================================
      // STAGE 5 — 80% to 100%
      // HOLD
      // =================================
    }, rail);

    // =================================
    // CLEANUP
    // =================================

    cleanups.push(() => {
      ctx.revert();

      splitInstances.forEach((split) => {
        split.revert();
      });

      sequenceCleanups.forEach((cleanup) => {
        cleanup();
      });
    });
  });

  ScrollTrigger.refresh();

  return () => {
    cleanups.forEach((cleanup) => cleanup());
    ScrollTrigger.refresh();
  };
}

function initWorkLayoutToggle(container = document) {
  if (!window.gsap) {
    console.error("GSAP is not available for the work layout toggle.");
    return () => {};
  }

  const buttons = container.querySelectorAll("[data-work-layout]");

  const panels = {
    index: container.querySelector(".p_work-inner"),
    gallery: container.querySelector(".p_work-inner-gallery"),
  };

  if (!buttons.length || !panels.index || !panels.gallery) return () => {};

  // Tentukan layout awal berdasarkan button is-active
  const activeButton = [...buttons].find(
    (button) =>
      button.classList.contains("is-active") ||
      button.getAttribute("aria-pressed") === "true",
  );

  let activeLayout =
    activeButton?.dataset.workLayout === "gallery" ? "gallery" : "index";

  let transition;
  const clickHandlers = [];

  // Set initial state
  buttons.forEach((button) => {
    const isActive = button.dataset.workLayout === activeLayout;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  gsap.set(panels.index, {
    display: activeLayout === "index" ? "block" : "none",
    autoAlpha: activeLayout === "index" ? 1 : 0,
    y: 0,
  });

  gsap.set(panels.gallery, {
    display: activeLayout === "gallery" ? "block" : "none",
    autoAlpha: activeLayout === "gallery" ? 1 : 0,
    y: 0,
  });

  // Handle button click
  buttons.forEach((button) => {
    const handleClick = () => {
      const nextLayout = button.dataset.workLayout;

      if (!panels[nextLayout] || nextLayout === activeLayout) return;

      // Stop previous animation
      if (transition) transition.kill();

      const currentPanel = panels[activeLayout];
      const nextPanel = panels[nextLayout];

      // Normalize current and next content
      gsap.set([panels.index, panels.gallery], {
        clearProps: "transform",
      });

      gsap.set(currentPanel, {
        display: "block",
        autoAlpha: 1,
        y: 0,
      });

      gsap.set(nextPanel, {
        display: "none",
        autoAlpha: 0,
        y: 12,
      });

      // Update active button
      buttons.forEach((btn) => {
        const isActive = btn.dataset.workLayout === nextLayout;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
      });

      activeLayout = nextLayout;

      // Animate layout transition
      transition = gsap.timeline({
        onComplete: () => {
          window.ScrollTrigger?.refresh();
        },
      });

      transition
        .to(currentPanel, {
          autoAlpha: 0,
          y: -8,
          duration: 0.2,
          ease: "power2.inOut",
        })
        .set(currentPanel, {
          display: "none",
          y: 0,
        })
        .set(nextPanel, {
          display: "block",
        })
        .to(nextPanel, {
          autoAlpha: 1,
          y: 0,
          duration: 0.35,
          ease: "power3.out",
        });
    };

    button.addEventListener("click", handleClick);
    clickHandlers.push([button, handleClick]);
  });

  window.ScrollTrigger?.refresh();

  return () => {
    if (transition) transition.kill();

    clickHandlers.forEach(([button, handleClick]) => {
      button.removeEventListener("click", handleClick);
    });

    window.ScrollTrigger?.refresh();
  };
}

function initGlobalParallax(root) {
  const wrappers = [
    ...(root.matches?.('[data-parallax="wrapper"]') ? [root] : []),
    ...root.querySelectorAll('[data-parallax="wrapper"]'),
  ];
  const animations = [];

  wrappers.forEach((wrapper) => {
    const targets = Array.from(
      wrapper.querySelectorAll('[data-parallax="target"]'),
    ).filter(
      (target) => target.closest('[data-parallax="wrapper"]') === wrapper,
    );

    if (!targets.length) return;

    const animation = gsap.fromTo(
      targets,
      { yPercent: -15 },
      {
        yPercent: 15,
        ease: "none",
        scrollTrigger: {
          trigger: wrapper,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );

    animations.push(animation);
  });

  return () => {
    animations.forEach((animation) => {
      animation.scrollTrigger?.kill();
      animation.kill();
    });
  };
}

const initializedOverlapSections = new WeakSet();

function initSectionOverlapFull(root = document) {
  if (!window.gsap || !window.ScrollTrigger) {
    console.error("GSAP and ScrollTrigger are required for section overlap.");
    return () => {};
  }

  const gsapApi = window.gsap;
  const scrollTriggerApi = window.ScrollTrigger;
  const cleanups = [];
  const sectionElements = gsapApi.utils.toArray(
    root.querySelectorAll("[data-overlap-full]"),
  );

  sectionElements.forEach((overlapSection) => {
    if (initializedOverlapSections.has(overlapSection)) return;

    const previousSection = overlapSection.previousElementSibling;
    if (!previousSection) return;

    initializedOverlapSections.add(overlapSection);

    let overlay = previousSection.querySelector(
      ":root > .dark-section-overlay",
    );
    const createdOverlay = !overlay;

    if (createdOverlay) {
      overlay = document.createElement("div");
      overlay.className = "dark-section-overlay";
      previousSection.appendChild(overlay);
    }

    const originalSectionStyle = overlapSection.getAttribute("style");
    const originalPreviousStyle = previousSection.getAttribute("style");
    const originalOverlayStyle = overlay.getAttribute("style");
    const originalSectionZIndex = overlapSection.style.zIndex;
    const originalPreviousZIndex = previousSection.style.zIndex;

    gsapApi.set(overlay, { opacity: 0 });

    const timeline = gsapApi.timeline({
      scrollTrigger: {
        trigger: overlapSection,
        start: "top bottom",
        end: "top top",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });

    timeline
      .to(previousSection, {
        y: () => window.innerHeight,
        rotate: 0.001,
        ease: "none",
      })
      .to(
        overlay,
        {
          opacity: 1,
          ease: "none",
        },
        0,
      );

    const zIndexTrigger = scrollTriggerApi.create({
      trigger: overlapSection,
      start: "top bottom",
      end: "top top",
      onEnter: () => {
        gsapApi.set(overlapSection, { zIndex: 5 });
        gsapApi.set(previousSection, { zIndex: 4 });
      },
      onLeaveBack: () => {
        gsapApi.set(overlapSection, {
          zIndex: originalSectionZIndex || "auto",
        });
        gsapApi.set(previousSection, {
          zIndex: originalPreviousZIndex || "auto",
        });
      },
    });

    cleanups.push(() => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
      zIndexTrigger.kill();
      gsapApi.killTweensOf([overlapSection, previousSection, overlay]);

      if (originalSectionStyle === null)
        overlapSection.removeAttribute("style");
      else overlapSection.setAttribute("style", originalSectionStyle);

      if (originalPreviousStyle === null)
        previousSection.removeAttribute("style");
      else previousSection.setAttribute("style", originalPreviousStyle);

      if (originalOverlayStyle === null) overlay.removeAttribute("style");
      else overlay.setAttribute("style", originalOverlayStyle);

      if (createdOverlay) overlay.remove();
      initializedOverlapSections.delete(overlapSection);
    });
  });

  scrollTriggerApi.refresh();

  return () => {
    cleanups.reverse().forEach((cleanup) => cleanup());
  };
}

function initHowRail(root) {
  const rails = [
    ...(root.matches?.(".how-rail") ? [root] : []),
    ...root.querySelectorAll(".how-rail"),
  ];
  const timelines = [];

  rails.forEach((rail) => {
    const head = rail.querySelector(".how-head");
    const cardList = rail.querySelector(".how-card-list");

    if (!head && !cardList) return;

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: rail,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });

    if (head) {
      timeline.fromTo(
        head,
        { opacity: 1 },
        { opacity: 0, duration: 0.4, ease: "none" },
        0,
      );
    }

    if (cardList) {
      timeline.fromTo(
        cardList,
        { xPercent: 0 },
        { xPercent: -100, duration: 1, ease: "none" },
        0,
      );
    }

    timelines.push(timeline);
  });

  return () => {
    timelines.forEach((timeline) => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
    });
  };
}

function initGlobalDiagonalMarquee(root = document) {
  if (!window.gsap || !window.ScrollTrigger) {
    console.error(
      "GSAP and ScrollTrigger are required for the diagonal marquee.",
    );
    return () => {};
  }

  const gsapApi = window.gsap;
  const scrollTriggerApi = window.ScrollTrigger;
  gsapApi.registerPlugin(scrollTriggerApi);

  const marquees = [
    ...(root.matches?.("[data-diagonal-marquee]") ? [root] : []),
    ...root.querySelectorAll("[data-diagonal-marquee]"),
  ];
  const contexts = [];

  marquees.forEach((marquee) => {
    const track = marquee.querySelector(".c_diagonal-marquee-track");
    const panels = track?.querySelectorAll(".c_diagonal-marquee-panel");

    if (!track) return;

    const context = gsapApi.context(() => {
      // Rotate track and counter-rotate each panel
      gsapApi.set(track, {
        rotation: -8,
        transformOrigin: "center center",
      });

      gsapApi.set(panels, {
        rotation: 8,
        transformOrigin: "center center",
      });

      // Scroll-based marquee animation
      gsapApi.fromTo(
        track,
        {
          xPercent: -25,
          yPercent: 12,
        },
        {
          xPercent: 0,
          yPercent: -12,
          ease: "none",
          scrollTrigger: {
            trigger: marquee,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    }, marquee);

    contexts.push(context);
  });

  return () => {
    contexts.reverse().forEach((context) => context.revert());
  };
}

function initDiagonalScroll(root) {
  const marquees = [
    ...(root.matches?.(".diagonal-marquee") ? [root] : []),
    ...root.querySelectorAll(".diagonal-marquee"),
  ];
  const contexts = [];
  const objectRelocations = [];
  const serviceCleanups = [];

  marquees.forEach((marquee) => {
    const context = gsap.context(() => {
      const track = marquee.querySelector(".diagonal-marquee-track");

      if (!track) return;

      const panels = marquee.querySelectorAll(".diagonal-marquee-panel");
      const secondPanel = panels[1];
      const object = secondPanel?.matches("[data-object]")
        ? secondPanel
        : secondPanel?.querySelector("[data-object]");
      const serviceSection = marquee.closest(".service_about-sb");
      const objectWrapper =
        object?.closest("[data-object-wrapper]") ||
        serviceSection?.querySelector("[data-object-wrapper]");
      let placeholder = null;

      const serviceInner = objectWrapper?.querySelector(".service_sb-inner");
      const serviceItems = serviceInner
        ? Array.from(serviceInner.querySelectorAll(".service_sb-item"))
        : [];
      const serviceOverlay = serviceInner?.querySelector(
        ".service_sb-inner-overlay",
      );
      const imageContainer = object?.querySelector(
        ".diagonal-marquee-panel-imgs",
      );
      const serviceImages = imageContainer
        ? Array.from(imageContainer.querySelectorAll("img"))
        : [];
      let isRelocated = false;
      let updateActiveServiceItem = () => {};

      if (serviceInner && serviceItems.length && serviceOverlay) {
        const centerClipPath = "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)";
        const fullClipPath = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
        let overlayBaseHeight = 1;
        let itemMetrics = [];
        let activeServiceIndex = 0;
        let overlayTween = null;
        const imageStack = new Set();
        const imageAnimations = new Set();
        const originalOverlayStyle = serviceOverlay.getAttribute("style");
        const originalImageStyles = serviceImages.map((image) =>
          image.getAttribute("style"),
        );

        const refreshItemMetrics = () => {
          overlayBaseHeight = Math.max(
            ...serviceItems.map((item) => item.offsetHeight),
            1,
          );
          itemMetrics = serviceItems.map((item) => ({
            y: item.offsetTop - serviceOverlay.offsetTop,
            scaleY: item.offsetHeight / overlayBaseHeight,
          }));

          gsap.set(serviceOverlay, {
            height: overlayBaseHeight,
            transformOrigin: "top left",
          });
        };

        refreshItemMetrics();
        gsap.set(serviceImages, {
          clipPath: centerClipPath,
          zIndex: 0,
          willChange: "clip-path",
        });
        if (serviceImages[0]) {
          imageStack.add(serviceImages[0]);
          gsap.set(serviceImages[0], {
            clipPath: fullClipPath,
            zIndex: 1,
          });
        }
        gsap.set(serviceOverlay, itemMetrics[0]);

        const stopImageAnimations = () => {
          imageAnimations.forEach((animation) => animation.kill());
          imageAnimations.clear();
          gsap.killTweensOf(serviceImages, "clipPath");
        };

        const trackImageAnimation = (animation) => {
          imageAnimations.add(animation);
          animation.eventCallback("onComplete", () => {
            imageAnimations.delete(animation);
          });
        };

        const animateImages = (index) => {
          const currentImage = serviceImages[index];
          if (!currentImage) return;

          stopImageAnimations();
          imageStack.delete(currentImage);
          imageStack.add(currentImage);

          let stackOrder = 0;
          imageStack.forEach((image) => {
            gsap.set(image, { zIndex: ++stackOrder });
          });

          gsap.set(currentImage, { clipPath: centerClipPath });

          imageStack.forEach((image) => {
            if (image === currentImage) return;

            const settleTween = gsap.to(image, {
              clipPath: fullClipPath,
              duration: 0.32,
              ease: "power2.out",
              overwrite: "auto",
            });
            trackImageAnimation(settleTween);
          });

          const revealTween = gsap.to(currentImage, {
            clipPath: fullClipPath,
            duration: 0.65,
            ease: "power3.out",
            overwrite: "auto",
          });
          trackImageAnimation(revealTween);
        };

        serviceCleanups.push(() => {
          overlayTween?.kill();
          stopImageAnimations();
          gsap.killTweensOf(serviceOverlay);

          if (originalOverlayStyle === null) {
            serviceOverlay.removeAttribute("style");
          } else {
            serviceOverlay.setAttribute("style", originalOverlayStyle);
          }

          serviceImages.forEach((image, index) => {
            const originalStyle = originalImageStyles[index];
            if (originalStyle === null) image.removeAttribute("style");
            else image.setAttribute("style", originalStyle);
          });
        });

        const activateItem = (index) => {
          if (index === activeServiceIndex) return;

          activeServiceIndex = index;
          const metric = itemMetrics[index];

          overlayTween?.kill();
          overlayTween = gsap.to(serviceOverlay, {
            ...metric,
            duration: 0.5,
            ease: "power2.out",
            overwrite: "auto",
          });

          animateImages(index);
        };

        updateActiveServiceItem = () => {
          if (!object || !isRelocated) return;

          const objectRect = object.getBoundingClientRect();
          const centerX = (objectRect.left + objectRect.right) / 2;
          const centerY = (objectRect.top + objectRect.bottom) / 2;
          const activeIndex = serviceItems.findIndex((item) => {
            const itemRect = item.getBoundingClientRect();
            return (
              centerX >= itemRect.left &&
              centerX <= itemRect.right &&
              centerY >= itemRect.top &&
              centerY <= itemRect.bottom
            );
          });

          if (activeIndex >= 0) activateItem(activeIndex);
        };
      }

      const getCenteredXPercent = () => {
        if (!object) return 19.67;

        const measureElement = placeholder || object;
        const currentXPercent = gsap.getProperty(track, "xPercent");

        gsap.set(track, { xPercent: -20 });
        const startRect = measureElement.getBoundingClientRect();
        gsap.set(track, { xPercent: -19 });
        const nextRect = measureElement.getBoundingClientRect();
        gsap.set(track, { xPercent: currentXPercent });

        const startCenter = (startRect.left + startRect.right) / 2;
        const nextCenter = (nextRect.left + nextRect.right) / 2;
        const centerShiftPerPercent = nextCenter - startCenter;

        if (Math.abs(centerShiftPerPercent) < 0.001) return 19.67;

        return (
          -20 + (window.innerWidth / 2 - startCenter) / centerShiftPerPercent
        );
      };

      gsap.set(marquee, { rotation: -9.33 });
      gsap.set(panels, { rotation: 9.33 });

      const animation = gsap.timeline({
        scrollTrigger: {
          trigger: marquee,
          start: "top bottom",
          end: "+=120% bottom",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      animation.fromTo(
        track,
        {
          xPercent: -20,
          // transformOrigin: "top left",
        },
        {
          xPercent: getCenteredXPercent,
          ease: "none",
        },
        0,
      );

      if (object && objectWrapper && serviceSection) {
        const originalParent = object.parentElement;
        const originalObjectStyle = object.getAttribute("style");
        const originalSectionPosition =
          serviceSection.style.getPropertyValue("position");
        const originalSectionPositionPriority =
          serviceSection.style.getPropertyPriority("position");
        let objectSize = null;
        let relocationTween = null;

        const restoreObject = () => {
          if (!isRelocated) return;
          relocationTween?.kill();
          relocationTween = null;

          if (placeholder?.parentNode) {
            placeholder.parentNode.insertBefore(object, placeholder);
            placeholder.remove();
          } else {
            originalParent.appendChild(object);
          }

          if (originalObjectStyle === null) {
            object.removeAttribute("style");
          } else {
            object.setAttribute("style", originalObjectStyle);
          }

          if (originalSectionPosition) {
            serviceSection.style.setProperty(
              "position",
              originalSectionPosition,
              originalSectionPositionPriority,
            );
          } else {
            serviceSection.style.removeProperty("position");
          }

          isRelocated = false;
        };

        const moveObjectToSection = () => {
          const objectRect = object.getBoundingClientRect();
          const wasRelocated = isRelocated;

          if (!isRelocated) {
            const computedObjectStyle = getComputedStyle(object);
            objectSize = {
              width: computedObjectStyle.width,
              height: computedObjectStyle.height,
              boxSizing: computedObjectStyle.boxSizing,
            };
            placeholder = object.cloneNode(false);
            placeholder.removeAttribute("id");
            placeholder.removeAttribute("data-object");
            placeholder.setAttribute("aria-hidden", "true");
            Object.assign(placeholder.style, {
              width: objectSize.width,
              height: objectSize.height,
              boxSizing: objectSize.boxSizing,
              display: computedObjectStyle.display,
              position: computedObjectStyle.position,
              flex: computedObjectStyle.flex,
              flexBasis: computedObjectStyle.flexBasis,
              gridArea: computedObjectStyle.gridArea,
              alignSelf: computedObjectStyle.alignSelf,
              justifySelf: computedObjectStyle.justifySelf,
              order: computedObjectStyle.order,
              margin: computedObjectStyle.margin,
              minWidth: computedObjectStyle.minWidth,
              minHeight: computedObjectStyle.minHeight,
              maxWidth: computedObjectStyle.maxWidth,
              maxHeight: computedObjectStyle.maxHeight,
              visibility: "hidden",
              pointerEvents: "none",
            });

            originalParent.insertBefore(placeholder, object);
            serviceSection.appendChild(object);
            isRelocated = true;
          }

          if (getComputedStyle(serviceSection).position === "static") {
            gsap.set(serviceSection, { position: "relative" });
          }

          const sectionRect = serviceSection.getBoundingClientRect();
          const currentX = Number(gsap.getProperty(object, "x")) || 0;
          const currentY = Number(gsap.getProperty(object, "y")) || 0;
          const objectWidth =
            Number.parseFloat(objectSize.width) ||
            object.offsetWidth ||
            objectRect.width;
          const objectHeight =
            Number.parseFloat(objectSize.height) ||
            object.offsetHeight ||
            objectRect.height;
          const targetTop =
            window.innerHeight / 2 -
            objectHeight / 2 -
            sectionRect.top -
            serviceSection.clientTop -
            currentY;
          const targetLeft =
            window.innerWidth / 2 -
            objectWidth / 2 -
            sectionRect.left -
            serviceSection.clientLeft -
            currentX;
          const positionStyles = {
            position: "absolute",
            width: objectSize.width,
            height: objectSize.height,
            boxSizing: objectSize.boxSizing,
            margin: 0,
            x: currentX,
            y: currentY,
            xPercent: 0,
            yPercent: 0,
            rotation: 0,
          };

          if (!wasRelocated) {
            const initialTop =
              (objectRect.top + objectRect.bottom) / 2 -
              objectHeight / 2 -
              sectionRect.top -
              serviceSection.clientTop -
              currentY;
            const initialLeft =
              (objectRect.left + objectRect.right) / 2 -
              objectWidth / 2 -
              sectionRect.left -
              serviceSection.clientLeft -
              currentX;

            gsap.set(object, {
              ...positionStyles,
              top: `${initialTop}px`,
              left: `${initialLeft}px`,
            });
          }

          relocationTween?.kill();
          relocationTween = gsap.to(object, {
            top: `${targetTop}px`,
            left: `${targetLeft}px`,
            duration: 0.55,
            ease: "power3.out",
            overwrite: "auto",
            onUpdate: updateActiveServiceItem,
          });

          updateActiveServiceItem();
        };

        const objectAnimation = gsap.to(object, {
          y: () =>
            Math.max(
              0,
              objectWrapper.getBoundingClientRect().bottom +
                window.scrollY -
                animation.scrollTrigger.end,
            ),
          ease: "none",
          onUpdate: updateActiveServiceItem,
          scrollTrigger: {
            trigger: objectWrapper,
            start: () => animation.scrollTrigger.end,
            endTrigger: objectWrapper,
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
            onEnter: moveObjectToSection,
            onEnterBack: moveObjectToSection,
            onLeaveBack: restoreObject,
            onRefresh(self) {
              if (self.isActive || self.progress > 0) {
                moveObjectToSection();
                updateActiveServiceItem();
              }
            },
          },
        });

        if (
          objectAnimation.scrollTrigger.isActive ||
          objectAnimation.scrollTrigger.progress > 0
        ) {
          moveObjectToSection();
        }
        objectRelocations.push(restoreObject);
      }
    }, marquee);

    contexts.push(context);
  });

  return () => {
    serviceCleanups.reverse().forEach((cleanup) => cleanup());
    contexts.reverse().forEach((context) => context.revert());
    objectRelocations.reverse().forEach((restore) => restore());
  };
}

function initTestimoniSwiper(root) {
  const sliders = [
    ...(root.matches?.(".swiper.is-testimoni") ? [root] : []),
    ...root.querySelectorAll(".swiper.is-testimoni"),
  ];

  if (!sliders.length) return () => {};

  if (typeof window.Swiper !== "function") {
    console.error("Swiper is not available on the page.");
    return () => {};
  }

  const cleanups = sliders.map((slider) => {
    const controlsRoot = slider.parentElement || root;
    const nextEl = controlsRoot.querySelector(".swiper-btn-next");
    const prevEl = controlsRoot.querySelector(".swiper-btn-prev");
    const currentEl = controlsRoot.querySelector("[data-testi-current]");
    const totalEl = controlsRoot.querySelector("[data-testi-total]");
    const targetEl =
      controlsRoot.querySelector("[data-testi-target]") ||
      root.querySelector("[data-testi-target]");
    const slideTexts = Array.from(slider.querySelectorAll(".swiper-slide")).map(
      (slide) =>
        slide.querySelector("[data-testi-text]")?.textContent.trim() ?? "",
    );

    if (!nextEl || !prevEl) {
      console.warn("Testimonial Swiper navigation buttons were not found.");
    }

    const swiper = new window.Swiper(slider, {
      slidesPerView: "auto",
      slidesPerGroup: 1,
      spaceBetween: 24,
      loop: false,
      ...(nextEl && prevEl
        ? {
            navigation: {
              nextEl,
              prevEl,
            },
          }
        : {}),
    });

    let activeText = null;
    let textAnimation = null;
    let textSplit = null;

    const clearTextAnimation = () => {
      textAnimation?.kill();
      textAnimation = null;
      textSplit?.revert();
      textSplit = null;
    };

    const updateTestimoniText = (index, animate = true) => {
      if (!targetEl) return;

      const nextText = slideTexts[index] ?? "";
      if (nextText === activeText) return;

      activeText = nextText;
      clearTextAnimation();

      if (!animate || !targetEl.textContent.trim() || !nextText) {
        targetEl.textContent = nextText;
        return;
      }

      const outgoingSplit = SplitText.create(targetEl, {
        type: "lines",
        mask: "lines",
      });
      textSplit = outgoingSplit;

      textAnimation = gsap.to(outgoingSplit.lines, {
        yPercent: -100,
        duration: 0.35,
        ease: "power3.in",
        onComplete() {
          if (textSplit !== outgoingSplit) return;

          outgoingSplit.revert();
          textSplit = null;
          targetEl.textContent = nextText;

          const incomingSplit = SplitText.create(targetEl, {
            type: "lines",
            mask: "lines",
          });
          textSplit = incomingSplit;

          gsap.set(incomingSplit.lines, {
            yPercent: 100,
          });

          textAnimation = gsap.to(incomingSplit.lines, {
            yPercent: 0,
            duration: 0.45,
            ease: "power3.out",
            onComplete() {
              if (textSplit !== incomingSplit) return;

              incomingSplit.revert();
              textSplit = null;
              textAnimation = null;
            },
          });
        },
      });
    };

    const updateCounters = () => {
      if (currentEl) {
        currentEl.textContent = String(swiper.realIndex + 1).padStart(2, "0");
      }

      if (totalEl) {
        totalEl.textContent = String(swiper.slides.length).padStart(2, "0");
      }
    };

    const updateSlideContent = () => {
      updateCounters();
      updateTestimoniText(swiper.realIndex);
    };

    const updateTrailingOffset = () => {
      if (swiper.destroyed || !swiper.slidesSizesGrid.length) return;

      const lastSlideSize =
        swiper.slidesSizesGrid[swiper.slidesSizesGrid.length - 1];
      const trailingOffset = Math.max(swiper.size - lastSlideSize, 0);

      if (
        Math.abs((swiper.params.slidesOffsetAfter || 0) - trailingOffset) < 1
      ) {
        return;
      }

      swiper.params.slidesOffsetAfter = trailingOffset;
      swiper.update();
    };

    swiper.on("slideChange", updateSlideContent);
    updateCounters();
    updateTestimoniText(swiper.realIndex, false);
    updateTrailingOffset();

    if (window.ResizeObserver) {
      const resizeObserver = new window.ResizeObserver(updateTrailingOffset);
      resizeObserver.observe(slider);

      const lastSlide = swiper.slides[swiper.slides.length - 1];
      if (lastSlide) resizeObserver.observe(lastSlide);

      return () => {
        resizeObserver.disconnect();
        swiper.off("slideChange", updateSlideContent);
        clearTextAnimation();
        swiper.destroy(true, true);
      };
    }

    window.addEventListener("resize", updateTrailingOffset);

    return () => {
      window.removeEventListener("resize", updateTrailingOffset);
      swiper.off("slideChange", updateSlideContent);
      clearTextAnimation();
      swiper.destroy(true, true);
    };
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}

function initCurated(
  root,
  { includeFlipbookPages = false, item: itemOverride = null } = {},
) {
  const getCssDimension = (element, property, offsetProperty) => {
    const dimension = Number.parseFloat(
      window.getComputedStyle(element)[property],
    );
    return Number.isFinite(dimension) ? dimension : element[offsetProperty];
  };
  const wrappers = itemOverride
    ? [root]
    : [
        ...(root.matches?.('[data-curated="wrapper"]') ? [root] : []),
        ...root.querySelectorAll('[data-curated="wrapper"]'),
      ];
  const contexts = [];

  wrappers.forEach((wrapper) => {
    const item =
      itemOverride ||
      Array.from(wrapper.querySelectorAll('[data-curated="item"]')).find(
        (element) => element.closest('[data-curated="wrapper"]') === wrapper,
      );
    const target = Array.from(
      wrapper.querySelectorAll('[data-curated="target"]'),
    ).find(
      (element) => element.closest('[data-curated="wrapper"]') === wrapper,
    );
    const image = target?.querySelector('[data-curated="img"]');

    if (!item || !target || !image) {
      console.warn(
        "Curated wrapper must contain an item, target, and target image.",
        wrapper,
      );
      return;
    }

    if (!includeFlipbookPages && item.closest("[data-flipbook-page]")) {
      return;
    }

    const itemRect = item.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();

    if (
      !itemRect.width ||
      !itemRect.height ||
      !imageRect.width ||
      !imageRect.height
    ) {
      console.warn(
        "Curated item and image must have measurable dimensions.",
        wrapper,
      );
      return;
    }

    const sourceX = Number(gsap.getProperty(item, "x")) || 0;
    const sourceY = Number(gsap.getProperty(item, "y")) || 0;
    const sourceWidth = getCssDimension(item, "width", "offsetWidth");
    const sourceHeight = getCssDimension(item, "height", "offsetHeight");
    const getFitTransform = () => {
      const currentItemRect = item.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      const currentX = Number(gsap.getProperty(item, "x")) || 0;
      const currentY = Number(gsap.getProperty(item, "y")) || 0;
      const currentWidth = getCssDimension(item, "width", "offsetWidth");
      const currentHeight = getCssDimension(item, "height", "offsetHeight");
      const widthScale = currentWidth
        ? currentItemRect.width / currentWidth
        : 1;
      const heightScale = currentHeight
        ? currentItemRect.height / currentHeight
        : 1;
      const targetWidth = imageRect.width / widthScale;
      const targetHeight = imageRect.height / heightScale;
      const parent = item.parentElement;
      const parentRect = parent?.getBoundingClientRect();
      const translationScaleX =
        parent && parent.offsetWidth
          ? parentRect.width / parent.offsetWidth || 1
          : 1;
      const translationScaleY =
        parent && parent.offsetHeight
          ? parentRect.height / parent.offsetHeight || 1
          : 1;

      const restoreStyleProperty = (property, value, priority) => {
        if (value) item.style.setProperty(property, value, priority);
        else item.style.removeProperty(property);
      };
      const originalWidth = item.style.getPropertyValue("width");
      const originalWidthPriority = item.style.getPropertyPriority("width");
      const originalHeight = item.style.getPropertyValue("height");
      const originalHeightPriority = item.style.getPropertyPriority("height");
      const originalTransition = item.style.getPropertyValue("transition");
      const originalTransitionPriority =
        item.style.getPropertyPriority("transition");
      let fittedRect;

      item.style.setProperty("transition", "none", "important");
      try {
        item.style.setProperty("width", `${targetWidth}px`, "important");
        item.style.setProperty("height", `${targetHeight}px`, "important");
        gsap.set(item, { x: sourceX, y: sourceY });
        fittedRect = item.getBoundingClientRect();
      } finally {
        restoreStyleProperty("width", originalWidth, originalWidthPriority);
        restoreStyleProperty("height", originalHeight, originalHeightPriority);
        restoreStyleProperty(
          "transition",
          originalTransition,
          originalTransitionPriority,
        );
        gsap.set(item, { x: currentX, y: currentY });
      }

      return {
        x: sourceX + (imageRect.left - fittedRect.left) / translationScaleX,
        y: sourceY + (imageRect.top - fittedRect.top) / translationScaleY,
        width: targetWidth,
        height: targetHeight,
      };
    };

    const context = gsap.context(() => {
      gsap.fromTo(
        item,
        {
          x: sourceX,
          y: sourceY,
          width: sourceWidth,
          height: sourceHeight,
        },
        {
          x: () => getFitTransform().x,
          y: () => getFitTransform().y,
          width: () => getFitTransform().width,
          height: () => getFitTransform().height,
          ease: "none",
          scrollTrigger: {
            trigger: target,
            start: "top bottom",
            end: "bottom bottom",
            scrub: true,
            // Avoid measuring the destination while a flipbook page is rotating.
            invalidateOnRefresh: !includeFlipbookPages,
          },
        },
      );
    }, wrapper);

    contexts.push(context);
  });

  return () => {
    contexts.reverse().forEach((context) => context.revert());
  };
}

function initServiceAccordion(root) {
  const lists = [
    ...(root.matches?.(".services-list") ? [root] : []),
    ...root.querySelectorAll(".services-list"),
  ];
  const contexts = [];
  const listenerCleanups = [];
  const imageTweenCleanups = [];
  const splits = [];
  let active = true;
  let refreshFrame = 0;

  const scheduleScrollTriggerRefresh = () => {
    if (!active || refreshFrame) return;

    refreshFrame = requestAnimationFrame(() => {
      refreshFrame = 0;
      if (!active) return;

      ScrollTrigger?.getAll().forEach((scrollTrigger) => {
        if (
          scrollTrigger.trigger?.closest?.(
            '[data-curated="wrapper"], .team-rail',
          )
        ) {
          return;
        }

        scrollTrigger.refresh();
      });
    });
  };

  lists.forEach((list) => {
    const items = Array.from(list.querySelectorAll(".service-item"));
    const servicesWrapper =
      list.closest(".services-wrapper") || list.parentElement;
    const imagesWrapper = root.querySelector(".services-images");
    const images = imagesWrapper
      ? Array.from(imagesWrapper.querySelectorAll("img"))
      : [];
    const hiddenClipPath = "inset(0% 0% 100% 0%)";
    const visibleClipPath = "inset(0% 0% 0% 0%)";
    let activeItem = null;
    let imageTween = null;

    if (!imagesWrapper) {
      console.warn("Service accordion images wrapper was not found.", list);
    } else if (images.length !== items.length) {
      console.warn(
        "Service accordion item and image counts do not match.",
        list,
      );
    }

    const animateImage = (activeIndex) => {
      if (!images.length) return;

      imageTween?.kill();
      imageTween = gsap.to(images, {
        clipPath: (imageIndex) =>
          imageIndex === activeIndex ? visibleClipPath : hiddenClipPath,
        duration: 0.45,
        ease: "power2.inOut",
        overwrite: "auto",
      });
    };

    const context = gsap.context(() => {
      gsap.set(images, { clipPath: hiddenClipPath });
      if (images[0]) gsap.set(images[0], { clipPath: visibleClipPath });

      items.forEach((item, index) => {
        const head = item.querySelector(".service-item-head");
        const heading = head?.querySelector(".h1");
        const number = head?.querySelector(".text-14");
        const text = item.querySelector(".text-16");
        const content = item.querySelector(".service-item-content");

        if (!head || !content) {
          console.warn(
            "Service accordion item is missing its head or content.",
            item,
          );
          return;
        }

        const entry = {
          content,
          isOpen: false,
          lines: [],
          split: null,
          timeline: null,
        };

        if (heading) gsap.set(heading, { opacity: 0.2 });
        if (number) gsap.set(number, { opacity: 0.5 });

        // gsap.set(content, {
        //   height: 0,
        //   overflow: "hidden",
        // });

        if (text) {
          entry.split = SplitText.create(text, {
            type: "lines",
            mask: "lines",
            onSplit(self) {
              entry.lines = self.lines;
              gsap.set(entry.lines, {
                yPercent: entry.isOpen ? 0 : -100,
              });
            },
          });
          splits.push(entry.split);
        }

        const timeline = gsap.timeline({
          paused: true,
          onComplete: scheduleScrollTriggerRefresh,
          onReverseComplete: scheduleScrollTriggerRefresh,
        });

        if (heading) {
          timeline.to(
            heading,
            { opacity: 1, duration: 0.3, ease: "power2.inOut" },
            0,
          );
        }

        if (number) {
          timeline.to(
            number,
            { opacity: 1, duration: 0.3, ease: "power2.inOut" },
            0,
          );
        }

        timeline.to(
          content,
          {
            height: "auto",
            duration: 0.3,
            ease: "power2.inOut",
            onComplete: () => gsap.set(content, { clearProps: "overflow" }),
          },
          0,
        );

        if (entry.lines.length) {
          timeline.to(
            entry.lines,
            {
              yPercent: 0,
              duration: 0.3,
              ease: "power2.inOut",
            },
            0,
          );
        }

        entry.timeline = timeline;

        const onClick = () => {
          if (activeItem === entry) return;

          if (activeItem) {
            activeItem.isOpen = false;
            gsap.set(activeItem.content, { overflow: "hidden" });
            activeItem.timeline.reverse();
          }

          activeItem = entry;
          entry.isOpen = true;
          gsap.set(content, { overflow: "hidden" });
          timeline.play();
          animateImage(index);
        };

        head.addEventListener("click", onClick);
        listenerCleanups.push(() => head.removeEventListener("click", onClick));

        if (item === items[0]) onClick();
      });
    }, list);

    imageTweenCleanups.push(() => imageTween?.kill());
    contexts.push(context);
  });

  return () => {
    active = false;
    cancelAnimationFrame(refreshFrame);
    listenerCleanups.reverse().forEach((cleanup) => cleanup());
    imageTweenCleanups.reverse().forEach((cleanup) => cleanup());
    contexts.reverse().forEach((context) => context.revert());
    splits.reverse().forEach((split) => split.revert());
  };
}

function initServicesTrail(root = document) {
  const heroes = [
    ...(root.matches?.("[data-service-trail]") ? [root] : []),
    ...root.querySelectorAll("[data-service-trail]"),
  ];

  const cleanups = [];

  // Configuration
  const MAX_IMAGES = 6;
  const MOVE_THRESHOLD = 55;

  // Clip path states
  const CLIP_CLOSED = "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)";

  const CLIP_OPEN = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";

  heroes.forEach((hero) => {
    const trailRoot = hero.querySelector(".hero-services-trail");

    if (!trailRoot) return;

    // Get CMS images
    const sourceImages = gsap.utils.toArray(
      trailRoot.querySelectorAll(
        ".services-trail-list .services-trail-item img",
      ),
    );

    if (!sourceImages.length) return;

    // Ensure CMS images are loaded
    sourceImages.forEach((image) => {
      image.loading = "eager";
    });

    // Create dynamic stage
    const stage = document.createElement("div");
    stage.className = "services-trail-stage";

    trailRoot.appendChild(stage);

    // State
    let activeItems = [];
    let sourceIndex = 0;

    let isInside = false;
    let exitTween = null;

    let lastPointer = null;
    let lastMoveSpawnPoint = null;

    const pointer = {
      x: 0,
      y: 0,
      dirX: 0,
      dirY: 0,
      angle: 0,
    };

    // ------------------------------------------------
    // UPDATE POINTER POSITION AND DIRECTION
    // ------------------------------------------------

    function updatePointer(e) {
      const rect = stage.getBoundingClientRect();

      const point = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      let distance = 0;

      if (lastPointer) {
        const dx = point.x - lastPointer.x;
        const dy = point.y - lastPointer.y;

        distance = Math.hypot(dx, dy);

        if (distance > 0.5) {
          pointer.dirX = dx / distance;
          pointer.dirY = dy / distance;

          let angle = Math.atan2(dy, dx) * (180 / Math.PI);

          // Normalize image orientation
          if (angle > 90) angle -= 180;
          if (angle < -90) angle += 180;

          pointer.angle = angle;
        }
      }

      pointer.x = point.x;
      pointer.y = point.y;

      lastPointer = point;

      return {
        point,
        distance,
      };
    }

    // ------------------------------------------------
    // UPDATE STACK ORDER
    // Oldest image = bottom
    // Newest image = top
    // ------------------------------------------------

    function updateStackOrder() {
      activeItems.forEach((item, index) => {
        item.style.zIndex = index + 1;
      });
    }

    // ------------------------------------------------
    // CREATE IMAGE ELEMENT
    // ------------------------------------------------

    function createTrailItem() {
      const source = sourceImages[sourceIndex % sourceImages.length];

      sourceIndex++;

      const item = document.createElement("div");
      item.className = "services-trail-image";

      const image = source.cloneNode(true);

      image.removeAttribute("id");
      image.setAttribute("alt", "");
      image.setAttribute("aria-hidden", "true");

      image.loading = "eager";
      image.draggable = false;

      const imageSrc =
        source.currentSrc ||
        source.getAttribute("src") ||
        source.getAttribute("data-src");

      if (imageSrc) {
        image.src = imageSrc;
      }

      item.appendChild(image);
      stage.appendChild(item);

      const stackIndex = activeItems.length;

      // Perpendicular direction for stack spreading
      const hasDirection = Math.hypot(pointer.dirX, pointer.dirY) > 0.1;

      const perpX = hasDirection ? -pointer.dirY : 0.7;
      const perpY = hasDirection ? pointer.dirX : 0.7;

      const spread = stackIndex * 5;

      // Position slightly behind cursor
      const x = pointer.x - pointer.dirX * 20 + perpX * spread;

      const y = pointer.y - pointer.dirY * 20 + perpY * spread;

      // Rotation follows cursor direction
      const directionRotation = gsap.utils.clamp(-12, 12, pointer.angle * 0.12);

      const stackRotation = (stackIndex - 2.5) * 1.2;

      gsap.set(item, {
        x,
        y,
        xPercent: -50,
        yPercent: -50,

        rotation: directionRotation + stackRotation,

        scale: 0.92,
        opacity: 1,

        clipPath: CLIP_CLOSED,

        zIndex: stackIndex + 1,
      });

      activeItems.push(item);

      updateStackOrder();

      return item;
    }

    // ------------------------------------------------
    // REVEAL NEW IMAGE
    // ------------------------------------------------

    function revealImage(item) {
      gsap.to(item, {
        clipPath: CLIP_OPEN,
        scale: 1,

        duration: 0.6,
        ease: "power3.out",

        overwrite: true,
      });
    }

    // ------------------------------------------------
    // REMOVE OLDEST AND SPAWN NEW IMAGE
    // Maximum 6 images
    // ------------------------------------------------

    function spawnImage() {
      if (!isInside) return;

      if (activeItems.length >= MAX_IMAGES) {
        // Get the oldest image from the stack
        const oldest = activeItems.shift();

        // Stop any ongoing animation while preserving current state
        gsap.killTweensOf(oldest);

        // Update stacking order of remaining images
        updateStackOrder();

        // Animate oldest image closing before removing it
        gsap.to(oldest, {
          clipPath: CLIP_CLOSED,
          scale: 0.9,

          duration: 0.45,
          ease: "power2.inOut",

          overwrite: true,

          // Remove only after closing animation completes
          onComplete: () => {
            oldest.remove();
          },
        });
      }

      // Create and reveal the new image
      const item = createTrailItem();

      revealImage(item);
    }

    // ------------------------------------------------
    // INITIAL STACK
    // Stagger from bottom to top
    // ------------------------------------------------

    function showInitialStack() {
      const initialCount = Math.min(MAX_IMAGES, sourceImages.length);

      const initialItems = [];

      for (let i = 0; i < initialCount; i++) {
        initialItems.push(createTrailItem());
      }

      gsap.to(initialItems, {
        clipPath: CLIP_OPEN,
        scale: 1,

        duration: 0.65,
        ease: "power3.out",

        stagger: {
          each: 0.08,
          from: "start",
        },

        overwrite: true,
      });
    }

    // ------------------------------------------------
    // CLEAR EXISTING IMAGES
    // ------------------------------------------------

    function clearStage() {
      stage.querySelectorAll(".services-trail-image").forEach((item) => {
        gsap.killTweensOf(item);
        item.remove();
      });

      activeItems.length = 0;
    }

    // ------------------------------------------------
    // POINTER ENTER
    // ------------------------------------------------

    function handlePointerEnter(e) {
      if (e.pointerType === "touch") return;

      // Stop previous exit animation
      exitTween?.kill();
      exitTween = null;

      clearStage();

      isInside = true;

      // Reset pointer tracking
      lastPointer = null;
      lastMoveSpawnPoint = null;
      lastMoveSpawnAt = 0;

      updatePointer(e);

      lastMoveSpawnPoint = {
        x: pointer.x,
        y: pointer.y,
      };

      // Show initial stack
      showInitialStack();
    }

    // ------------------------------------------------
    // POINTER MOVE
    // ------------------------------------------------

    
function handlePointerMove(e) {
  if (e.pointerType === "touch") return;

  if (!isInside) {
    handlePointerEnter(e);
    return;
  }

  const { point } = updatePointer(e);

  if (!lastMoveSpawnPoint) {
    lastMoveSpawnPoint = point;
    return;
  }

  const origin = lastMoveSpawnPoint;

  const dx = point.x - origin.x;
  const dy = point.y - origin.y;

  const distance = Math.hypot(dx, dy);

  // Wait until the fixed spawn distance is reached
  if (distance < MOVE_THRESHOLD) return;

  // Calculate how many images should be spawned
  const spawnCount = Math.floor(distance / MOVE_THRESHOLD);

  // Spawn images at evenly spaced positions
  for (let i = 1; i <= spawnCount; i++) {
    const traveled = MOVE_THRESHOLD * i;
    const progress = traveled / distance;

    pointer.x = origin.x + dx * progress;
    pointer.y = origin.y + dy * progress;

    spawnImage();
  }

  // Preserve remaining distance for the next movement
  const consumedDistance = spawnCount * MOVE_THRESHOLD;
  const progress = consumedDistance / distance;

  lastMoveSpawnPoint = {
    x: origin.x + dx * progress,
    y: origin.y + dy * progress,
  };

  // Restore actual pointer position
  pointer.x = point.x;
  pointer.y = point.y;
}

    // ------------------------------------------------
    // POINTER LEAVE
    // ------------------------------------------------

    function handlePointerLeave() {
      if (!isInside) return;

      isInside = false;

      lastPointer = null;
      lastMoveSpawnPoint = null;

      // Get all active images
      const leavingItems = [...activeItems];

      activeItems.length = 0;

      if (!leavingItems.length) return;

      // Stop previous exit animation if any
      exitTween?.kill();
      exitTween = null;

      // Kill ongoing reveal animations
      // Preserve current rendered clip-path
      leavingItems.forEach((item) => {
        gsap.killTweensOf(item);
      });

      // Animate closing
      exitTween = gsap.timeline({
        onComplete: () => {
          leavingItems.forEach((item) => {
            gsap.killTweensOf(item);
            item.remove();
          });

          exitTween = null;
        },
      });

      exitTween.to(leavingItems, {
        clipPath: CLIP_CLOSED,
        scale: 0.9,

        duration: 0.45,
        ease: "power2.inOut",

        stagger: {
          each: 0.06,
          from: "end",
        },

        overwrite: "auto",
      });
    }

    // ------------------------------------------------
    // EVENT LISTENERS
    // ------------------------------------------------

    hero.addEventListener("pointerenter", handlePointerEnter);

    hero.addEventListener("pointermove", handlePointerMove);

    hero.addEventListener("pointerleave", handlePointerLeave);

    // ------------------------------------------------
    // CLEANUP
    // ------------------------------------------------

    cleanups.push(() => {
      isInside = false;

      hero.removeEventListener("pointerenter", handlePointerEnter);

      hero.removeEventListener("pointermove", handlePointerMove);

      hero.removeEventListener("pointerleave", handlePointerLeave);

      stopAutoLoop();

      exitTween?.kill();
      exitTween = null;

      clearStage();

      stage.remove();
    });
  });

  // Return cleanup function for Barba
  return () => {
    cleanups.forEach((cleanup) => cleanup());
    cleanups.length = 0;
  };
}

function initTeamScroll(root) {
  const rails = [
    ...(root.matches?.(".team-rail") ? [root] : []),
    ...root.querySelectorAll(".team-rail"),
  ];
  const contexts = [];
  const listenerCleanups = [];

  rails.forEach((rail) => {
    const background = rail.querySelector(".team-bg");
    const text = rail.querySelector(".team-content-text-wrap");
    const images = rail.querySelector(".team-content-imgs");

    if (!background && !text && !images) {
      console.warn(
        "Team rail has no background, content text, or images.",
        rail,
      );
      return;
    }

    let moveImagesToX;
    const context = gsap.context(() => {
      if (background) {
        gsap.set(background, {
          scale: 0.8,
          transformOrigin: "bottom center",
        });
        gsap.fromTo(
          background,
          { scale: 0.8 },
          {
            scale: 1,
            transformOrigin: "bottom center",
            ease: "none",
            scrollTrigger: {
              trigger: rail,
              start: "top bottom",
              end: "+=5% top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );

        gsap.fromTo(
          background,
          { scale: 1 },
          {
            scale: 0.8,
            transformOrigin: "top center",
            ease: "none",
            immediateRender: false,
            scrollTrigger: {
              trigger: rail,
              start: "bottom bottom",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      }

      if (images) {
        gsap.set(images, { xPercent: 0 });
        moveImagesToX = gsap.quickTo(images, "xPercent", {
          duration: 0.4,
          ease: "power3.out",
          overwrite: "auto",
        });
      }

      if (text) {
        gsap.set(text, { opacity: 1 });
        gsap.fromTo(
          text,
          { opacity: 1 },
          {
            opacity: 0,
            ease: "none",
            immediateRender: false,
            scrollTrigger: {
              trigger: rail,
              start: "bottom bottom",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      }
    }, rail);

    if (images) {
      const handlePointerMove = (event) => {
        if (event.pointerType === "touch" || !moveImagesToX) return;

        const bounds = rail.getBoundingClientRect();
        if (!bounds.width) return;

        const progress = gsap.utils.clamp(
          0,
          1,
          (event.clientX - bounds.left) / bounds.width,
        );
        moveImagesToX(progress * 10 - 5);
      };
      const handlePointerLeave = () => moveImagesToX?.(0);

      rail.addEventListener("pointermove", handlePointerMove);
      rail.addEventListener("pointerleave", handlePointerLeave);
      listenerCleanups.push(() => {
        rail.removeEventListener("pointermove", handlePointerMove);
        rail.removeEventListener("pointerleave", handlePointerLeave);
        gsap.killTweensOf(images);
      });
    }

    contexts.push(context);
  });

  return () => {
    listenerCleanups.reverse().forEach((cleanup) => cleanup());
    contexts.reverse().forEach((context) => context.revert());
  };
}

function initScrollAnimations(container) {
  if (!container) return () => {};

  const cleanups = [
    initLineReveal(container),
    initLineRevealOpacity(container),
    initStaggerReveal(container),
    initPeopleItemAnimation(container),
    initWTAScale(container),
    initWTARunning(container),
    initDisciplinesRunning(container),
    initCsSpacer(container),
    initDisciplineScroll(container),
    initGlobalParallax(container),
    initCurated(container),
    initServiceAccordion(container),
    initTeamScroll(container),
    initHowRail(container),
    initDiagonalScroll(container),
  ];

  let active = true;
  const refreshScrollTriggers = () => {
    if (active) ScrollTrigger?.refresh();
  };
  const pendingImages = Array.from(container.querySelectorAll("img")).filter(
    (image) => !image.complete,
  );
  const refreshFrame = requestAnimationFrame(refreshScrollTriggers);

  pendingImages.forEach((image) => {
    image.addEventListener("load", refreshScrollTriggers);
    image.addEventListener("error", refreshScrollTriggers);
  });

  document.fonts?.ready.then(refreshScrollTriggers);

  return () => {
    active = false;
    cancelAnimationFrame(refreshFrame);

    pendingImages.forEach((image) => {
      image.removeEventListener("load", refreshScrollTriggers);
      image.removeEventListener("error", refreshScrollTriggers);
    });

    cleanups.reverse().forEach((cleanup) => cleanup?.());
  };
}

function initFilterScrollTriggerRefresh(root) {
  const selector = '[fs-list-element="list"], [data-fs-list-element="list"]';
  const lists = [
    ...(root.matches?.(selector) ? [root] : []),
    ...root.querySelectorAll(selector),
  ];

  if (!lists.length) return () => {};

  if (!window.ResizeObserver) {
    console.warn(
      "ResizeObserver is not available; ScrollTrigger will not refresh after fs-list filtering.",
    );
    return () => {};
  }

  let active = true;
  let refreshFrame = 0;
  const observer = new window.ResizeObserver(() => {
    if (refreshFrame) return;

    refreshFrame = requestAnimationFrame(() => {
      refreshFrame = 0;
      if (active) ScrollTrigger?.refresh();
    });
  });

  lists.forEach((list) => observer.observe(list));

  return () => {
    active = false;
    cancelAnimationFrame(refreshFrame);
    observer.disconnect();
  };
}

/*
Webflow HTML:
<div data-marquee>
  <div data-marquee-track>
    <div data-marquee-panel>Panel A</div>
    <div data-marquee-panel>Panel B</div>
    <div data-marquee-panel>Panel C</div>
    <div data-marquee-panel>Panel D</div>
  </div>
</div>
*/
function initMarquee(root) {
  const marquees = [
    ...(root.matches?.("[data-marquee]") ? [root] : []),
    ...root.querySelectorAll("[data-marquee]"),
  ];

  if (!marquees.length) return () => {};

  if (!window.gsap) {
    console.error("GSAP is not available for the marquee.");
    return () => {};
  }

  const gsapApi = window.gsap;
  const gap = 1.5;
  const cleanups = marquees.map((marquee) => {
    const track = marquee.querySelector("[data-marquee-track]");
    const panels = track ? Array.from(track.children) : [];

    if (!track || !panels.length) {
      console.warn("Marquee requires a track with at least one panel.");
      return () => {};
    }

    const originalMarqueeStyle = marquee.getAttribute("style");
    const originalTrackStyle = track.getAttribute("style");
    const clones = [];

    marquee.style.overflow = "hidden";
    Object.assign(track.style, {
      alignItems: "flex-end",
      columnGap: `${gap}em`,
      display: "flex",
      flexWrap: "nowrap",
      width: "max-content",
      willChange: "transform",
    });

    let active = true;
    let cycleWidth = 0;
    let offset = 0;
    let direction = 1;
    let previousScrollY = window.scrollY;
    let currentSpeed = 50;
    let targetSpeed = 50;
    let lastScrollTime = performance.now();
    let lastScrollActivity = lastScrollTime;
    const baseSpeed = 50;
    const scrollSpeedFactor = 0.2;
    const maxScrollBoost = 400;
    const setX = gsapApi.quickSetter(track, "x", "px");

    const removeClones = () => {
      clones.splice(0).forEach((clone) => {
        clone.remove();
      });
    };

    const clonePanel = (panel) => {
      const clone = panel.cloneNode(true);
      clone.dataset.marqueeClone = "";
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("inert", "");
      clone.style.pointerEvents = "none";
      if (clone.id) clone.removeAttribute("id");
      clone.querySelectorAll("[id]").forEach((element) => {
        element.removeAttribute("id");
      });
      return clone;
    };

    const rebuildTrack = () => {
      removeClones();
      panels.forEach((panel) => {
        const clone = clonePanel(panel);
        clones.push(clone);
        track.append(clone);
      });

      const nextCycleWidth =
        clones[0].getBoundingClientRect().left -
        panels[0].getBoundingClientRect().left;

      if (!nextCycleWidth) {
        console.warn("Marquee panels have no measurable width.");
        removeClones();
        cycleWidth = 0;
        return false;
      }

      cycleWidth = nextCycleWidth;
      const viewportWidth = marquee.clientWidth || window.innerWidth;
      const setCount = Math.max(
        2,
        Math.ceil((viewportWidth + cycleWidth) / cycleWidth),
      );

      for (let setIndex = 1; setIndex < setCount; setIndex += 1) {
        panels.forEach((panel) => {
          const clone = clonePanel(panel);
          clones.push(clone);
          track.append(clone);
        });
      }

      offset = ((offset % cycleWidth) + cycleWidth) % cycleWidth;
      setX(-offset);
      return true;
    };

    const restoreStyles = () => {
      if (originalMarqueeStyle === null) marquee.removeAttribute("style");
      else marquee.setAttribute("style", originalMarqueeStyle);

      if (originalTrackStyle === null) track.removeAttribute("style");
      else track.setAttribute("style", originalTrackStyle);
    };

    if (!rebuildTrack()) {
      restoreStyles();
      return () => {};
    }

    const handleScroll = () => {
      const now = performance.now();
      const nextScrollY = window.scrollY;
      const delta = nextScrollY - previousScrollY;
      const elapsed = Math.max((now - lastScrollTime) / 1000, 0.016);

      if (Math.abs(delta) > 0.5) {
        direction = delta > 0 ? 1 : -1;
        const scrollVelocity = Math.abs(delta) / elapsed;
        targetSpeed =
          baseSpeed +
          Math.min(scrollVelocity * scrollSpeedFactor, maxScrollBoost);
        lastScrollActivity = now;
      }

      previousScrollY = nextScrollY;
      lastScrollTime = now;
    };

    const tick = (_time, deltaTime) => {
      if (!active || !cycleWidth) return;

      const elapsed = Math.min(deltaTime || 16.67, 50) / 1000;
      if (performance.now() - lastScrollActivity > 80) {
        targetSpeed = baseSpeed;
      }
      const smoothing = 1 - Math.exp(-elapsed / 0.25);
      currentSpeed += (targetSpeed - currentSpeed) * smoothing;
      offset = (offset + direction * currentSpeed * elapsed) % cycleWidth;
      if (offset < 0) offset += cycleWidth;

      setX(-offset);
    };

    const handleResize = () => {
      rebuildTrack();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    gsapApi.ticker.add(tick);

    return () => {
      active = false;
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      gsapApi.ticker.remove(tick);
      removeClones();
      restoreStyles();
    };
  });

  return () => {
    cleanups.reverse().forEach((cleanup) => cleanup());
  };
}

/* =========================================
   WORK HOVER + SCRAMBLE TEXT
========================================= */

function footerGalleryHover(root) {
  const cards = [
    ...(root.matches?.(".footer-top-card") ? [root] : []),
    ...root.querySelectorAll(".footer-top-card"),
  ];
  const images = Array.from(root.querySelectorAll(".footer-top-img"));
  const logos = cards.map((card) => card.querySelector(".footer-top-logo"));
  const originalCardOpacities = cards.map(
    (card) => getComputedStyle(card).opacity,
  );
  const originalLogoOpacities = logos.map((logo) =>
    logo ? getComputedStyle(logo).opacity : null,
  );
  const contentItems = Array.from(
    root.querySelectorAll(".footer-top-content-item"),
  );

  if (!cards.length) return () => {};

  gsap.set(images, { opacity: 0 });
  gsap.set(contentItems, { yPercent: 0 });

  const activateCard = (index) => {
    cards.forEach((currentCard, cardIndex) => {
      const isActive = cardIndex === index;

      gsap.to(currentCard, {
        opacity: isActive ? 1 : originalCardOpacities[cardIndex],
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });

      const logo = logos[cardIndex];
      if (logo) {
        gsap.to(logo, {
          opacity: isActive ? 1 : originalLogoOpacities[cardIndex],
          duration: 0.35,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    });

    gsap.to(images, {
      opacity: (imageIndex) => (imageIndex === index ? 1 : 0),
      duration: 0.35,
      ease: "power2.out",
      overwrite: "auto",
    });

    if (contentItems.length) {
      gsap.to(contentItems, {
        yPercent: index * -100,
        duration: 0.45,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const cleanups = cards.map((card, index) => {
    const handleEnter = () => activateCard(index);

    card.addEventListener("mouseenter", handleEnter);

    return () => {
      card.removeEventListener("mouseenter", handleEnter);
    };
  });

  activateCard(0);

  return () => {
    cleanups.forEach((cleanup) => cleanup());
    gsap.killTweensOf([
      ...cards,
      ...logos.filter(Boolean),
      ...images,
      ...contentItems,
    ]);
  };
}

function initWorkHover(root = document) {
  const wrappers = root.querySelectorAll('[data-work="wrapper"]');
  const cleanups = [];

  wrappers.forEach((wrapper) => {
    const items = Array.from(wrapper.querySelectorAll('[data-work="item"]'));

    if (!items.length) return;

    const textElements = new Map();
    const textTweens = new Map();

    // SCRAMBLE CHARACTERS

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

    // INIT TEXT

    items.forEach((item) => {
      const texts = item.querySelectorAll('[data-work="text"]');

      texts.forEach((element) => {
        textElements.set(element, element.textContent);
      });
    });

    // SCRAMBLE TEXT ANIMATION

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

      // RANDOM SCRAMBLE

      function renderScramble() {
        element.textContent = chars
          .map((char, index) => {
            return charOrder.has(index) ? randomChar(char) : char;
          })
          .join("");
      }

      // RESOLVE TO ORIGINAL TEXT

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

      // TIMELINE

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

    // HOVER ITEM

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

    // RESET

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

    // EVENTS

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

  // CLEANUP

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}

function initWorkCategoryHover(root = document) {
  const wrappers = [
    ...(root.matches?.(".p_work-inner") ? [root] : []),
    ...root.querySelectorAll(".p_work-inner"),
  ];

  const cleanups = [];

  wrappers.forEach((wrapper) => {
    const items = Array.from(
      wrapper.querySelectorAll(".work-item-by-category[data-p-work]"),
    );

    const imgWrap = wrapper.querySelector(".p_work-img");

    const imageItems = Array.from(
      wrapper.querySelectorAll(".p_work-img-item[data-p-work]"),
    );

    if (!items.length) return;

    // ==========================
    // STATE
    // ==========================

    let activeItem = null;
    let stackOrder = 0;
    let resetVersion = 0;

    const imageStack = new Set();
    const imageAnimations = new Map();

    let resetAnimation = null;

    // ==========================
    // CLIP PATH CONFIG
    // ==========================

    const CENTER_CLIP = "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)";

    const FULL_CLIP = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";

    // ==========================
    // ANIMATION CONTROLLER
    // ==========================

    const stopImageAnimations = () => {
      imageAnimations.forEach((animation) => {
        animation.kill();
      });

      imageAnimations.clear();

      if (resetAnimation) {
        resetAnimation.kill();
        resetAnimation = null;
      }

      gsap.killTweensOf(imageItems, "clipPath");
    };

    const trackImageAnimation = (image, animation) => {
      imageAnimations.set(image, animation);

      animation.eventCallback("onComplete", () => {
        if (imageAnimations.get(image) === animation) {
          imageAnimations.delete(image);
        }
      });
    };

    // ==========================
    // GSAP CONTEXT
    // ==========================

    let moveWrapY;

    const ctx = gsap.context(() => {
      gsap.set(items, {
        opacity: 1,
      });

      gsap.set(imageItems, {
        clipPath: CENTER_CLIP,
        zIndex: 0,
        willChange: "clip-path",
      });

      if (imgWrap) {
        moveWrapY = gsap.quickTo(imgWrap, "y", {
          duration: 0.6,
          ease: "power3.out",
        });
      }
    }, wrapper);

    // ==========================
    // MOVE IMAGE WRAPPER
    // ==========================

    const moveWrapTo = (targetY) => {
      if (!imgWrap || !moveWrapY) return;

      const rect = imgWrap.getBoundingClientRect();

      const currentY = Number(gsap.getProperty(imgWrap, "y")) || 0;

      const baseCenterY = rect.top + rect.height / 2 - currentY;

      moveWrapY(targetY - baseCenterY);
    };

    // ==========================
    // ACTIVATE ITEM
    // ==========================

    ctx.add("activateItem", (target) => {
      activeItem = target;

      // Cancel previous reset callbacks
      resetVersion++;

      // ==========================
      // MATCH IMAGE
      // ==========================

      const workName = target.getAttribute("data-p-work");

      const currentImage = imageItems.find(
        (image) => image.getAttribute("data-p-work") === workName,
      );

      // ==========================
      // ITEM OPACITY
      // ==========================

      items.forEach((item) => {
        gsap.to(item, {
          opacity: item === target ? 1 : 0.2,
          duration: 0.4,
          ease: "power3.out",
          overwrite: "auto",
        });
      });

      // ==========================
      // MOVE WRAPPER
      // ==========================

      const itemRect = target.getBoundingClientRect();

      moveWrapTo(itemRect.top + itemRect.height / 2);

      if (!currentImage) return;

      // ==========================
      // STOP PREVIOUS ANIMATIONS
      // ==========================

      stopImageAnimations();

      // ==========================
      // UPDATE IMAGE STACK
      // ==========================

      // Move current image to the top
      imageStack.delete(currentImage);
      imageStack.add(currentImage);

      // Recalculate z-index
      stackOrder = 0;

      imageStack.forEach((image) => {
        stackOrder++;

        gsap.set(image, {
          zIndex: stackOrder,
        });
      });

      // ==========================
      // SET CURRENT IMAGE CLOSED
      // ==========================

      // IMPORTANT:
      // Always reset directly to CENTER_CLIP.
      // No closing animation.
      // This applies to both new and previously
      // revealed images.

      gsap.set(currentImage, {
        clipPath: CENTER_CLIP,
      });

      // ==========================
      // SETTLE PREVIOUS IMAGES
      // ==========================

      imageStack.forEach((image) => {
        if (image === currentImage) return;

        const settleTween = gsap.to(image, {
          clipPath: FULL_CLIP,
          duration: 0.32,
          ease: "power2.out",
          overwrite: "auto",
        });

        trackImageAnimation(image, settleTween);
      });

      // ==========================
      // REVEAL CURRENT IMAGE
      // ==========================

      const revealTween = gsap.to(currentImage, {
        clipPath: FULL_CLIP,
        duration: 0.65,
        ease: "power3.out",
        overwrite: "auto",

        onComplete: () => {
          if (imageAnimations.get(currentImage) === revealTween) {
            imageAnimations.delete(currentImage);
          }
        },
      });

      trackImageAnimation(currentImage, revealTween);
    });

    // ==========================
    // RESET ITEMS
    // ==========================

    ctx.add("resetItems", () => {
      activeItem = null;

      const currentReset = ++resetVersion;

      // Stop all running image animations
      stopImageAnimations();

      // Reset opacity
      gsap.to(items, {
        opacity: 1,
        duration: 0.4,
        ease: "power3.out",
        overwrite: "auto",
      });

      // Reset wrapper position
      if (moveWrapY) {
        moveWrapY(0);
      }

      const stackedImages = Array.from(imageStack);

      if (!stackedImages.length) return;

      // Close all images
      resetAnimation = gsap.to(stackedImages, {
        clipPath: CENTER_CLIP,
        duration: 0.45,
        ease: "power2.inOut",
        overwrite: "auto",

        onComplete: () => {
          if (currentReset !== resetVersion || activeItem !== null) return;

          gsap.set(imageItems, {
            zIndex: 0,
          });

          imageStack.clear();

          stackOrder = 0;
          resetAnimation = null;
        },
      });
    });

    // ==========================
    // POINTER MOVEMENT
    // ==========================

    const onPointerEnter = (event) => {
      moveWrapTo(event.clientY);
    };

    const onPointerMove = (event) => {
      const hoveredItem =
        event.target instanceof Element
          ? event.target.closest(".work-item-by-category[data-p-work]")
          : null;

      if (hoveredItem && wrapper.contains(hoveredItem)) {
        const rect = hoveredItem.getBoundingClientRect();

        moveWrapTo(rect.top + rect.height / 2);
      } else {
        moveWrapTo(event.clientY);
      }
    };

    const onPointerLeave = () => {
      ctx.resetItems();
    };

    wrapper.addEventListener("pointerenter", onPointerEnter);

    wrapper.addEventListener("pointermove", onPointerMove);

    wrapper.addEventListener("pointerleave", onPointerLeave);

    // ==========================
    // ITEM EVENTS
    // ==========================

    const listeners = [];

    items.forEach((item) => {
      const onEnter = () => {
        ctx.activateItem(item);
      };

      item.addEventListener("pointerenter", onEnter);

      listeners.push(() => {
        item.removeEventListener("pointerenter", onEnter);
      });
    });

    // ==========================
    // CLEANUP
    // ==========================

    cleanups.push(() => {
      wrapper.removeEventListener("pointerenter", onPointerEnter);

      wrapper.removeEventListener("pointermove", onPointerMove);

      wrapper.removeEventListener("pointerleave", onPointerLeave);

      listeners.reverse().forEach((remove) => {
        remove();
      });

      stopImageAnimations();

      imageStack.clear();

      ctx.revert();
    });
  });

  // ==========================
  // DESTROY
  // ==========================

  return () => {
    cleanups.reverse().forEach((cleanup) => {
      cleanup();
    });
  };
}

/* =========================================
   GLOBAL NAVBAR
========================================= */

function initNavbar() {
  const navWrapper = document.querySelector(".nav-wrapper");
  const getNavLinks = () =>
    Array.from(document.querySelectorAll("[data-nav-link]"));
  const navToggle = document.querySelector("[data-nav-toggle]");
  const targets = [
    ...new Set([navWrapper, ...getNavLinks(), navToggle].filter(Boolean)),
  ];

  if (!window.gsap) {
    console.error("GSAP is not available for the navbar.");
    return () => {};
  }

  const gsapApi = window.gsap;
  const originalStyles = new Map(
    targets.map((element) => [element, element.getAttribute("style")]),
  );
  const trackElements = (elements) => {
    elements.forEach((element) => {
      if (!originalStyles.has(element)) {
        originalStyles.set(element, element.getAttribute("style"));
      }
    });
  };
  const originalPaddingTop = navWrapper
    ? getComputedStyle(navWrapper).paddingTop
    : null;
  const originalPaddingBottom = navWrapper
    ? getComputedStyle(navWrapper).paddingBottom
    : null;
  const originalNavOpacity = navWrapper
    ? getComputedStyle(navWrapper).opacity
    : null;
  const originalNavPointerEvents = navWrapper
    ? getComputedStyle(navWrapper).pointerEvents
    : null;
  let isCompact = window.scrollY >= 200;
  let isMenuOpen = false;
  let noNavbarTriggers = [];
  const activeNoNavbarTriggers = new Set();

  if (navToggle) gsapApi.set(navToggle, { yPercent: 100 });

  const render = (animate = true) => {
    const currentNavLinks = getNavLinks();
    trackElements(currentNavLinks);

    const linksYPercent = isCompact && !isMenuOpen ? 100 : 0;
    const toggleYPercent = isCompact && !isMenuOpen ? 0 : 100;
    const animation = {
      duration: 0.45,
      ease: "power2.inOut",
      overwrite: "auto",
    };

    if (animate) {
      gsapApi.to(currentNavLinks, {
        ...animation,
        yPercent: linksYPercent,
        stagger: linksYPercent < 0 ? 0.03 : 0,
      });
      if (navToggle) {
        gsapApi.to(navToggle, {
          ...animation,
          yPercent: toggleYPercent,
        });
      }
    } else {
      gsapApi.set(currentNavLinks, { yPercent: linksYPercent });
      if (navToggle) gsapApi.set(navToggle, { yPercent: toggleYPercent });
    }

    if (navWrapper && isCompact) {
      if (animate) {
        gsapApi.to(navWrapper, {
          ...animation,
          paddingTop: "1em",
          paddingBottom: "1em",
        });
      } else {
        gsapApi.set(navWrapper, {
          paddingTop: "1em",
          paddingBottom: "1em",
        });
      }
    } else if (navWrapper && animate) {
      gsapApi.to(navWrapper, {
        ...animation,
        paddingTop: originalPaddingTop,
        paddingBottom: originalPaddingBottom,
      });
    }
  };

  const updateNoNavbarState = () => {
    if (!navWrapper) return;

    const isHidden = activeNoNavbarTriggers.size > 0;

    gsapApi.set(navWrapper, {
      pointerEvents: isHidden ? "none" : originalNavPointerEvents,
    });
    gsapApi.to(navWrapper, {
      opacity: isHidden ? 0 : originalNavOpacity,
      duration: 0.3,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const refreshNoNavbarTriggers = () => {
    noNavbarTriggers.forEach((trigger) => trigger.kill());
    noNavbarTriggers = [];
    activeNoNavbarTriggers.clear();

    const sections = document.querySelectorAll("[data-no-navbar]");

    if (!window.ScrollTrigger?.create) {
      if (sections.length) {
        console.error("ScrollTrigger is not available for navbar sections.");
      }
      updateNoNavbarState();
      return;
    }

    sections.forEach((section) => {
      const trigger = window.ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom top",
        onToggle(self) {
          if (self.isActive) activeNoNavbarTriggers.add(self);
          else activeNoNavbarTriggers.delete(self);

          updateNoNavbarState();
        },
      });

      noNavbarTriggers.push(trigger);
      if (trigger.isActive) activeNoNavbarTriggers.add(trigger);
    });

    updateNoNavbarState();
  };

  render(false);
  refreshNoNavbarTriggers();

  const navLinksObserver = new MutationObserver((mutations) => {
    const hasNavLinkChanges = mutations.some((mutation) => {
      if (mutation.type === "attributes") {
        return mutation.attributeName === "data-nav-link";
      }

      return Array.from(mutation.addedNodes).some(
        (node) =>
          node.nodeType === Node.ELEMENT_NODE &&
          (node.matches("[data-nav-link]") ||
            node.querySelector("[data-nav-link]")),
      );
    });

    const hasNoNavbarChanges = mutations.some((mutation) => {
      if (mutation.type === "attributes") {
        return mutation.attributeName === "data-no-navbar";
      }

      return [...mutation.addedNodes, ...mutation.removedNodes].some(
        (node) =>
          node.nodeType === Node.ELEMENT_NODE &&
          (node.matches("[data-no-navbar]") ||
            node.querySelector("[data-no-navbar]")),
      );
    });

    if (hasNavLinkChanges) render(false);
    if (hasNoNavbarChanges) refreshNoNavbarTriggers();
  });
  navLinksObserver.observe(document.documentElement, {
    attributeFilter: ["data-nav-link", "data-no-navbar"],
    attributes: true,
    childList: true,
    subtree: true,
  });

  const handleScroll = () => {
    const nextCompact = window.scrollY >= 200;
    const shouldCloseMenu = isMenuOpen;

    if (!shouldCloseMenu && nextCompact === isCompact) return;

    isCompact = nextCompact;
    isMenuOpen = false;
    render();
  };

  const handleToggleClick = (event) => {
    if (!isCompact) return;
    event.preventDefault();
    isMenuOpen = !isMenuOpen;
    render();
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  navToggle?.addEventListener("click", handleToggleClick);

  return () => {
    window.removeEventListener("scroll", handleScroll);
    navToggle?.removeEventListener("click", handleToggleClick);
    navLinksObserver.disconnect();
    noNavbarTriggers.forEach((trigger) => trigger.kill());
    activeNoNavbarTriggers.clear();
    originalStyles.forEach((style, element) => {
      gsapApi.killTweensOf(element);
      if (style === null) element.removeAttribute("style");
      else element.setAttribute("style", style);
    });
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

  const defaultBackgroundColor = getComputedStyle(cursor).backgroundColor;
  const originalInlineBackgroundColor = cursor.style.backgroundColor;
  const originalInlineOpacity = cursor.style.opacity;
  let activeLink = null;
  let cursorSize = 12;

  let pointerX = 0;
  let pointerY = 0;
  let hasPointerPosition = false;
  let cursorMode = "default";

  let moveX;
  let moveY;
  let moveWidth;
  let moveHeight;

  let isActive = false;

  // INITIALIZE

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

    window.addEventListener("scroll", updateActiveLinkAtPointer, true);
    window.addEventListener("resize", handleResize);
    window.addEventListener("blur", handlePointerLeave);
  }

  // MOVE CURSOR

  function moveCursor(x, y, width, height) {
    moveX(x);
    moveY(y);
    moveWidth(width);
    moveHeight(height);
  }

  function animateBackgroundColor(color) {
    gsap.to(cursor, {
      backgroundColor: color,
      duration: 0.3,
      ease: "power3.out",
      overwrite: "auto",
    });
  }

  function animateCursorMode(mode) {
    if (cursorMode === mode) return;

    cursorMode = mode;
    gsap.to(cursor, {
      scale: mode === "no-link" ? 0 : 1,
      opacity: mode === "default" ? 1 : 0,
      duration: 0.3,
      ease: "power3.out",
      overwrite: "auto",
    });
  }

  function getLinkTarget(element) {
    if (!(element instanceof Element)) return null;

    return (
      element.closest("[data-no-link]") ||
      element.closest('[data-link], [data-link-nest="wrapper"]')
    );
  }

  // UPDATE LINK BOUNDS

  function updateActiveLink() {
    if (!activeLink) return;

    if (!activeLink.isConnected) {
      activeLink = null;
      cursor.classList.remove("is-active");
      animateBackgroundColor(defaultBackgroundColor);
      return;
    }

    const boundsTarget = activeLink.matches('[data-link-nest="wrapper"]')
      ? activeLink.querySelector('[data-link-nest="target"]') || activeLink
      : activeLink;
    const rect = boundsTarget.getBoundingClientRect();

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

  function setActiveLink(target) {
    if (target) {
      const isNoLink = target.hasAttribute("data-no-link");
      const nextCursorMode = isNoLink ? "no-link" : "default";

      if (activeLink !== target || cursorMode !== nextCursorMode) {
        activeLink = target;
        cursor.classList.add("is-active");

        if (isNoLink) {
          animateBackgroundColor(defaultBackgroundColor);
        } else {
          const isBlackLink =
            target.getAttribute("data-link")?.trim().toLowerCase() === "black";
          animateBackgroundColor(
            isBlackLink ? "#ffffff" : defaultBackgroundColor,
          );
        }
      }

      animateCursorMode(nextCursorMode);
      if (isNoLink) {
        moveCursor(
          pointerX - cursorSize / 2,
          pointerY - cursorSize / 2,
          cursorSize,
          cursorSize,
        );
        return;
      }

      updateActiveLink();
      return;
    }

    if (activeLink) animateBackgroundColor(defaultBackgroundColor);

    activeLink = null;
    cursor.classList.remove("is-active");
    animateCursorMode("default");

    moveCursor(
      pointerX - cursorSize / 2,
      pointerY - cursorSize / 2,
      cursorSize,
      cursorSize,
    );
  }

  function updateActiveLinkAtPointer() {
    if (!hasPointerPosition) return;

    const element = document.elementFromPoint(pointerX, pointerY);
    setActiveLink(getLinkTarget(element));
  }

  // POINTER MOVE

  function handlePointerMove(event) {
    if (event.pointerType === "touch") return;

    pointerX = event.clientX;
    pointerY = event.clientY;
    hasPointerPosition = true;

    cursor.classList.add("is-visible");

    setActiveLink(getLinkTarget(event.target));
  }

  // POINTER LEAVE

  function handlePointerLeave() {
    if (activeLink) animateBackgroundColor(defaultBackgroundColor);

    hasPointerPosition = false;
    activeLink = null;
    animateCursorMode("outside");

    cursor.classList.remove("is-active");
    cursor.classList.remove("is-visible");
  }

  // RESIZE

  function handleResize() {
    cursorSize = parseFloat(getComputedStyle(cursor).width) || cursorSize;

    updateActiveLinkAtPointer();
  }

  // DESTROY

  function destroyCursor() {
    if (!isActive) return;

    isActive = false;

    document.removeEventListener("pointermove", handlePointerMove);

    document.documentElement.removeEventListener(
      "pointerleave",
      handlePointerLeave,
    );

    window.removeEventListener("scroll", updateActiveLinkAtPointer, true);
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("blur", handlePointerLeave);

    gsap.killTweensOf(cursor);

    cursor.classList.remove("is-visible", "is-active");

    cursor.style.backgroundColor = originalInlineBackgroundColor;
    cursor.style.opacity = originalInlineOpacity;

    gsap.set(cursor, {
      clearProps: "transform,width,height",
    });

    activeLink = null;
    hasPointerPosition = false;
    cursorMode = "outside";
  }

  // BREAKPOINT

  function handleBreakpoint() {
    if (media.matches) {
      setupCursor();
    } else {
      destroyCursor();
    }
  }

  media.addEventListener("change", handleBreakpoint);

  handleBreakpoint();

  // CLEANUP

  return () => {
    media.removeEventListener("change", handleBreakpoint);
    destroyCursor();
  };
}

/*
GSAP and ScrollTrigger must be loaded before index.js.

Webflow HTML:
<section data-flipbook>
  <div data-flipbook-sticky>
    <div data-flipbook-book>
      <div data-flipbook-page>Page 1</div>
      <div data-flipbook-page>Page 2</div>
      <div data-flipbook-page>Page 3</div>
      <div data-flipbook-page>Page 4</div>
    </div>
  </div>
</section>

CSS:
[data-flipbook] {
  min-height: 400vh;
  position: relative;
}
[data-flipbook-sticky] {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  height: 100vh;
  padding-block: 1.5em;
  position: sticky;
  top: 0;
}
[data-flipbook-book] {
  grid-column: 1 / -1;
  height: 100%;
  min-width: 0;
  position: relative;
  width: 100%;
}
[data-flipbook-page] {
  box-sizing: border-box;
  height: 100%;
  overflow: hidden;
  width: 100%;
}
*/
function initFlipbook(root) {
  const books = [
    ...(root.matches?.("[data-flipbook]") ? [root] : []),
    ...root.querySelectorAll("[data-flipbook]"),
  ];

  if (!books.length) return () => {};

  if (!window.gsap) {
    console.error("GSAP is not available for the flipbook.");
    return () => {};
  }

  if (!window.ScrollTrigger) {
    console.error("ScrollTrigger is not available for the flipbook.");
    return () => {};
  }

  const gsapApi = window.gsap;
  const cleanups = books.map((book) => {
    const bookElement = book.querySelector("[data-flipbook-book]");
    const stickyStage = book.querySelector("[data-flipbook-sticky]");
    const pages = bookElement
      ? Array.from(bookElement.querySelectorAll("[data-flipbook-page]"))
      : [];

    if (!bookElement || !stickyStage || pages.length < 2) {
      console.warn("Flipbook stage, book element, or pages were not found.");
      return () => {};
    }

    const hasCuratedItem = (page) =>
      page.matches('[data-curated="item"]') ||
      Boolean(page.querySelector('[data-curated="item"]'));

    const curatedPageItems = pages.flatMap((page) => {
      const items = [
        ...(page.matches('[data-curated="item"]') ? [page] : []),
        ...page.querySelectorAll('[data-curated="item"]'),
      ];

      return items.flatMap((item) => {
        const wrapper = item.closest('[data-curated="wrapper"]');
        return wrapper ? [{ item, page, wrapper }] : [];
      });
    });

    const bounds = bookElement.getBoundingClientRect();
    if (!bounds.width || !bounds.height) {
      console.warn("Flipbook has no measurable dimensions.");
      return () => {};
    }

    const originalPosition = bookElement.style.position;
    const originalPageStyles = pages.map((page) => page.getAttribute("style"));
    if (window.getComputedStyle(bookElement).position === "static") {
      bookElement.style.position = "relative";
    }

    const placeholders = pages.map((page) => {
      const placeholder = document.createComment("flipbook-page");
      page.parentNode.insertBefore(placeholder, page);
      page.remove();
      return placeholder;
    });

    const stage = document.createElement("div");
    stage.dataset.flipbookStage = "";
    Object.assign(stage.style, {
      columnGap: "1em",
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
      gridTemplateRows: "minmax(0, 1fr)",
      inset: "0",
      perspective: "1600px",
      position: "absolute",
      transformStyle: "preserve-3d",
      zIndex: "0",
    });

    const createSide = (side, column) => {
      const element = document.createElement("div");
      element.dataset.flipbookSide = side;
      Object.assign(element.style, {
        gridColumn: String(column),
        minHeight: "0",
        minWidth: "0",
        overflow: "hidden",
        position: "relative",
        zIndex: "1",
      });
      return element;
    };

    const leftSide = createSide("left", 1);
    const rightSide = createSide("right", 2);
    stage.append(leftSide, rightSide);
    bookElement.append(stage);

    let active = true;
    let activeSheet = null;
    let currentIndex = 0;
    let isPortrait = bounds.width < 560;
    let scrollProgress = 0;
    let scrollTrigger = null;
    let resizeObserver = null;
    let destroyCurated = () => {};

    const pagesPerTurn = () => (isPortrait ? 1 : 2);
    const turnCount = () => Math.floor((pages.length - 1) / pagesPerTurn());

    const configureLayout = () => {
      stage.style.gridTemplateColumns = isPortrait
        ? "minmax(0, 1fr)"
        : "minmax(0, 1fr) minmax(0, 1fr)";
      stage.style.columnGap = isPortrait ? "0" : "1em";
      leftSide.style.display = isPortrait ? "none" : "block";
      rightSide.style.gridColumn = isPortrait ? "1" : "2";
    };

    const mountPage = (side, page) => {
      side.replaceChildren();
      side.style.setProperty("overflow", "hidden");
      if (!page) return;

      if (hasCuratedItem(page)) {
        side.style.setProperty("overflow", "visible", "important");
      }
      page.style.width = "100%";
      page.style.height = "100%";
      side.append(page);
    };

    const renderView = (index) => {
      destroyCurated();
      destroyCurated = () => {};

      leftSide.replaceChildren();
      rightSide.replaceChildren();

      if (isPortrait) {
        mountPage(rightSide, pages[index]);
      } else {
        mountPage(leftSide, pages[index]);
        mountPage(rightSide, pages[index + 1]);
      }

      const curatedCleanups = curatedPageItems
        .filter(({ page }) => page.isConnected)
        .map(({ item, wrapper }) =>
          initCurated(wrapper, {
            includeFlipbookPages: true,
            item,
          }),
        );
      destroyCurated = () => {
        curatedCleanups.reverse().forEach((cleanup) => cleanup());
      };
    };

    const clonePageFace = (page) => {
      const clone = page.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.style.pointerEvents = "none";
      if (clone.id) clone.removeAttribute("id");
      clone.querySelectorAll("[id]").forEach((element) => {
        element.removeAttribute("id");
      });
      return clone;
    };

    const createSheet = (frontPage, backPage, direction) => {
      const sheet = document.createElement("div");
      sheet.dataset.flipbookSheet = "";
      Object.assign(sheet.style, {
        height: "100%",
        position: "absolute",
        top: "0",
        transformStyle: "preserve-3d",
        width: isPortrait ? "100%" : "50%",
        zIndex: "10",
      });

      if (isPortrait) {
        sheet.style.left = "0";
        sheet.style.transformOrigin = "50% 50%";
      } else if (direction > 0) {
        sheet.style.left = "50%";
        sheet.style.transformOrigin = "left center";
      } else {
        sheet.style.left = "0";
        sheet.style.transformOrigin = "right center";
      }

      const createFace = (page, backFace, insetSide) => {
        const face = document.createElement("div");
        const allowOverflow = !backFace && hasCuratedItem(page);
        Object.assign(face.style, {
          backfaceVisibility: "hidden",
          inset: "0",
          overflow: allowOverflow ? "visible" : "hidden",
          pointerEvents: "none",
          position: "absolute",
        });

        const pageFrame = document.createElement("div");
        Object.assign(pageFrame.style, {
          bottom: "0",
          left: insetSide === "left" && !isPortrait ? "0.5em" : "0",
          overflow: allowOverflow ? "visible" : "hidden",
          position: "absolute",
          right: insetSide === "right" && !isPortrait ? "0.5em" : "0",
          top: "0",
        });
        if (allowOverflow) {
          face.style.setProperty("overflow", "visible", "important");
          pageFrame.style.setProperty("overflow", "visible", "important");
        }
        if (backFace) face.style.transform = "rotateY(180deg)";
        pageFrame.append(page);
        face.append(pageFrame);
        return face;
      };

      const frontInset = isPortrait || direction > 0 ? "left" : "right";
      const backInset = isPortrait || direction > 0 ? "right" : "left";
      const frontFace = createFace(frontPage, false, frontInset);
      const backFace = createFace(clonePageFace(backPage), true, backInset);
      sheet.append(frontFace, backFace);
      stage.append(sheet);

      return sheet;
    };

    const syncToScroll = () => {
      const maxTurns = turnCount();
      if (!active || !maxTurns) return;

      const progress = gsapApi.utils.clamp(
        0,
        maxTurns,
        scrollProgress * maxTurns,
      );
      const isComplete = progress >= maxTurns;
      const turnIndex = Math.min(Math.floor(progress), maxTurns - 1);
      const turnProgress = isComplete ? 0 : progress - turnIndex;
      const nextIndex = isComplete
        ? maxTurns * pagesPerTurn()
        : turnIndex * pagesPerTurn();

      if (currentIndex !== nextIndex || (turnProgress === 0 && activeSheet)) {
        activeSheet?.remove();
        activeSheet = null;
        currentIndex = nextIndex;
        renderView(currentIndex);
      }

      if (isComplete || turnProgress === 0) return;

      const nextPageIndex = currentIndex + pagesPerTurn();
      const frontPage = pages[isPortrait ? currentIndex : currentIndex + 1];
      const backPage = pages[nextPageIndex];

      if (!frontPage || !backPage) return;

      if (!activeSheet) {
        activeSheet = createSheet(frontPage, backPage, 1);

        if (isPortrait) {
          mountPage(rightSide, pages[nextPageIndex]);
        } else {
          mountPage(rightSide, pages[nextPageIndex + 1]);
        }
      }

      gsapApi.set(activeSheet, {
        rotationY: -180 * turnProgress,
      });
    };

    const handleResize = () => {
      const nextPortrait = bookElement.clientWidth < 560;
      if (nextPortrait === isPortrait) return;

      activeSheet?.remove();
      activeSheet = null;
      isPortrait = nextPortrait;
      currentIndex = 0;
      configureLayout();
      renderView(currentIndex);
      window.ScrollTrigger.refresh();
      syncToScroll();
    };

    configureLayout();
    renderView(currentIndex);
    window.addEventListener("resize", handleResize);
    if (window.ResizeObserver) {
      resizeObserver = new window.ResizeObserver(handleResize);
      resizeObserver.observe(bookElement);
    }

    scrollTrigger = window.ScrollTrigger.create({
      trigger: book,
      start: "top top",
      end: "90% bottom",
      onRefresh(self) {
        scrollProgress = self.progress;
        syncToScroll();
      },
      onUpdate(self) {
        scrollProgress = self.progress;
        syncToScroll();
      },
    });

    return () => {
      active = false;
      destroyCurated();
      scrollTrigger?.kill();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
      activeSheet?.remove();
      stage.remove();
      placeholders.forEach((placeholder, index) => {
        if (placeholder.parentNode) placeholder.replaceWith(pages[index]);
        else bookElement.append(pages[index]);
      });
      pages.forEach((page, index) => {
        const originalStyle = originalPageStyles[index];
        if (originalStyle === null) page.removeAttribute("style");
        else page.setAttribute("style", originalStyle);
      });
      bookElement.style.position = originalPosition;
    };
  });

  return () => {
    cleanups.reverse().forEach((cleanup) => cleanup());
  };
}

/* =========================================
   2. INIT PAGE
========================================= */

function initPage(container) {
  if (!container) return () => {};

  const cleanups = [];

  // GSAP CONTEXT

  const ctx = gsap.context(() => {
    // PAGE ANIMATIONS

    const heroToggle = initHeroLayoutToggle({
      root: container,
    });

    cleanups.push(() => {
      heroToggle.destroy();
    });

    cleanups.push(initTestimoniSwiper(container));
    cleanups.push(initFilterScrollTriggerRefresh(container));
    cleanups.push(initMarquee(container));
    cleanups.push(footerGalleryHover(container));
    cleanups.push(initHeroStudioMouseMove(container));
    cleanups.push(initServicesTrail(container));

    // SECTION OVERLAP

    cleanups.push(initSectionOverlapFull(container));

    // WORK LAYOUT TOGGLE

    cleanups.push(initWorkLayoutToggle(container));

    // WORK HOVER

    const workHoverCleanup = initWorkHover(container);

    if (workHoverCleanup) {
      cleanups.push(workHoverCleanup);
    }

    const workCategoryHoverCleanup = initWorkCategoryHover(container);

    if (workCategoryHoverCleanup) {
      cleanups.push(workCategoryHoverCleanup);
    }

    // ADD MORE ANIMATIONS HERE
  }, container);

  // DESTROY PAGE

  return () => {
    cleanups.reverse().forEach((cleanup) => {
      cleanup();
    });

    ctx.revert();
  };
}

/* =========================================
   3. WEBFLOW DOCUMENT UPDATE
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
   4. WEBFLOW REINITIALIZATION
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
   5. BARBA INITIALIZATION
========================================= */

function initBarba() {
  window.scrollTo(0, 0);
  initNavbar();

  const wrapper = document.querySelector('[data-barba="wrapper"]');

  const initialContainer = document.querySelector('[data-barba="container"]');

  if (!wrapper || !initialContainer) return;

  const lenis = initSmoothScroll();
  lenis?.scrollTo(0, {
    immediate: true,
    force: true,
  });

  // Initialize custom scrollbar
  const fixedScrollbar = initFixedScrollbar(lenis);

  // INITIAL SETUP

  animatePreload(wrapper);

  const pageTransition = createPageTransition(wrapper);

  // INIT INITIAL PAGE

  let destroyCurrentPage = initPage(initialContainer);
  let destroyCurrentScrollAnimations = initScrollAnimations(initialContainer);
  let destroyCurrentFlipbook = initFlipbook(initialContainer);
  let destroyCurrentGlobalDiagonalMarquee = initGlobalDiagonalMarquee();

  // BARBA INIT

  barba.init({
    preventRunning: true,

    transitions: [
      {
        name: "page-transition",

        sync: true,

        // BEFORE ENTER

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

        // LEAVE

        leave() {
          // Keep current container visible.
          // Do not animate or hide it here.
        },

        // ENTER

        enter(data) {
          const { current, next } = data;

          const currentPage = current.container;
          const nextPage = next.container;

          // Stop scrolling during transition
          lenis?.stop();

          const tl = gsap.timeline();

          // 01. COVER CURRENT PAGE

          tl.add(pageTransition.cover(currentPage), ">");

          // 02. DESTROY & INITIALIZE PAGE

          tl.call(
            () => {
              // Destroy old page
              destroyCurrentPage();
              destroyCurrentScrollAnimations();
              destroyCurrentFlipbook();
              destroyCurrentGlobalDiagonalMarquee();

              destroyCurrentPage = () => {};
              destroyCurrentScrollAnimations = () => {};
              destroyCurrentFlipbook = () => {};
              destroyCurrentGlobalDiagonalMarquee = () => {};

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
              // while the container is still transparent
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

          // 03. REVEAL NEXT PAGE

          tl.add(pageTransition.reveal(nextPage), ">");

          // 04. RESUME SCROLL
          tl.call(
            () => {
              lenis?.start();
            },
            null,
            ">",
          );

          tl.call(
            () => {
              lenis?.start();
            },
            null,
            ">",
          );

          return tl;
        },

        // AFTER ENTER

        afterEnter({ next }) {
          // Restore normal document flow
          gsap.set(next.container, {
            clearProps:
              "position,top,left,width,zIndex,opacity,visibility,pointerEvents",
          });

          destroyCurrentScrollAnimations = initScrollAnimations(next.container);
          destroyCurrentFlipbook = initFlipbook(next.container);
          destroyCurrentGlobalDiagonalMarquee = initGlobalDiagonalMarquee();

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

initCustomCursor();

/* =========================================
   6. DOM READY
========================================= */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBarba, { once: true });
} else {
  initBarba();
}