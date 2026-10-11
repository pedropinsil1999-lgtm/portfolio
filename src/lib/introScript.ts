/** Set right before reloading into the chosen language, so the curtain reopens. */
export const INTRO_RESUME_KEY = "ph-intro-resume";

/**
 * Inline <head> script: decides before first paint how the intro runs.
 * Every full page load (open or refresh) plays the intro with the language
 * choice; client-side navigation never re-runs it.
 * - data-intro="play" + data-intro-choose: show the language chooser
 * - data-intro="resume": we just reloaded into the chosen language; reopen
 * - data-intro="done": skip (reduced motion)
 */
export const introBootScript = `try{var d=document.documentElement,s=sessionStorage,r=matchMedia("(prefers-reduced-motion: reduce)").matches;if(s.getItem("${INTRO_RESUME_KEY}")){s.removeItem("${INTRO_RESUME_KEY}");d.dataset.intro=r?"done":"resume"}else if(r){d.dataset.intro="done"}else{d.dataset.intro="play";d.dataset.introChoose="1"}}catch(e){document.documentElement.dataset.intro="done"}`;
