export function navigateDashboardTab(listSelector: string) {
  window.requestAnimationFrame(() => {
    const list = document.querySelector<HTMLElement>(listSelector);
    if (!list) return;

    const root = list.closest<HTMLElement>(".dashboard-tabs");
    const activeTrigger = list.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
    const activePanel = root?.querySelector<HTMLElement>('[role="tabpanel"][data-state="active"]');
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top = Math.max(0, window.scrollY + list.getBoundingClientRect().top - 82);

    window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    activeTrigger?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest", inline: "center" });

    if (!root || !activePanel || reduceMotion) return;
    root.classList.remove("is-tab-arriving");
    void root.offsetWidth;
    root.classList.add("is-tab-arriving");
    window.setTimeout(() => root.classList.remove("is-tab-arriving"), 720);
  });
}
