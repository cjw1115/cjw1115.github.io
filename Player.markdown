---
layout: page
title: Player
permalink: /player/
---

<body onload="setupVideo()">
  <script src="https://cdn.dashjs.org/latest/dash.all.min.js"></script>
  <script>
        // setup the video element and attach it to the Dash player
        function setupVideo() {
            var url = "./Videos/Escape_vision_atmos/stream.mpd";
            var player = dashjs.MediaPlayer().create();
            var video = document.querySelector("#html5video");
            player.initialize(video, url, true);
        }
  </script>
  <video id="html5video" width="80%" height="90%" controls>
  </video>
</body>