(function setupRoomViews(root) {
  "use strict";

  const transitions = {
    desk: { right: true, front: "completed" },
    front: { desk: true, right: true },
    right: { desk: true, front: "completed" }
  };

  function canMove(from, to, completed) {
    const rule = transitions[from]?.[to];
    return rule === true || (rule === "completed" && completed);
  }

  function shouldRelockFront(resultHidden, questionVisible, backDisabled) {
    return resultHidden && questionVisible && backDisabled;
  }

  const logic = { canMove, shouldRelockFront };
  if (typeof module !== "undefined" && module.exports) module.exports = logic;
  root.RoomViewLogic = logic;
  if (!root.document) return;

  const document = root.document;
  const viewer = document.querySelector("#roomViewer");
  const lookUpButton = document.querySelector("#lookUpButton");
  const lookRightButton = document.querySelector("#lookRightButton");
  const sceneLookLeftButton = document.querySelector("#sceneLookLeftButton");
  const sceneLookDownButton = document.querySelector("#sceneLookDownButton");
  const sceneLookRightButton = document.querySelector("#sceneLookRightButton");
  const questionPanel = document.querySelector("#questionPanel");
  const backButton = document.querySelector("#backButton");
  const resultPanel = document.querySelector("#resultPanel");
  const cycleDashboard = document.querySelector("#cycleDashboard");
  const reducedMotion = root.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let currentView = "desk";
  let frontUnlocked = false;
  let returnFocus = null;
  let motionTimer = 0;

  function resultIsReady() {
    const ordinaryResult = !resultPanel.classList.contains("hidden") && !resultPanel.classList.contains("crisis-mode");
    const cycleIsVisible = !cycleDashboard.classList.contains("hidden");
    return ordinaryResult || cycleIsVisible;
  }

  function syncAvailability() {
    const assessmentRestarted = shouldRelockFront(resultPanel.classList.contains("hidden"), !questionPanel.classList.contains("hidden"), backButton.disabled);
    if (assessmentRestarted) frontUnlocked = false;
    if (resultIsReady()) frontUnlocked = true;
    lookUpButton.hidden = !frontUnlocked;
    sceneLookLeftButton.hidden = currentView !== "right" || !frontUnlocked;
    sceneLookRightButton.hidden = currentView !== "front";
    document.querySelectorAll("[data-room-scene]").forEach((scene) => {
      scene.setAttribute("aria-hidden", String(scene.dataset.roomScene !== currentView));
    });
  }

  function playMotion(name) {
    root.clearTimeout(motionTimer);
    viewer.classList.remove("is-moving", "is-closing");
    viewer.dataset.motion = name;
    if (reducedMotion) return;
    void viewer.offsetWidth;
    viewer.classList.add("is-moving");
    motionTimer = root.setTimeout(() => viewer.classList.remove("is-moving"), 720);
  }

  function openView(nextView, trigger, motion) {
    if (!canMove(currentView, nextView, frontUnlocked)) return;
    returnFocus = trigger || returnFocus;
    currentView = nextView;
    viewer.dataset.view = nextView;
    if (!viewer.open) viewer.showModal();
    document.documentElement.classList.add("room-view-open");
    syncAvailability();
    playMotion(motion);
    sceneLookDownButton.focus({ preventScroll: true });
  }

  function finishClosing() {
    root.clearTimeout(motionTimer);
    viewer.classList.remove("is-moving", "is-closing");
    if (viewer.open) viewer.close();
    document.documentElement.classList.remove("room-view-open");
    currentView = "desk";
    delete viewer.dataset.view;
    syncAvailability();
    returnFocus?.focus({ preventScroll: true });
  }

  function closeToDesk() {
    if (!canMove(currentView, "desk", frontUnlocked)) return;
    viewer.dataset.motion = "look-down";
    viewer.classList.remove("is-moving");
    if (reducedMotion) return finishClosing();
    viewer.classList.add("is-closing");
    root.clearTimeout(motionTimer);
    motionTimer = root.setTimeout(finishClosing, 480);
  }

  lookRightButton.addEventListener("click", () => openView("right", lookRightButton, "turn-right"));
  lookUpButton.addEventListener("click", () => openView("front", lookUpButton, "look-up"));
  sceneLookRightButton.addEventListener("click", () => openView("right", sceneLookRightButton, "turn-right"));
  sceneLookLeftButton.addEventListener("click", () => openView("front", sceneLookLeftButton, "turn-left"));
  sceneLookDownButton.addEventListener("click", closeToDesk);
  viewer.addEventListener("cancel", (event) => { event.preventDefault(); closeToDesk(); });

  const completionObserver = new MutationObserver(syncAvailability);
  completionObserver.observe(resultPanel, { attributes: true, attributeFilter: ["class"] });
  completionObserver.observe(cycleDashboard, { attributes: true, attributeFilter: ["class"] });
  completionObserver.observe(backButton, { attributes: true, attributeFilter: ["disabled"] });
  syncAvailability();
})(globalThis);
