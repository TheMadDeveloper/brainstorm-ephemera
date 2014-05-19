(function($) {
    var self = {
        scroll_lock_pos: false,
        scroll_override: false,

        $body: false,
        $document: false,
        $scroll_lock: false,
        $placeholder_sections: false,

        init: function() {
            self.$document = $(document);
            self.$body = $(document.body);

            self.$document.on("click", "[data-scroll-target]", function() {
                var target_selector = $(this).data("scroll-target");
                self.scrollTo(self.$scroll_lock || self.$body, $(target_selector).offset().top);
            });

            if (self.$body.hasClass("fixed-scrolling")) {
                self.lockScrolling();
            }
        },

        lockScrolling: function() {
            // Create the fixed scroll wrapper (mock viewport)
            self.$scroll_lock = $("<div>")
                .addClass("joey-scroll-wrapper full-screen")
                .prependTo(self.$body);

            // Get all the fixed section elements, and replace them with mock elements to retain the original height of
            // the document.  This will let us tap into the native scrolling behavior where necessary
            var $sections = $("body > .bs-section").replaceWith('<div class="full-screen scroll-pl"></div>');
            self.$placeholder_sections = $("body > .scroll-pl");

            // Add the sections original sections to the scroll lock element
            self.$scroll_lock.append($sections);

            self.wireScrollingOverride();
        },

        _snap_positions: false,
        snapPosition: function(scroll_position, dir) {
            if (!self._snap_positions) {
                var positions = [];

                self.$placeholder_sections.each(function() { positions.push($(this).position().top); });
                self._snap_positions = positions;
            }
            var _sp = self._snap_positions;

            for (var i = 1, n = _sp.length; i < n; i++) {
                if (scroll_position >= _sp[i-1] && scroll_position < _sp[i]) {
                    var between = (scroll_position - _sp[i-1]) / (_sp[i] - _sp[i-1]);
                    if (dir < 0) {
                        return between < 1 ? _sp[i-1] : _sp[i];
                    }
                    else {
                        return between > 0 ? _sp[i] : _sp[i-1];
                    }
                }
                if (i + 1 == n && scroll_position >= _sp[i]) {
                    return _sp[i];
                }
            }
            return 0;
        },

        wireScrollingOverride: function() {
            // Initialize the scroll lock position to the current scroll position
            //self.scroll_lock_pos = self.snapPosition(self.$document.scrollTop());

            var sampling = false;
            var scrollcheck = false;

            self.$document.on("scroll", function(event) {
                // If we aren't already scrolling to a particular fixed point, we want to sample the scroll gesture
                // to see if the user wants to scroll


                if (self.scroll_override == false) {
                    // Get the height of the window
                    self.scroll_override = setTimeout(function(){
                        self.scroll_override = true;

                        var ds = self.$document.scrollTop() - self.scroll_lock_pos;
                        var dir = ds < 0 ? -1 : 1;
                        //var di = Math.floor(Math.abs(ds) / 300);
                        //console.log(di * dir);
                        //0 -- 100 -- 200 -- 300


                        //console.log(section_index);
                        self.scroll_lock_pos = self.snapPosition(self.$document.scrollTop(), dir);

                        self.scrollTo(self.$scroll_lock, self.scroll_lock_pos);

                    },100);
                }

                if (scrollcheck) {
                    clearTimeout(scrollcheck);
                }

                scrollcheck = setTimeout(function() { sampling = false; self.$document.trigger("scrollstop");}, 300);

            });

            self.$document.on("scrollstop", function(event) {
                self.$document.scrollTop(self.scroll_lock_pos);
                self.scroll_override = setTimeout(function() {self.scroll_override = false;}, 200);
            });
        },

        scrollTo: function($el, position) {

            $el.stop().animate({scrollTop: position}, 500);
        }
    };

    $.joey.scrolling = self;
})(jQuery);