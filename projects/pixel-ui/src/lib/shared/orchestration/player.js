const nodes = window.__ORCH.nodes;
    const stories = window.__ORCH.stories;
    const stage = document.getElementById("stage");
    const svg = document.getElementById("wires");
    const signals = document.getElementById("signals");
    const stepLabel = document.getElementById("stepLabel");
    const focusLine = document.getElementById("focusLine");
    const stepText = document.getElementById("stepText");
    const playButton = document.getElementById("play");
    const pauseButton = document.getElementById("pause");
    const prevButton = document.getElementById("prev");
    const nextButton = document.getElementById("next");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodeById = Object.fromEntries(nodes.map((node) => [node.id, node]));
    const SIGNAL_MS = reduceMotion ? 0 : 1400;
    const STEP_MS = reduceMotion ? 2800 : 2600;

    const buttons = {};
    for (const node of nodes) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "node";
      button.dataset.id = node.id;
      button.style.left = node.x + "px";
      button.style.top = node.y + "px";
      button.setAttribute("aria-label", node.title + (node.pixel ? ", " + node.pixel : ""));
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.setAttribute("aria-hidden", "true");
      const strong = document.createElement("strong");
      strong.textContent = node.title;
      const blurb = document.createElement("span");
      blurb.className = "blurb";
      blurb.textContent = node.text;
      button.append(badge, strong, blurb);
      if (node.pixel) {
        const chip = document.createElement("code");
        chip.className = "pixel";
        chip.textContent = node.pixel;
        chip.title = node.pixel;
        button.append(chip);
      }
      button.addEventListener("click", () => jumpToNode(node.id));
      stage.appendChild(button);
      buttons[node.id] = button;
    }

    let story = Object.keys(stories)[0];
    let index = 0;
    let playing = !reduceMotion;
    let timer = 0;
    let signalTimer = 0;
    const seen = new Set();

    function storyNodes(name) {
      const ids = new Set();
      for (const step of stories[name]) {
        for (const id of step.on || []) ids.add(id);
        for (const id of step.blocked || []) ids.add(id);
        for (const [from, to] of step.edges || []) {
          ids.add(from);
          ids.add(to);
        }
      }
      return ids;
    }

    function box(id) {
      const el = buttons[id];
      return {
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
        cx: el.offsetLeft + el.offsetWidth / 2,
        cy: el.offsetTop + el.offsetHeight / 2
      };
    }

    function verticalHitsCard(x, y1, y2, fromId, toId) {
      const top = Math.min(y1, y2);
      const bottom = Math.max(y1, y2);
      const pad = 12;
      for (const node of nodes) {
        if (node.id === fromId || node.id === toId) continue;
        const card = box(node.id);
        const nearX = x > card.left - pad && x < card.left + card.width + pad;
        const overlapsY = bottom > card.top && top < card.top + card.height;
        if (nearX && overlapsY) return true;
      }
      return false;
    }

    function horizontalHitsCard(y, x1, x2, fromId, toId) {
      const left = Math.min(x1, x2);
      const right = Math.max(x1, x2);
      const pad = 12;
      for (const node of nodes) {
        if (node.id === fromId || node.id === toId) continue;
        const card = box(node.id);
        const nearY = y > card.top - pad && y < card.top + card.height + pad;
        const overlapsX = right > card.left && left < card.left + card.width;
        if (nearY && overlapsX) return true;
      }
      return false;
    }

    function line(start, end) {
      return "M " + start.x + " " + start.y + " L " + end.x + " " + end.y;
    }

    /** Join card edges. Same-row links use the sides. Anything else goes around a card it would cut. */
    function pathD(fromId, toId) {
      const a = box(fromId);
      const b = box(toId);
      const sameRow = Math.abs(a.cy - b.cy) < 36;
      const sameCol = Math.abs(a.cx - b.cx) < 12;

      if (sameRow && !sameCol) {
        const toLeft = b.cx < a.cx;
        const overlapTop = Math.max(a.top, b.top);
        const overlapBottom = Math.min(a.top + a.height, b.top + b.height);
        const sideY = overlapBottom > overlapTop ? (overlapTop + overlapBottom) / 2 : (a.cy + b.cy) / 2;
        const start = { x: toLeft ? a.left : a.left + a.width, y: sideY };
        const end = { x: toLeft ? b.left + b.width : b.left, y: sideY };
        if (!horizontalHitsCard(start.y, start.x, end.x, fromId, toId)) return line(start, end);

        // A card sits between them. Run under the row and enter the target from below,
        // so the line does not climb the target's side.
        const startX = toLeft ? a.left + 36 : a.left + a.width - 36;
        const endX = toLeft ? b.left + b.width - 36 : b.left + 36;
        const startY = a.top + a.height;
        const endY = b.top + b.height;
        const low = Math.max(startY, endY);
        let y = low + 36;
        if (horizontalHitsCard(y, startX, endX, fromId, toId)) y = low + 18;
        return (
          "M " + startX + " " + startY +
          " L " + startX + " " + y +
          " L " + endX + " " + y +
          " L " + endX + " " + endY
        );
      }

      const downward = b.cy >= a.cy;
      const start = { x: a.cx, y: downward ? a.top + a.height : a.top };
      const end = { x: b.cx, y: downward ? b.top : b.top + b.height };

      if (sameCol && !verticalHitsCard(start.x, start.y, end.y, fromId, toId)) {
        return line(start, end);
      }

      if (sameCol) {
        const leftGutter = Math.min(a.left, b.left) - 24;
        const rightGutter = Math.max(a.left + a.width, b.left + b.width) + 24;
        const gutter = leftGutter > 16 ? leftGutter : rightGutter;
        const dir = downward ? 1 : -1;
        const y1 = start.y + dir * 16;
        const y2 = end.y - dir * 16;
        return (
          "M " + start.x + " " + start.y +
          " L " + start.x + " " + y1 +
          " L " + gutter + " " + y1 +
          " L " + gutter + " " + y2 +
          " L " + end.x + " " + y2 +
          " L " + end.x + " " + end.y
        );
      }

      return routeInGutters(a, b, fromId, toId);
    }

    /** Travel only in the gaps between columns and rows, so a long link cannot cut a card. */
    function bands(axis) {
      const groups = [];
      for (const node of nodes) {
        const card = box(node.id);
        const at = axis === "x" ? card.cx : card.cy;
        const start = axis === "x" ? card.left : card.top;
        const end = axis === "x" ? card.left + card.width : card.top + card.height;
        let group = groups.find((item) => Math.abs(item.at - at) < (axis === "x" ? 40 : 36));
        if (!group) {
          group = { at, start, end };
          groups.push(group);
        } else {
          group.start = Math.min(group.start, start);
          group.end = Math.max(group.end, end);
        }
      }
      groups.sort((p, q) => p.start - q.start);
      return groups;
    }

    function gutters(groups, edge) {
      if (!groups.length) return [edge];
      const list = [groups[0].start - 28];
      for (let i = 0; i < groups.length - 1; i++) {
        list.push((groups[i].end + groups[i + 1].start) / 2);
      }
      list.push(groups[groups.length - 1].end + 28);
      return list;
    }

    function nearest(values, target, direction) {
      const pool = direction > 0 ? values.filter((value) => value >= target - 1) : values.filter((value) => value <= target + 1);
      const sorted = pool.length ? pool : values;
      return sorted.slice().sort((p, q) => Math.abs(p - target) - Math.abs(q - target))[0];
    }

    function routeHits(points, fromId, toId) {
      for (let i = 1; i < points.length; i++) {
        const p = points[i - 1];
        const q = points[i];
        if (Math.abs(p.x - q.x) < 1 && Math.abs(p.y - q.y) < 1) continue;
        if (Math.abs(p.y - q.y) < 1) {
          if (horizontalHitsCard(p.y, p.x, q.x, fromId, toId)) return true;
        } else if (verticalHitsCard(p.x, p.y, q.y, fromId, toId)) return true;
      }
      return false;
    }

    function routeInGutters(a, b, fromId, toId) {
      const towardRight = b.cx >= a.cx;
      const downward = b.cy >= a.cy;
      const vx = gutters(bands("x"), a.left);
      const hy = gutters(bands("y"), a.top);
      const exitX = towardRight ? a.left + a.width : a.left;
      const entryX = towardRight ? b.left : b.left + b.width;
      const startGutter = nearest(vx, exitX, towardRight ? 1 : -1);
      const endGutter = nearest(vx, entryX, towardRight ? -1 : 1);
      const below = hy.filter((y) => y >= a.top + a.height - 2);
      const above = hy.filter((y) => y <= a.top + 2);
      const laneY = downward
        ? nearest(below.length ? below : hy, a.top + a.height, 1)
        : nearest(above.length ? above : hy, a.top, -1);
      const endY = Math.max(b.top + 16, Math.min(b.top + b.height - 16, b.cy));
      const points = [
        { x: exitX, y: a.cy },
        { x: startGutter, y: a.cy },
        { x: startGutter, y: laneY },
        { x: endGutter, y: laneY },
        { x: endGutter, y: endY },
        { x: entryX, y: endY },
      ];
      const compact = [];
      for (const point of points) {
        const prev = compact[compact.length - 1];
        if (prev && Math.abs(prev.x - point.x) < 1 && Math.abs(prev.y - point.y) < 1) continue;
        compact.push(point);
      }
      if (routeHits(compact, fromId, toId)) {
        const outerY = downward ? hy[hy.length - 1] : hy[0];
        const outer = [
          { x: exitX, y: a.cy },
          { x: startGutter, y: a.cy },
          { x: startGutter, y: outerY },
          { x: endGutter, y: outerY },
          { x: endGutter, y: endY },
          { x: entryX, y: endY },
        ];
        return outer.map((point, index) => (index === 0 ? "M " : "L ") + point.x + " " + point.y).join(" ");
      }
      return compact.map((point, index) => (index === 0 ? "M " : "L ") + point.x + " " + point.y).join(" ");
    }

    function storyEdges(name) {
      const list = [];
      const keys = new Set();
      for (const step of stories[name]) {
        for (const [from, to] of step.edges || []) {
          const key = from + ">" + to;
          if (keys.has(key)) continue;
          keys.add(key);
          list.push([from, to]);
        }
      }
      return list;
    }

    function clearSignals() {
      window.clearInterval(signalTimer);
      signals.replaceChildren();
    }

    function segmentsOf(d) {
      const nums = d.match(/-?\d+(\.\d+)?/g);
      if (!nums) return [];
      const pts = [];
      for (let i = 0; i < nums.length; i += 2) {
        pts.push({ x: Number(nums[i]), y: Number(nums[i + 1]) });
      }
      const segs = [];
      for (let i = 1; i < pts.length; i++) segs.push({ a: pts[i - 1], b: pts[i] });
      return segs;
    }

    /** Drop the part of a segment already drawn, so two routes share one stroke. */
    function carve(seg, drawn) {
      let parts = [seg];
      for (const other of drawn) {
        const next = [];
        for (const part of parts) next.push(...subtractSegment(part, other));
        parts = next;
      }
      return parts.filter((part) => segmentLength(part) > 2);
    }

    function segmentLength(seg) {
      return Math.hypot(seg.b.x - seg.a.x, seg.b.y - seg.a.y);
    }

    function subtractSegment(part, other) {
      const horizontal = Math.abs(part.a.y - part.b.y) < 1;
      const otherHorizontal = Math.abs(other.a.y - other.b.y) < 1;
      if (horizontal !== otherHorizontal) return [part];
      if (horizontal) {
        if (Math.abs(part.a.y - other.a.y) > 1) return [part];
        const y = part.a.y;
        return cutInterval(part.a.x, part.b.x, other.a.x, other.b.x).map((span) => ({
          a: { x: span[0], y: y },
          b: { x: span[1], y: y }
        }));
      }
      if (Math.abs(part.a.x - other.a.x) > 1) return [part];
      const x = part.a.x;
      return cutInterval(part.a.y, part.b.y, other.a.y, other.b.y).map((span) => ({
        a: { x: x, y: span[0] },
        b: { x: x, y: span[1] }
      }));
    }

    function cutInterval(a0, a1, b0, b1) {
      const start = Math.min(a0, a1);
      const end = Math.max(a0, a1);
      const coverStart = Math.min(b0, b1);
      const coverEnd = Math.max(b0, b1);
      if (coverEnd <= start + 1 || coverStart >= end - 1) return [[a0, a1]];
      const pieces = [];
      if (start < coverStart - 1) pieces.push([start, Math.min(end, coverStart)]);
      if (end > coverEnd + 1) pieces.push([Math.max(start, coverEnd), end]);
      if (a0 > a1) pieces.forEach((piece) => piece.reverse());
      return pieces;
    }

    function pathFromSegments(segs) {
      let d = "";
      let prev = null;
      for (const seg of segs) {
        const connected = prev && Math.abs(prev.x - seg.a.x) < 1 && Math.abs(prev.y - seg.a.y) < 1;
        if (!connected) d += "M " + seg.a.x + " " + seg.a.y + " ";
        d += "L " + seg.b.x + " " + seg.b.y + " ";
        prev = seg.b;
      }
      return d.trim();
    }

    function insetEnds(d) {
      const segs = segmentsOf(d);
      if (!segs.length) return d;
      const pull = (seg, key) => {
        const point = seg[key];
        const other = key === "a" ? seg.b : seg.a;
        const len = Math.hypot(other.x - point.x, other.y - point.y);
        if (len < 10) return;
        seg[key] = {
          x: point.x + ((other.x - point.x) / len) * 4,
          y: point.y + ((other.y - point.y) / len) * 4
        };
      };
      pull(segs[0], "a");
      pull(segs[segs.length - 1], "b");
      return pathFromSegments(segs);
    }

    function svgMarker(id, color) {
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
      marker.setAttribute("id", id);
      marker.setAttribute("markerUnits", "userSpaceOnUse");
      marker.setAttribute("markerWidth", "10");
      marker.setAttribute("markerHeight", "10");
      marker.setAttribute("refX", "10");
      marker.setAttribute("refY", "5");
      marker.setAttribute("orient", "auto");
      const head = document.createElementNS("http://www.w3.org/2000/svg", "path");
      head.setAttribute("d", "M0,0 L10,5 L0,10 Z");
      head.setAttribute("fill", color);
      marker.appendChild(head);
      return marker;
    }

    function endsAtTarget(visualD, full) {
      const visual = segmentsOf(visualD);
      const original = segmentsOf(full);
      if (!visual.length || !original.length) return false;
      const ve = visual[visual.length - 1].b;
      const fe = original[original.length - 1].b;
      return Math.hypot(ve.x - fe.x, ve.y - fe.y) < 8;
    }

    function arrowStub(full) {
      const segs = segmentsOf(full);
      const last = segs[segs.length - 1];
      if (!last) return "";
      const len = segmentLength(last);
      const back = Math.min(16, Math.max(8, len - 1));
      const t = (len - back) / len;
      const x = last.a.x + (last.b.x - last.a.x) * t;
      const y = last.a.y + (last.b.y - last.a.y) * t;
      return "M " + x + " " + y + " L " + last.b.x + " " + last.b.y;
    }

    function drawWires(activeEdges) {
      const activeSet = new Set((activeEdges || []).map(([from, to]) => from + ">" + to));
      const background = storyEdges(story);
      svg.setAttribute("viewBox", "0 0 " + stage.scrollWidth + " " + stage.scrollHeight);
      svg.replaceChildren();
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      defs.append(svgMarker("arrow", "#8ea0b5"), svgMarker("arrow-on", "#2f6fb0"));
      svg.appendChild(defs);
      const drawn = [];

      const paint = (from, to, className) => {
        const full = insetEnds(pathD(from, to));
        const ghost = document.createElementNS("http://www.w3.org/2000/svg", "path");
        ghost.setAttribute("d", full);
        ghost.setAttribute("fill", "none");
        ghost.setAttribute("stroke", "none");
        svg.appendChild(ghost);

        const kept = [];
        for (const seg of segmentsOf(full)) {
          for (const piece of carve(seg, drawn)) {
            drawn.push(piece);
            kept.push(piece);
          }
        }
        const visualD = pathFromSegments(kept);
        if (visualD) {
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", visualD);
          path.setAttribute("class", className);
          path.dataset.from = from;
          path.dataset.to = to;
          svg.appendChild(path);
        }
        if (!visualD || !endsAtTarget(visualD, full)) {
          const stub = document.createElementNS("http://www.w3.org/2000/svg", "path");
          stub.setAttribute("d", arrowStub(full));
          stub.setAttribute("class", className);
          stub.dataset.from = from;
          stub.dataset.to = to;
          svg.appendChild(stub);
        }
        return ghost;
      };

      const activePaths = [];
      for (const [from, to] of activeEdges || []) {
        if (!buttons[from] || !buttons[to]) continue;
        activePaths.push({ path: paint(from, to, "wire on"), from, to });
      }

      for (const [from, to] of background) {
        if (!buttons[from] || !buttons[to] || activeSet.has(from + ">" + to)) continue;
        paint(from, to, "wire");
      }
      return activePaths;
    }

    function drawSignals(activeEdges) {
      clearSignals();
      const activePaths = drawWires(activeEdges);
      if (!activePaths.length) return;

      function spawn() {
        activePaths.forEach(({ path, from, to }, edgeIndex) => {
          if (!path.isConnected) return;
          const length = path.getTotalLength();
          const delay = edgeIndex * 180;
          const duration = SIGNAL_MS;

          const dot = document.createElement("span");
          dot.className = "signal";

          const start = () => {
            if (!path.isConnected) return;
            if (reduceMotion || duration === 0) {
              const mid = path.getPointAtLength(length / 2);
              dot.style.left = mid.x + "px";
              dot.style.top = mid.y + "px";
              dot.style.opacity = "1";
              return;
            }

            dot.style.animation = "signal-fly " + duration + "ms ease-in-out both";

            const started = performance.now();
            function frame(now) {
              if (!dot.isConnected || !path.isConnected) return;
              const t = Math.min(1, (now - started) / duration);
              const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
              const point = path.getPointAtLength(eased * length);
              dot.style.left = point.x + "px";
              dot.style.top = point.y + "px";
              if (t < 1) requestAnimationFrame(frame);
            }
            requestAnimationFrame(frame);
          };

          signals.append(dot);
          window.setTimeout(start, delay);
          window.setTimeout(() => {
            dot.remove();
          }, delay + duration + 80);
        });
      }

      spawn();
    }

    function rebuildSeen(upto) {
      seen.clear();
      const steps = stories[story];
      for (let i = 0; i <= upto; i++) {
        for (const id of steps[i].on || []) seen.add(id);
      }
    }

    function focusNames(ids) {
      return ids.map((id) => (nodeById[id] ? nodeById[id].title : id)).join(" + ");
    }

    /** Last thing this card did up to the current step: shown, or skipped and still skipped. */
    function lastMention(id, upto) {
      let role = "";
      const steps = stories[story];
      for (let i = 0; i <= upto; i++) {
        if ((steps[i].on || []).includes(id)) role = "on";
        if ((steps[i].blocked || []).includes(id)) role = "blocked";
      }
      return role;
    }

    function flowNumbers(id) {
      const numbers = [];
      stories[story].forEach((step, stepIndex) => {
        if ((step.on || []).includes(id)) numbers.push(stepIndex + 1);
      });
      return numbers;
    }

    function setPlaying(next) {
      playing = next;
      playButton.disabled = playing;
      pauseButton.disabled = !playing;
      playButton.classList.toggle("primary", !playing);
      pauseButton.classList.toggle("primary", playing);
      tick();
    }

    function render() {
      const steps = stories[story];
      const step = steps[index];
      const inStory = storyNodes(story);
      const blocked = new Set(step.blocked || []);
      const atEnd = index === steps.length - 1;

      for (const node of nodes) {
        const el = buttons[node.id];
        const badge = el.querySelector(".badge");
        const hot = step.on.includes(node.id);
        const isBlocked = !hot && (blocked.has(node.id) || lastMention(node.id, index) === "blocked");
        const visited = seen.has(node.id) && !hot && !isBlocked;
        const waiting = inStory.has(node.id) && !hot && !visited && !isBlocked;
        const dim = !inStory.has(node.id);

        el.classList.toggle("hot", hot);
        el.classList.toggle("done", visited);
        el.classList.toggle("waiting", waiting);
        el.classList.toggle("blocked", isBlocked);
        el.classList.toggle("dim", dim);
        el.disabled = dim;

        const numbers = flowNumbers(node.id);
        if (isBlocked && !hot) badge.textContent = "✕";
        else if (numbers.length) badge.textContent = numbers.join(", ");
        else badge.textContent = "";
        el.setAttribute(
          "aria-label",
          (numbers.length ? "Step " + numbers.join(" and ") + ". " : "") +
            node.title +
            (node.pixel ? ", " + node.pixel : "")
        );
      }

      const order = document.getElementById("order");
      order.replaceChildren();
      steps.forEach((item, stepIndex) => {
        const li = document.createElement("li");
        const jump = document.createElement("button");
        jump.type = "button";
        jump.textContent = (stepIndex + 1) + " " + (item.label || focusNames(item.on));
        if (stepIndex === index) jump.setAttribute("aria-current", "step");
        jump.addEventListener("click", () => {
          setPlaying(false);
          go(stepIndex);
        });
        li.append(jump);
        order.append(li);
      });

      stepLabel.textContent =
        "Step " + (index + 1) + " of " + steps.length + (atEnd && !playing ? " · Done" : "");
      focusLine.textContent = "Now: " + focusNames(step.on) +
        (blocked.size ? "  ·  Skipped: " + focusNames([...blocked]) : "");
      stepText.textContent = step.text;
      prevButton.disabled = index <= 0;
      nextButton.disabled = atEnd;
      drawSignals(step.edges || []);
    }

    function go(next) {
      const steps = stories[story];
      if (next < 0) return;
      if (next >= steps.length) {
        index = steps.length - 1;
        rebuildSeen(index);
        setPlaying(false);
        render();
        return;
      }
      index = next;
      rebuildSeen(index);
      render();
    }

    function jumpToNode(id) {
      const steps = stories[story];
      const found = steps.findIndex(
        (step) => (step.on || []).includes(id) || (step.blocked || []).includes(id)
      );
      if (found < 0) return;
      setPlaying(false);
      go(found);
    }

    function tick() {
      window.clearInterval(timer);
      if (!playing) return;
      const delay = STEP_MS;
      timer = window.setInterval(() => go(index + 1), delay);
    }

    document.querySelectorAll("[data-scenario]").forEach((button) => {
      button.addEventListener("click", () => {
        story = button.dataset.scenario;
        document.querySelectorAll("[data-scenario]").forEach((item) => {
          item.setAttribute("aria-pressed", String(item === button));
        });
        go(0);
        if (playing) tick();
      });
    });

    playButton.addEventListener("click", () => {
      if (index >= stories[story].length - 1) go(0);
      setPlaying(true);
    });

    pauseButton.addEventListener("click", () => setPlaying(false));

    prevButton.addEventListener("click", () => {
      setPlaying(false);
      go(index - 1);
    });

    nextButton.addEventListener("click", () => {
      setPlaying(false);
      go(index + 1);
    });

    document.getElementById("restart").addEventListener("click", () => {
      go(0);
      setPlaying(!reduceMotion);
    });

    window.addEventListener("resize", () => drawSignals(stories[story][index].edges || []));

    go(0);
    setPlaying(playing);
