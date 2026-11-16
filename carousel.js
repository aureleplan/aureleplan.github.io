(function () {
  "use strict";

  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var comportement = reduit ? "auto" : "smooth";

  // Extrait l'identifiant d'une vidéo à partir d'un lien YouTube classique
  function idYoutube(lien) {
    try {
      var u = new URL(lien), id = null;
      if (u.hostname === "youtu.be") id = u.pathname.slice(1);
      else if (/(^|\.)youtube\.com$/.test(u.hostname)) {
        if (u.pathname === "/watch") id = u.searchParams.get("v");
        else {
          var m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]{11})/);
          if (m) id = m[2];
        }
      }
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    } catch (e) { return null; }
  }

  function initCarrousel(root) {
    var piste = root.querySelector(".pistes");
    var prec = root.querySelector(".prec");
    var suiv = root.querySelector(".suiv");
    var points = root.querySelector(".points");

    function slides() { return Array.prototype.slice.call(piste.querySelectorAll(".slide")); }

    function retirer(li) { if (li.parentNode) li.parentNode.removeChild(li); rafraichir(); }

    // Vidéo : miniature cliquable, le lecteur n'est chargé qu'au clic
    function monterVideo(li, id) {
      var titre = li.getAttribute("data-titre") || "Vidéo";
      function miniature() {
        li.textContent = "";
        var b = document.createElement("button");
        b.type = "button"; b.className = "lecteur";
        b.setAttribute("aria-label", "Lire la vidéo : " + titre);
        var img = document.createElement("img");
        img.src = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
        img.alt = "";
        img.addEventListener("error", function () { retirer(li); });
        var play = document.createElement("span");
        play.className = "play"; play.setAttribute("aria-hidden", "true");
        b.appendChild(img); b.appendChild(play);
        b.addEventListener("click", function () {
          li.textContent = "";
          var f = document.createElement("iframe");
          f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
          f.title = titre;
          f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
          f.allowFullscreen = true;
          li.appendChild(f);
        });
        li.appendChild(b);
      }
      li._reinit = miniature;
      miniature();
    }

    slides().forEach(function (li) {
      var lien = li.getAttribute("data-video");
      if (lien !== null) {
        var id = idYoutube(lien);
        if (id) monterVideo(li, id); else li.parentNode.removeChild(li);
        return;
      }
      var img = li.querySelector("img");
      if (!img) { li.parentNode.removeChild(li); return; }
      if (img.complete && img.naturalWidth === 0) { li.parentNode.removeChild(li); return; }
      img.addEventListener("error", function () { retirer(li); });
    });

    function courant() {
      var w = piste.clientWidth || 1;
      return Math.round(piste.scrollLeft / w);
    }
    function aller(i) {
      var n = slides().length;
      i = Math.max(0, Math.min(n - 1, i));
      piste.scrollTo({ left: i * piste.clientWidth, behavior: comportement });
    }

    function majEtat() {
      var n = slides().length, i = Math.min(courant(), n - 1);
      prec.disabled = i <= 0;
      suiv.disabled = i >= n - 1;
      Array.prototype.forEach.call(points.children, function (p, k) {
        if (k === i) p.setAttribute("aria-current", "true"); else p.removeAttribute("aria-current");
      });
      // Remet en pause les vidéos des diapositives qu'on a quittées
      slides().forEach(function (li, k) {
        if (k !== i && li._reinit && li.querySelector("iframe")) li._reinit();
      });
    }

    function rafraichir() {
      var s = slides(), n = s.length;
      root.hidden = n === 0;
      var multi = n > 1;
      prec.hidden = suiv.hidden = points.hidden = !multi;
      points.textContent = "";
      if (multi) {
        s.forEach(function (_, k) {
          var p = document.createElement("button");
          p.type = "button"; p.className = "point";
          p.setAttribute("aria-label", "Aller à la diapositive " + (k + 1) + " sur " + n);
          p.addEventListener("click", function () { aller(k); });
          points.appendChild(p);
        });
      }
      majEtat();
    }

    prec.addEventListener("click", function () { aller(courant() - 1); });
    suiv.addEventListener("click", function () { aller(courant() + 1); });

    var attente = false;
    piste.addEventListener("scroll", function () {
      if (attente) return;
      attente = true;
      requestAnimationFrame(function () { attente = false; majEtat(); });
    }, { passive: true });
    window.addEventListener("resize", function () { aller(courant()); });

    rafraichir();
  }

  Array.prototype.forEach.call(document.querySelectorAll(".carrousel"), initCarrousel);
})();
