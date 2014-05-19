/*
 * jQuery Joey plugin
 *
 * The MIT License
 *
 * Copyright (c) 2014 Keith Kerlan & Joey Primiani
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

(function($) {

    function Joey(options) {
    }

    var self = {

        callback: undefined,
        type: undefined,

        min_width: 1000,
        bg_scale: true,

        check: function() {},
        load:  function(hash) {},

        $document: false,
        $body: false,

        init:  function(callback, options) {
            self.$document = $(document);
            self.$body = $(document.body);
            self.$document.ready($.proxy(self.initPage, self));
            $(window).load($.proxy(self.assetsLoaded, self));
        },

        initPage: function() {
            if (self.scrolling) {
                self.scrolling.init();
            }

            self.initBgVideo();

            self.resize();
        },

        assetsLoaded: function() {
            self.processBgVideo();
        },

        videoAdapter: undefined,

        _is_mobile_device: undefined,
        isMobileDevice: function() {
            // Detect mobile device
            if (self._is_mobile_device === undefined) {
                self._is_mobile_device = (navigator.userAgent.match(/Android/i) ||
                    navigator.userAgent.match(/webOS/i) ||
                    navigator.userAgent.match(/iPhone/i) ||
                    navigator.userAgent.match(/iPad/i) ||
                    navigator.userAgent.match(/iPod/i)
                    ) != null;
            }

            return self._is_mobile_device;
        },

        _options: {},
        _prepContainerForVideo: function($iframe) {
            var $bg_video_container = $iframe.parents("div").first().css("overflow", "hidden").removeClass("joey-loading");

            // Position existing element content absolutely
            var $content = $iframe.siblings().detach();
            var $content_wrapper = $("<div>").addClass("joey-overlay")
                .append($content)
                .appendTo($bg_video_container);

            if (self.isMobileDevice()) {
                var fallback_img = $iframe.data("poster-img");
                if (fallback_img) {
                    $bg_video_container.css({background: "url('"+fallback_img+"') 50% 50% no-repeat",
                        "background-size": "cover"});
                }
            }
            else {
                if (!self.$bg_videos) {
                    self.$bg_videos = [];
                }
                // Position video absolutely
                var $video_wrapper = $("<div>",{id:"bg-player"}).css("position","absolute");
                self.$bg_videos.push($iframe.wrap($video_wrapper));
            }

            var pattern_overlay = $iframe.data("pattern-overlay");
            if (pattern_overlay) {
                $iframe.before($("<div>")
                    .addClass('joey-overlay')
                    .css({background: "url('"+pattern_overlay+"') 0 0 repeat", position: "absolute", opacity: 0})
                    .animate({opacity: 1}, 300));
            }
        },
        initBgVideo: function() {
            $('iframe.joey-bg-video').each(function() {
                var $iframe = $(this);

                if (self.isMobileDevice()) {
                    self._prepContainerForVideo($iframe);
                    $iframe.remove();
                }
                else {
                    $iframe.parents().first().addClass("joey-loading");
                }
            });
        },
        processBgVideo: function() {

            self.$bg_videos = [];

            $('iframe.joey-bg-video').each(function() {
                var $iframe = $(this);

                self._prepContainerForVideo($iframe);

                self.bg_video = new VideoAdapter($f(this));

                $iframe.css("display","block").animate({"opacity": 1},300);
                self.resizeVideo($iframe);
            });

        },

        // Resize All Elements
        resize: function() {
            var $win = $(window);
            var _w = $win.width();

            var _h = $win.height();

            $('.full-screen').each(function() {
                var $el = $(this);
                var new_width = _w - parseInt($el.css("padding-left")) - parseInt($el.css("padding-right"));
                var new_height = _h - parseInt($el.css("padding-bottom")) - parseInt($el.css("padding-top"));
                $el.css({width: new_width + 'px', height: new_height + 'px'});
            });
        },

        resizeVideo: function($video_iframe, _w, _h) {
            var $win = $(window);
            if (!_w) {
                _w = this.isMobileDevice() ? this.min_width : $win.width();
            }

            if (!_h) {
                _h = $win.height();
            }

            var _w_bg = $video_iframe.width();
            var _h_bg = $video_iframe.height();

            var win_ratio = _w / _h;
            var bg_ratio = _w_bg / _h_bg;


            // Calculate Image Width, Height and Positions
            if (this.bg_scale) {
                if (win_ratio > bg_ratio) {
                    _w_bg = parseInt(_w);
                    _h_bg = parseInt(_w_bg / bg_ratio);

                } else {
                    _h_bg = parseInt(_h);
                    _w_bg = parseInt(_h_bg * bg_ratio);
                }
            } else {
                if (win_ratio > bg_ratio) {
                    _h_bg = parseInt(_w);
                    _w_bg = parseInt(_h_bg * bg_ratio);

                } else {
                    _w_bg = _w;
                    _h_bg = parseInt(_w_bg / bg_ratio);
                }
            }
            var _x_bg = parseInt((_w - _w_bg) / 2);
            var _y_bg = parseInt((_h - _h_bg) / 2);

            if (this.bg_video) {
                //this.bg_video.setSize(_w_bg,_h_bg);
                $video_iframe
                    .width(_w_bg)
                    .height(_h_bg)
                    .css({left: _x_bg + 'px', top: _y_bg + 'px'});
            }
        }
    };

    /*Vimeo Api Begin*/
    function VideoAdapter($player, video_paused) {
        this.$player = $player;
        this.video_paused = video_paused;

        var self = this;
        this.$player.addEvent('ready', function() { self.apiReady() });
    }
    VideoAdapter.prototype = $.extend(VideoAdapter.prototype, {
        video_paused: false,
        playerReady: false,
        $player: null,
        apiReady: function() {
            this.playerReady = true;
            this.$player.addEvent('finish', this.videoEnded);
            if (!this.video_paused) {
                this.$player.api('setVolume',0);
                this.$player.api('play');
            }
        },
        videoEnded: function() {
//            if (bgPaused == false) {
//                nextBg();
//            }
        },
        setSize: function(w, h) {
//            if (activePlayer == 'youtube')
//                ytplayer.setSize(imgW, imgH);
//            else if (activePlayer == 'vimeo')
//                $('#vimeoplayer').css({width: imgW + 'px', height: imgH + 'px'});
        }
    });

    $.joey = self;

})(jQuery);