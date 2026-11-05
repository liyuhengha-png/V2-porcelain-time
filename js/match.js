/* Matching: real dated event (exact / nearest within a week) or a seeded thematic pick. */
(function () {
  const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  function dayIndex(m, d) {
    let n = 0;
    for (let i = 1; i < m; i++) n += DAYS[i - 1];
    return n + d;
  }

  function circular(a, b) {
    const diff = Math.abs(a - b);
    return Math.min(diff, 366 - diff);
  }

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  }

  const SEASON_ZH = ["岁首的寒", "初春的料峭", "春分的萌动", "清明的润泽", "立夏的丰盛", "芒种的饱满",
    "盛夏的炽烈", "处暑的余温", "白露的清冷", "秋分的沉静", "立冬的收敛", "冬至的深静"];
  const SEASON_EN = ["the cold at the year's start", "the chill of early spring", "the stirring of the spring equinox",
    "the wetness of Qingming", "the fullness of early summer", "the ripeness of Grain in Ear",
    "the heat of high summer", "the last warmth of late summer", "the cool of white dew",
    "the stillness of the autumn equinox", "the drawing-in of early winter", "the deep quiet of the solstice"];

  function findEvent(m, d) {
    const target = dayIndex(m, d);
    let best = null;
    (window.CERAMIC_EVENTS || []).forEach(function (e) {
      const dist = circular(target, dayIndex(e.month, e.day));
      if (!best || dist < best.dist) best = { event: e, dist: dist };
    });
    return best;
  }

  function thematic(m, d, works) {
    let pick = null;
    works.forEach(function (w) {
      const seasonal = (w.months || []).indexOf(m) >= 0 ? 1000 : 0;
      const score = seasonal + (hash(w.id + ":" + m + "-" + d) % 997);
      if (!pick || score > pick.score) pick = { work: w, score: score };
    });
    return pick.work;
  }

  window.matchBirthday = function (m, d) {
    const works = window.CERAMICS;
    const found = findEvent(m, d);
    let work = null;
    let mode = "thematic";
    let days = null;

    if (found && found.dist === 0) {
      work = works.find(function (w) { return w.id === found.event.artwork; });
      mode = "exact";
      days = 0;
    } else if (found && found.dist <= 5) {
      work = works.find(function (w) { return w.id === found.event.artwork; });
      mode = "near";
      days = found.dist;
    }
    if (!work) {
      work = thematic(m, d, works);
      mode = "thematic";
      found.event = null;
    }
    return {
      work: work,
      mode: mode,
      days: days,
      event: found ? found.event : null,
      seasonZh: SEASON_ZH[m - 1],
      seasonEn: SEASON_EN[m - 1]
    };
  };
})();
