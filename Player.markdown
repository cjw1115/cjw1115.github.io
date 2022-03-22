---
layout: null
title: Player
---

<html>
  <head>
    <title>MPEG-DASH</title>
    <!-- DASH reference implementation -->
    <script src="https://cdn.dashjs.org/latest/dash.all.min.js"></script>
    <script>
        // setup the video element and attach it to the Dash player
        function setupVideo(protData) {
            var url = "/Videos/Escape_vision_atmos/stream.mpd";
            var player = dashjs.MediaPlayer().create();
            var video = document.querySelector("#html5video");
            player.initialize(video, url, true);
            player.setProtectionData(protData);
        }

        function play(){
          var data = document.getElementById('input_prop').value;
          var protData = {

              "com.microsoft.playready": {
                  "serverURL": data
              },
          };
          setupVideo(protData);
        }
    </script>
  </head>
  <body >
    <div>
      <h2>Dolby Vision & Dolby Atmos on Microsoft Edge</h2>
      <h3>Usage:</h3>
      <p>1. 在edge地址栏输入：<a href="edge://flags" target="view_window">edge://flags</a> </p>
      <p>2. 搜索 “Media Foundation playback for Windows”，然后设置为 “Enabled”</p>
      <p>3. 在Windows 空间音效打开 Dolby Atmos for xxxx</p>
      <p>4. 播放本页面视频就可以在Edge上体验Dolby Amtos</p>
      <h3>Notes:</h3>
      <p>1. 播放需要要安装 HEVC 拓展, 参考 <a href="https://www.bilibili.com/read/cv11274235" target="view_window">https://www.bilibili.com/read/cv11274235</a></p>
      <p>2. 如果没有画面，表明机器没有安装 DolbyVision decoder。但这时候 DolbyAtmos 是工作的。</p>
      
    </div>
    <div>
      <input type="text" id="input_prop">
      <button onclick="play()">Click me</button>
    </div>
    
    <video id="html5video" width="80%" height="90%" controls>
    </video>
  </body>
</html>