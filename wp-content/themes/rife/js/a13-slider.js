/*
	Inspired by	: Supersized www.buildinternet.com/project/supersized
*/
var A13FRAMEWORK_slider_debug = false;

/*global Modernizr, debounce, YT, $f, _V_, TweenMax, Linear, Power2, Sine,  TimelineLite */
(function($){
    "use strict";

	//for debugger
	$ = jQuery;

    $.a13slider = function(SliderOptions){
        // Default Options
        var $html = $(document.documentElement),
			$window = $(window),
			body = document.body,
			$body = $(body),
			defaultOptions = {

            // Functionality
            parent                  :   body, 			//where will be embeded main element
            autoplay                :   1,             	// Slideshow starts playing automatically
            slide_interval          :   5000,          	// Length between transitions
            transition              :   2,             	// 0-None, 1-Fade, 2-Carousel
            transition_speed        :   750,           	// Speed of transition
            fit_variant             :   0,             	// 0-always, 1-landscape, 2-portrait, 3-when_needed, 4-cover
            pattern             	:   0,             	// shows above images
            gradient             	:   0,             	// shows above images
			start_slide				:	0,				// slide that should be shown at start

            // Components
            texts            		:   1,             	// Will titles and descriptions be shown
			title_color            	:   '',             // bg color under slide title
            progress_bar            :   1,             	// Timer for each slide
			thumb_links				:	1,			   	// Individual thumb links for each slide
			original_items			:   {},				//list from which options.slides where generated
            slides                  :   {}             	//here we will send slides with JSON format
        };


        /* Global Variables
         ----------------------------*/
		/** @namespace navigator.msMaxTouchPoints */
		var album = this,
			launched = false,
            options     = $.extend({},defaultOptions, SliderOptions), //options of slide show
            $parent     = $(options.parent),
            slides      = options.slides,        //params of each slide
            slides_num  = slides.length,    //number of slides
            all_slides  = {},               //$el.find('li')
			$root		= {},				//container of every slider part
            $el         = {},               //container of slides
            fit_variant = options.fit_variant,
			pattern 	= options.pattern,
			gradient 	= options.gradient,

			thumbs      		= {},               //thumb_list.children(),
			thumb_width 		= 0,                //thumbs.eq(0).outerWidth(true),
			tray_width  		= 0,                //width of visible tray
			tray_no_move		= false,			//if there is enough thumbs to move them
			thumbs_busy 		= false,
			thumb_list_w      	= 0,          		//width of all thumbnails
			maxThumbsMove  		= 0,          		//maximum value of thumbs left position

            slide_id_pre    	= 'ss-slide-',
            p_bar_enabled   	= options.progress_bar,
            slider_interval_time= options.slide_interval,
			transition_type		= options.transition,
			transition_speed 	= transition_type === 0 ? 0 : parseFloat(options.transition_speed/1000),
			thumb_links     	= options.thumb_links,
			title_color			= options.title_color,


			//Minor animation times
            minorShowTime = 300,
            minorHideTime = 200,

            // Elements
			thumb_list_id       =   'thumb-list',          // Thumbnail list
			thumb_list          =   {},                     // Thumbnail list
			tray,       		// Thumbnail tray
			tray_i,        		// div.inner keeps all together for hiding
			tray_button,		// thumbs opener
			slide_count_num,	// current slide number

            play_button,    // Play/Pause button
            next_button,     // Next slide button
            prev_button,     // Prev slide button

			// Internal variables
			current_slide_number      = options.start_slide,          // Current slide number
			is_slider_playing         = false,      // Tracks paused on/off
			is_video_playing          = false,      // Tracks paused on/off
			slideshow_interval_id     = 0,      	// Stores slideshow timer
			hide_items_interval_id    = 0,      	// Stores hiding items timer
			thumb_interval            = 0,          // Thumbnail interval
			clean_after_goTo_function = false,      // Trigger to update images after slide jump
			loadYouTubeAPI            = false,      // Bool if YT API should load
			loadVimeoAPI              = false,      // Bool if Vimeo API should load
			loadNativeVideoAPI        = false,      // Bool if Native Video API should load
			videos                    = {},         // videos from options

			click_event  	= 'click touchend',

			//css for hidden elements
			hidden  = {
                opacity : 1,
				visibility : 'hidden',
                x : '0%'
            },

            /***** small helpers functions *****/
			animateThumbs = function(left){        // move thumbs
				TweenMax.to(thumb_list, 0.5, {x:left});
			},

            hideSlides = function(slide){
                TweenMax.set(slide, hidden);
            },

            getField = function(field){
                return (typeof slides[current_slide_number][field] === 'undefined')? "" : slides[current_slide_number][field];
			},

			getPreviousSlideNumber = function(number){
				number = typeof number === 'undefined' ? current_slide_number : number;
				return number <= 0 ? slides_num - 1 : number - 1;
			},

			getNextSlideNumber = function(number){
				number = typeof number === 'undefined' ? current_slide_number : number;
				return number >= slides_num - 1 ? 0 : number + 1;
			};


        /* Prepares Vars and HTML
		----------------------------*/
        album.prepareEnv = function(){

			//no slides - no slider
			if( options.slides.length === 0 ){
				return;
			}

            // Add in slide markers
            var sliderIterator = 0,
                slideSet = '',
				p_bar_html = '',
				thumbMarkers = '',
				slider_classes = '',
				is_video = false,
                ts; //this slide from array

            //collect slides
			while(sliderIterator <= slides_num-1){
				ts = slides[sliderIterator];
				is_video = ts.type === 'video';

				//prepare slide HTML
				slideSet = slideSet+'<li id="'+slide_id_pre+sliderIterator+'" class="slide-'+sliderIterator+(is_video ? ' video' : '')+'"></li>';

                //collect video info
                if(is_video){
                    //check which API is needed
                    if(ts.video_type === 'youtube' && loadYouTubeAPI !== 'loaded'){
                        loadYouTubeAPI = true;
                    }
                    else if(ts.video_type === 'vimeo' && loadVimeoAPI !== 'loaded'){
                        loadVimeoAPI = true;
                    }
                    else if(ts.video_type === 'html5' && loadNativeVideoAPI !== 'loaded'){
                        loadNativeVideoAPI = true;
                    }

                    //copy video details
                    videos[slide_id_pre+sliderIterator] = ts;
                }

				// Slide Thumbnail Links
				if (thumb_links){

					thumbMarkers += '<li class="thumb'+sliderIterator +
					(sliderIterator === 0 ? ' current-thumb' : '') +
					(is_video ? ' video' : '') +
					'"><div><img width="150" height="150" src="'+ts.thumb+'" alt="" /></div></li>';
				}

				//increase iterator
				sliderIterator++;
			}

			//we load marked video APIs
            album.loadVideoApi();

			if(p_bar_enabled){
				p_bar_html = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 44 44" width="44" height="44"><circle class="progress-circle-bg" fill="none" cx="22" cy="22" r="21" stroke="#fff" stroke-opacity="0.5" stroke-width="1"/><circle class="progress-bar" fill="none" cx="22" cy="22" r="21" stroke="#fff" stroke-width="1"/></svg>';
			}

			if(pattern > 0){
				slider_classes += ' pattern pattern-'+pattern;
			}
			if(gradient > 0){
				slider_classes += ' gradient';
			}
			if(thumb_links){
				slider_classes += ' with-thumbs';
			}



            //Place slider HTML
            $parent.append('' +
                '<div id="a13-slider" class="'+slider_classes+'" tabindex="0">' +
					'<ul class="slider-slides"></ul>' +
					'<div id="slider-controls" class="show-with-slider'+(thumb_links? ' with-thumbs' : '')+'">' +
						((slides_num > 1)?
							(thumb_links? '<span id="thumb-tray-button" class="fa fa-th" />' : '') +
							'<span id="play-button" class="icon-controller-play">'+p_bar_html+'</span>' +
							'<span class="slides-count"><span class="num">1</span><span class="of">'+slides_num+'</span></span>'
						: '') +
					'</div>' +
					(thumb_links? '<div id="thumb-tray"><div class="inner"></div></div>' : '')+
					((slides_num > 1)?
						(
						'<span id="prev-slide" class="slider-arrow icon-chevron-thin-left" />'+
						'<span id="next-slide" class="slider-arrow icon-chevron-thin-right" />'+
						'<div id="big-play" style="display: none;">'
							+'<svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 200 200"  width="200" height="200">'
							+'<path class="svg-big-play" transform="rotate(90, 117, 103.291)" d="m43.501953,167.602753l73.499603,-128.624222l73.499359,128.624222l-146.998962,0z" stroke-linecap="null" stroke-linejoin="null" stroke-dasharray="null" stroke-width="5" stroke="#fff" fill="none"/>'
							+'<path class="svg-big-pause" transform="rotate(90, 50.7578, 101.57)" d="m-9.604706,71.181297l120.725006,0l0,0c15.814453,0 28.635773,13.605568 28.635773,30.390068c0,16.7845 -12.82132,30.390213 -28.635773,30.390213l-120.725006,0l0,0c-15.816589,0 -28.638977,-13.605713 -28.638977,-30.390213c0,-16.7845 12.822388,-30.390068 28.638977,-30.390068z" stroke-linecap="null" stroke-linejoin="null" stroke-dasharray="null" stroke-width="5" stroke="#fff" fill="none"/>'
							+'<path class="svg-big-pause" transform="rotate(90, 148.996, 102)" d="m88.635529,71.609039l120.725006,0l0,0c15.814453,0 28.635773,13.60556 28.635773,30.39006c0,16.7845 -12.82132,30.390213 -28.635773,30.390213l-120.725006,0l0,0c-15.816589,0 -28.638977,-13.605713 -28.638977,-30.390213c0,-16.7845 12.822388,-30.39006 28.638977,-30.39006z" stroke-linecap="null" stroke-linejoin="null" stroke-dasharray="null" stroke-width="5" stroke="#fff" fill="none"/>'
							+'</svg>'
						+'</div>'
						)
					: '') +
				'</div>'+
                '');

			//root element
            $root = $('#a13-slider').focus(); //focus to make key events work
			//container of slides
            $el = $root.find('ul.slider-slides');

            //append ready html
			$el.append(slideSet);

			if (thumb_links){
				tray_button = $('#thumb-tray-button');
				tray 		= $('#thumb-tray');
				tray_i 		= tray.children();

				tray_i.append('<ul id="' + thumb_list_id + '">' + thumbMarkers + '</ul>');

				//fill vars
				thumb_list 		= $('#' + thumb_list_id);
				thumbs 			= thumb_list.children();
				thumb_width 	= thumbs.eq(0).outerWidth(true);
				tray_width 		= tray.width();
				thumb_list_w 	= slides_num * thumb_width;
				maxThumbsMove 	= tray_width - thumb_list_w;


				// Make thumb tray proper size
				thumb_list.width(thumb_list_w);	//Adjust to true width of thumb markers

				//less images then width
				if(thumb_list_w < tray_width){
					TweenMax.set(thumb_list, {x: (tray_width - thumb_list_w)/2});
					tray_no_move = true;
					tray.removeClass('cursor-grab');
				}
				else{
					tray_no_move = false;
					tray.addClass('cursor-grab');
				}

				//Thumbnail Tray Navigation
				thumb_interval = Math.floor(tray_width / thumb_width) * thumb_width;
			}

            //save other slider elements
            all_slides      = $el.find('li');
            play_button     = $('#play-button');
            next_button		= $('#next-slide');
            prev_button		= $('#prev-slide');
			slide_count_num = $root.find('.slides-count').find('.num');

			//hide slides initially
			TweenMax.set(all_slides, hidden);

			//prepare play button
			if (p_bar_enabled){
				TweenMax.set(play_button.find('circle.progress-bar'), {drawSVG:"0%"});
			}

			//prepare slides
			// Set current slide
            album.fillSlide(current_slide_number, 'activeslide', 1);

            //load previous slide
			if (slides_num > 2){
                album.fillSlide(getPreviousSlideNumber(), 'prevslide');
			}

            //load next slide
            if (slides_num > 1){
                album.fillSlide(getNextSlideNumber());
				$el.addClass('cursor-grab');
            }
        };



        /* Launch Slider
         ----------------------------*/
        album.launch = function(){
			if(launched === true ){
				return;
			}
			launched = true;

			//show slider
            $el.addClass('show');
			$parent.find('.show-with-slider').addClass('show');

            // Call function for before slide transition
            album.beforeAnimation();
            album.events();

			if( slides_num > 1 ){
            	// Start slide show if auto-play enabled
				if(options.autoplay){
					album.playToggle();
				}
				else{
					album.indicatePlayerState('pause');
				}
			}
        };


		album.onResize =  function(){
			//resize all images
			album.resizeNow();

			$body.trigger('timeForResize');
		};

        /* Bind events
         ----------------------------*/
        album.events = function(){
			var hide_items_callback = function() {
					$root.addClass('hide-items');
				},

				key_events = function (event) {
					var key = event.keyCode;

					// Left Arrow
					if ((key === 37)){
						album.prevSlide();

					}
					// Right Arrow
					else if ((key === 39)) {
						album.nextSlide();
					}
					// Spacebar
					else if (key === 32) {
						album.playToggle();
						//to not scroll page
						event.preventDefault();
					}
				},

				resizeCallback = debounce(album.onResize, 250);

			// Hide controllers if mouse doesn't move for some time period
			$root.on('mousemove click touchstart', function() {
				$root.removeClass('hide-items');
            	clearTimeout(hide_items_interval_id);

            	// Timeout will be cleared on each slide movement also
				hide_items_interval_id = setTimeout(hide_items_callback, 3000);
        	});
			if(options.autoplay && slides_num > 1){
				hide_items_interval_id = setTimeout(hide_items_callback, 3000);
			}

            // Keyboard Navigation
			$root.on('keydown.a13-slider', key_events);

			//controls
            next_button.on( click_event, album.nextSlide);
            prev_button.on( click_event, album.prevSlide);
            play_button.on( click_event, album.playToggle);

			//small screens only
			$el.on(click_event, 'div.texts-opener', album.textsToggle);

            //Touch event(changing slides) & drag
			if(slides_num > 1){
				album.sliderDragEvents();
			}

			//thumbs actions
			if(thumb_links){
				if(tray_button){
					tray_button.on( click_event, album.toggleThumbsTray );
				}
				album.thumbsEvents();
			}


			// Adjust image when browser is resized
			$window.on('resize.a13-slider', resizeCallback);

			$window.on('a13-slider-destroy', album.destroy);
        };

		/* Remove events and timeouts
		 ----------------------------*/
		album.destroy = function(){
			//timeouts
			album.stopMovingToNextSlide();
			clearTimeout(hide_items_interval_id);

			//events that are not attached to slider
			$html.off('keyup.a13-slider');
			$window.off('resize.a13-slider');
			$window.off('a13-slider-destroy');

			$body.trigger('timeForDestroy');
		};

		album.sliderDragEvents = function(){
			var drag_start_x           = 0,
				drag_end_x             = 0,
				drag_start_y           = 0,
				drag_end_y             = 0,
				current_slide_position = 0,
				is_dragging            = false,
				is_waiting             = true,
				is_scrolling           = false,
				just_paused            = false,
				drag_threshold         = 30, //pixels
				change_slide_threshold = 0.06,//6% of slide width
				after_drag_time        = 0.7,
				slide_clickable        = true,
				drag_ticking           = false,
				drag_rAF               = 0,//requestAnimationFrame ID
				slider_width           = 0,
				current_slide,
				next_slide,
				prev_slide,

				getCurrentSlideXOffset = function(){
					return typeof current_slide[0]._gsTransform !== 'undefined'? current_slide[0]._gsTransform.x : 0;
				},

				mouseDown = function(e) {
					//check touch event
					if(e.type==='touchstart'){
						if(e.originalEvent.touches.length === 1){
							e = e.originalEvent.touches[0];
						}
						else{
							return;
						}
					}
					else{
						//for mouse action we disable it to prevent default browser image drag
						e.preventDefault();
					}

					//reset variables
					drag_rAF = 0;
					drag_ticking = false;
					just_paused = false;
					is_waiting = true;
					is_scrolling = false;
					drag_start_x = drag_end_x = e.pageX;
					drag_start_y = drag_end_y = e.pageY;
					slider_width = $el.width();

					//pause slider id needed
					if(is_slider_playing){
						just_paused = true;
						album.playToggle();
					}

					//prepare slides for animating
					current_slide = all_slides.eq(current_slide_number);
					prev_slide = all_slides.eq(getPreviousSlideNumber());
					next_slide = all_slides.eq(getNextSlideNumber());

					//prepare for drag
					is_dragging = true;
					slide_clickable = false;
					current_slide_position = getCurrentSlideXOffset();

					//grabbing cursor
					$el.removeClass('cursor-grab').addClass('cursor-grabbing');
					$body.addClass('cursor-grabbing');

					//stop any scroll animation
					TweenMax.set(current_slide, { xPercent : '0%', x: current_slide_position });
					TweenMax.set(prev_slide, { xPercent : '-100%', x: current_slide_position , autoAlpha : 1 });
					TweenMax.set(next_slide, { xPercent : '100%', x: current_slide_position , autoAlpha : 1 });
				},

				mouseMove = function(){
					drag_ticking = false;

					if (is_dragging) {
						//update position of slides
						TweenMax.set([current_slide, prev_slide, next_slide], {x : current_slide_position + drag_end_x - drag_start_x});
					}
				},

				mouseMoveTick = function(e) {
					var cords = e;
					if(e.type==='touchmove') {
						if (e.originalEvent.touches.length === 1) {
							cords = e.originalEvent.touches[0];
						}
						else {
							return;
						}
					}
					drag_end_x = cords.pageX;
					drag_end_y = cords.pageY;

					//detect where user scrolls
					if(is_waiting){
						//check if user scrolls page vertically
						if(Math.abs(drag_end_y - drag_start_y) > 15){ //bigger threshold before we decide then for X axis
							is_scrolling = true;
						}

						//or users is using scroller
						if(Math.abs(drag_end_x - drag_start_x) > 3){
							is_waiting = false;
						}
					}

					//user scrolls horizontally so we prevent default vertically scrolling action
					if(!is_scrolling){
						e.preventDefault();
					}

					if (!drag_ticking) {
						drag_rAF = requestAnimationFrame(mouseMove);
					}

					drag_ticking = true;
				},

				mouseUp = function(e) {
					//prepare touch event
					if(e.type==='touchend') {
						if (e.originalEvent.changedTouches.length !== 1) {
							return;
						}
					}

					//where we dragging, or it just random end od touch/click
					if (is_dragging) {
						//cancel any animation that could occur after drag is over
						if(drag_rAF !== 0){
							cancelAnimationFrame(drag_rAF);
						}

						//clean after drag
						is_dragging = false;

						//remove grabbing cursor
						$el.removeClass('cursor-grabbing').addClass('cursor-grab');
						$body.removeClass('cursor-grabbing');

						var moved_distance = drag_end_x - drag_start_x;

						//if dragged less then threshold, then it was probably click
						if (Math.abs(moved_distance) < drag_threshold) {
							slide_clickable = true;
							//move back to current slide
							TweenMax.to([current_slide, prev_slide, next_slide], after_drag_time, { x: 0 });
						}


						//enough of next/prev slide is visible?
						else if( Math.abs( current_slide_position + moved_distance ) > change_slide_threshold * slider_width ){
							//lets move to previous slide
							if(current_slide_position + moved_distance > 0){
								//this hides "previous" slide, so we will have to make it visible again
								album.changeSlide(true, true);

								if(slides_num > 2){
									//this one won't be needed
									TweenMax.set(next_slide, hidden);
								}
								//swap current slide to next slide position
								TweenMax.set(current_slide, { xPercent : '100%', x: -slider_width + current_slide_position + moved_distance, autoAlpha : 1 });
								//swap previous slide to current slide position
								TweenMax.set(prev_slide, { xPercent : '0%', x: -slider_width + current_slide_position + moved_distance });

								//finish drag with animation
								TweenMax.to( [current_slide, prev_slide], after_drag_time, {x : 0, ease: Power2.easeInOut} );
							}
							//lets move to next slide
							else{
								//this hides "previous" slide, so we will have to make it visible again
								album.changeSlide(false, true);

								if(slides_num > 2){
									//this one won't be needed
									TweenMax.set(prev_slide, hidden);
								}
								//swap current slide to previous slide position
								TweenMax.set(current_slide, { xPercent : '-100%', x: slider_width + current_slide_position + moved_distance, autoAlpha : 1 });
								//swap next slide to current slide position
								TweenMax.set(next_slide, { xPercent : '0%', x: slider_width + current_slide_position + moved_distance });

								//finish drag with animation
								TweenMax.to( [current_slide, next_slide], after_drag_time, {x : 0, ease: Power2.easeInOut} );
							}
						}

						//move back to current slide
						else{
							TweenMax.to([current_slide, prev_slide, next_slide], after_drag_time, { x: 0 });
						}
					}
					//just in case re enable click
					else{
						slide_clickable = true;
					}
				},

				onDestroy = function(){
					$body
						.off('timeForDestroy', onDestroy)
						.off('mousemove.slides_drag', mouseMoveTick)
						.off('mouseup.slides_drag', mouseUp)
						.off('touchmove.slides_drag', mouseMoveTick)
						.off('touchend.slides_drag', mouseUp);
					$(document)
						.off('mouseleave.slides_drag', mouseUp);
				};


			//resize & destroy
			$body
				.on('timeForDestroy', onDestroy);

			//mouse drag events
			$el.on('mousedown.slides_drag', mouseDown);
			$body
				.on('mousemove.slides_drag', mouseMoveTick)
				.on('mouseup.slides_drag', mouseUp);
			$(document)
				.on('mouseleave.slides_drag', mouseUp);

			//touch drag events
			$el.on('touchstart.slides_drag', mouseDown)
				.on('touchmove.slides_drag', mouseMoveTick)
				.on('touchend.slides_drag', mouseUp);


			//click on slider
			$el.on( click_event, 'li',{}, function(e){
				if(is_scrolling){
					return;
				}
				e.preventDefault();
				//for touch event we have to do check for clickable here, as it runs before touchend on body
				if(e.type === 'touchend'){
					//if dragged less then threshold, then it was probably click
					if (is_dragging && (Math.abs(drag_end_x - drag_start_x) < drag_threshold)) {
						slide_clickable = true;
					}
				}

				if(slide_clickable){
					//check if this is video
					var index = all_slides.index($(this)),
						target = $(e.target);

					//KNOWN ISSUE
					//when dragging HTML5 video it receives click and starts to play
					//not easy to fix
					if(slides[index].type === 'video'){
						//click on video cover
						if(target.is('div.video-poster')){
							if( Modernizr.videoautoplay ){
								album.playVideo();
							}
							else{
								$(target).fadeOut(minorHideTime);
							}
						}
						return;
					}

					//check if we didn't click some link in description
					if(target.is('a.slide') || target.is('img')){
						//continue execution
					}
					else if(target.is('a') && !target.is('.slide') || target.parents('a').length > 0){
						return;
					}

					if(!just_paused){
						album.playToggle();
					}
				}
			 });
		};

		album.thumbsEvents = function(){
			var drag_start_x         = 0,
				drag_end_x           = 0,
				thumbs_list_position = 0,
				is_dragging          = false,
				drag_threshold       = 30,
				thumb_clickable      = true,
				wheel_ticking        = false,
				drag_ticking         = false,
				drag_rAF			 = 0,//requestAnimationFrame ID
				start_move_time		 = 0,


				//for checking if current move want get out of tray scope
				checkEdges = function(distance, strict){
					//allow for drag beyond edge ?
					strict = typeof strict === 'undefined' ? false : strict;

					if(distance > 0){
						return strict? 0 : Math.round(Math.pow(distance,1/2));
					}
					else if(distance < maxThumbsMove){
						return strict ? maxThumbsMove : maxThumbsMove - Math.round(Math.pow(maxThumbsMove - distance, 1/2));
					}

					return distance;
				},

				getThumbsXOffset = function(){
					return typeof thumb_list[0]._gsTransform !== 'undefined'? thumb_list[0]._gsTransform.x : 0;
				},

				onResize = function(){
					thumb_list_w = thumb_list.width();
					tray_width = tray.width();

					// Update Thumb Interval & Page
					thumb_interval = Math.floor(tray_width / thumb_width) * thumb_width;

					// Adjust thumbnail markers
					if (thumb_list_w > tray_width){
						maxThumbsMove = tray_width - thumb_list_w;
						tray_no_move = false;
						tray.addClass('cursor-grab');
						var current_position = getThumbsXOffset();

						//fix right side edge
						if(current_position < maxThumbsMove){
							TweenMax.set(thumb_list, {x: maxThumbsMove});
						}
						//fix left side edge
						else if(current_position > 0){
							TweenMax.set(thumb_list, {x: 0});
						}
					}
					//less images then width
					else{
						TweenMax.set(thumb_list, {x: (tray_width - thumb_list_w)/2});
						tray_no_move = true;
						tray.removeClass('cursor-grab');
					}
				},

				mouseWheelScroll = function(delta){
					var offset        = getThumbsXOffset(),
						first_visible = thumbs.eq(Math.ceil(-offset / thumb_width)),
						left          = first_visible.position().left,
						to_end        = first_visible.nextAll().andSelf().length * thumb_width,
						to_move       = delta * thumb_width,
						scroll_improve = 0.9,
						move;

					//move forward
					if(to_move < 0){
						//if less then 10% of thumb is scrolled, jump only one thumb
						if( -offset - to_move - left < (1-scroll_improve)*thumb_width ){
							to_move += thumb_width;
						}
						if(tray_width > (to_end + to_move) ){
							//forward edge
							move = maxThumbsMove; //right edge
						}
						else{
							//forward normal
							move = -left + to_move; //normal move
						}
					}
					//move backward
					else{
						//if less then 90% thumb to scroll, jump to another(improves backward scrolling)
						if( -offset + (-left + to_move) < scroll_improve*thumb_width ){
							to_move += thumb_width;
						}
						if((offset + to_move) > 0 ){
							//backward edge
							move = 0; //left edge
						}
						else{
							//backward normal
							move = -left + to_move; //normal move
						}
					}

					animateThumbs(move);
				},

				requestWheelTick = function(event, delta){
					//do nothing
					if(!tray_no_move){
						event.preventDefault();
						if (!wheel_ticking) {
							requestAnimationFrame(function(){
									wheel_ticking = false;
									mouseWheelScroll(delta);
								}
							);
						}
						wheel_ticking = true;
					}
				},

				mouseDown = function(e) {
					if (!tray_no_move) {
						e.preventDefault();

						if(e.type==='touchstart'){
							if(e.originalEvent.touches.length === 1){
								e = e.originalEvent.touches[0];
							}
							else{
								return;
							}
						}

						//reset
						drag_rAF = 0;
						drag_ticking = false;
						drag_start_x =  drag_end_x = e.pageX;
						start_move_time = Number(new Date());

						//prepare for drag
						is_dragging = true;
						thumbs_list_position = getThumbsXOffset();
						thumb_clickable = false;
						tray.removeClass('cursor-grab').addClass('cursor-grabbing');
						$body.addClass('cursor-grabbing');

						//stop any scroll animation
						TweenMax.set(thumb_list, {x: checkEdges(thumbs_list_position)});
					}
				},

				mouseMove = function(){
					drag_ticking = false;

					if (is_dragging) {
						//update position of thumbs
						TweenMax.set(thumb_list, {x: checkEdges(thumbs_list_position + (drag_end_x - drag_start_x))});
					}
				},

				mouseMoveTick = function(e) {
					if (!drag_ticking) {
						drag_rAF = requestAnimationFrame(mouseMove);
					}

					if(e.type==='touchmove') {
						if (e.originalEvent.touches.length === 1) {
							e = e.originalEvent.touches[0];
						}
						else {
							return;
						}
					}

					drag_end_x = e.pageX;
					drag_ticking = true;
				},

				mouseUp = function(e) {
					if(e.type==='touchend') {
						if (e.originalEvent.changedTouches.length === 1) {
							e = e.originalEvent.changedTouches[0];
						}
						else {
							return;
						}
					}

					if (is_dragging) {
						//cancel any animation that could occur after drag is over
						if(drag_rAF !== 0){
							cancelAnimationFrame(drag_rAF);
						}

						//clean after drag
						is_dragging = false;
						tray.removeClass('cursor-grabbing').addClass('cursor-grab');
						$body.removeClass('cursor-grabbing');

						//if dragged less then threshold, then it was probably click
						if (Math.abs(drag_end_x - drag_start_x) < drag_threshold) {
							thumb_clickable = true;
						}

						//calculate mouseUp animation
						var time               = Number(new Date()) - start_move_time,
							distance           = drag_start_x - e.pageX,
							px_per_second      = Math.round(Math.abs(distance) / (time / 1000)),
							friction_factor    = 1000,
							animation_time     = px_per_second / friction_factor,
							animation_distance = Math.pow(px_per_second, 2) / (2 * friction_factor),
							new_x              = checkEdges(getThumbsXOffset() - animation_distance * (distance > 0 ? 1 : -1), true);

						//recalculate friction and time to get to edge
						if(new_x === 0 || new_x === maxThumbsMove){
							if(new_x === 0){
								friction_factor = Math.pow(px_per_second, 2) / (Math.abs(getThumbsXOffset())*2);
							}
							else{
								friction_factor = Math.pow(px_per_second, 2) / (Math.abs(maxThumbsMove - getThumbsXOffset())*2);
							}
							animation_time = px_per_second/friction_factor;
						}

						//make animation
						TweenMax.to(thumb_list, animation_time, {
								x: new_x,
								ease: Sine.easeOut
							}
						);
					}
					//just in case re enable click
					else{
						thumb_clickable = true;
					}
				},

				onDestroy = function(){
					$body
						.off('timeForResize', onResize)
						.off('timeForDestroy', onDestroy)
						.off('mousemove.thumbs_list', mouseMoveTick)
						.off('mouseup.thumbs_list', mouseUp)
						.off('touchmove.thumbs_list', mouseMoveTick)
						.off('touchend.thumbs_list', mouseUp);
					$(document)
						.off('mouseleave.thumbs_list', mouseUp);
				};


			//resize & destroy
			$body
				.on('timeForResize', onResize)
				.on('timeForDestroy', onDestroy);

			//scrolling with mouse
			tray.on('mousewheel', requestWheelTick);

			//mouse drag events
			tray.on('mousedown.thumbs_list', mouseDown);
			$body
				.on('mousemove.thumbs_list', mouseMoveTick)
				.on('mouseup.thumbs_list', mouseUp);
			$(document)
				.on('mouseleave.thumbs_list', mouseUp);

			//touch drag events
			tray.on('touchstart.thumbs_list', mouseDown);
			$body
				.on('touchmove.thumbs_list', mouseMoveTick)
				.on('touchend.thumbs_list', mouseUp);

			//mouse hover classes
			tray
				.on('mouseenter', function () {
					if (!tray_no_move) {
						//inform other elements to not animate thumbs
						thumbs_busy = true;
					}
				})
				.on('mouseleave', function () {
					if (!is_dragging) {
						thumbs_busy = false;
					}
				});

			//open thumb
			thumbs
				.on( click_event, function(e){//click cause we don't want to respond to touchStart
					e.preventDefault();
					//for touch event we have to do check for clickable here, as it runs before touchend on body
					if(e.type === 'touchend'){
						//if dragged less then threshold, then it was probably click
						if (is_dragging && (Math.abs(drag_end_x - drag_start_x) < drag_threshold)) {
							thumb_clickable = true;
						}
					}

					if(thumb_clickable){
						album.goTo(thumbs.index(this));
					}
				});
        };

		album.toggleThumbsTray = function(e){
			if(typeof e !== 'undefined'){
				e.stopPropagation();
				e.preventDefault();
			}

			//if hiding tray
			if(tray_button.hasClass('active')){
				tray_button.removeClass('active');
				$root.removeClass('thumbs-open');
			}
			//if opening tray
			else{
				tray_button.addClass('active');
				$root.addClass('thumbs-open');
			}
		};



        /* Loads APIs for Video types
         ----------------------------*/
        album.loadVideoApi = function(){
            //load Youtube API
            if(loadYouTubeAPI === true){
                //this function will run when YT API will load
                window.onYouTubeIframeAPIReady = function() {
                    if(A13FRAMEWORK_slider_debug){ console.log('Youtube Api ready!'); }
                    album.YT_ready(true);
                };

                //load YT API
                (function(){
                    var tag = document.createElement('script');
                    tag.src = "//www.youtube.com/iframe_api";
                    var firstScriptTag = document.getElementsByTagName('script')[0];
                    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                })();

            }

            //load Vimeo API
            if(loadVimeoAPI === true){
                //load VIMEO API
                (function(){
                    var tag = document.createElement('script');
                    tag.src = "http://a.vimeocdn.com/js/froogaloop2.min.js";
                    var firstScriptTag = document.getElementsByTagName('script')[0];
                    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                })();
            }

            //load native video API
            if(loadNativeVideoAPI === true){
                //load mediaElement API
                //loaded already
            }
        };

        /* Define YT_ready function.
         ----------------------------*/
        album.YT_ready = (function(){
            var onReady_funcs = [], api_isReady = false;
            /* @param func function     Function to execute on ready
             * @param func Boolean      If true, all queued functions are executed
             * @param b_before Boolean  If true, the func will be added to the first
             position in the queue */
            return function(func, b_before){
                if(typeof func === "function") {
					//if api si loaded or we have youtube object
                    if (api_isReady || typeof YT === 'object'){
						api_isReady = true; //mark it loaded
						func();
					}
                    else { onReady_funcs[b_before?"unshift":"push"](func); }
                }
                else if (func === true) {
                    api_isReady = true;
                    for (var i=0; i<onReady_funcs.length; i++){
                        // Removes the first func from the array, and execute func
                        onReady_funcs.shift()();
                    }
                }
            };
        })();

        /* Init player so it can be manipulated by API
         ----------------------------*/
        album.initPlayer = function(playerId, onReady){
            var current = videos[playerId],
                frame = $el.find('#'+playerId).find('iframe');

			//html5 not uses frame
			if(frame.length){
				frame = frame.get(0);// DOM element
			}

            //if player is initialized already
            if(typeof current.player !== 'undefined'){
                return;
            }

            if(typeof onReady !== 'function'){
                //empty function
                onReady = function(){};
            }

            if(A13FRAMEWORK_slider_debug){ console.log('init player', playerId, onReady.toString(), current.video_type); }

            if(current.video_type === 'youtube'){
                //cause youTube iframe API breaks on firefox when using iframes
                //we will grab parameters and then switch iframe with div with same id
                var elem    = $el.find('#'+playerId).find('div[data-vid_id]'),
                    vid_id  = elem.data('vid_id'),
                    width   = elem.data('width'),
                    height  = elem.data('height');

                //noinspection JSUnresolvedFunction
				current.player = new YT.Player(elem.get(0), {
                    height: height,
                    width: width,
                    videoId: vid_id,
                    playerVars : {wmode: 'transparent', rel: 0, vq: 'HD1080', showinfo: 0, modestbranding: 1 },
                    events: {
                        'onReady'       : onReady,
                        'onStateChange' : album.videoStateChange
                    }
                });

            }

            else if(current.video_type === 'vimeo'){
                if (typeof $f === 'undefined') {
					if (A13FRAMEWORK_slider_debug) {
						console.log('Vimeo API NOT loaded!');
					}
					//try again after 0.5s
					setTimeout(function () {
						album.initPlayer(playerId, onReady);
					}, 500);
				} else {
					current.player = $f(frame);
					current.player.addEvent('ready', function () {
						current.player.addEvent('pause', function () {
							album.videoStateChange(2);
						});
						current.player.addEvent('play', function () {
							album.videoStateChange(1, playerId);
						});
						current.player.addEvent('finish', function () {
							album.videoStateChange(0);
						});

						onReady();
					});
				}
            }

            else if(current.video_type === 'html5'){
                if (typeof MediaElement === 'undefined') {
					if (A13FRAMEWORK_slider_debug) {
						console.log('HTML5 Video API NOT loaded!');
					}
					//try again after 0.5s
					setTimeout(function () {
						album.initPlayer(playerId, onReady);
					}, 500);
				} else {
					var vid = $el.find('#' + playerId).find('video');

					//resize video to full size
					vid
						.attr('width', parseInt($el.width(), 10))
						.attr('height', parseInt($el.height(), 10))
						.css({
							height: '100%',
							width : '100%'
						});

					current.player = new MediaElementPlayer(vid.get(0), {
						success: function (mediaElement/*, domObject*/) {
							mediaElement.addEventListener('pause', function () {
								album.videoStateChange(2);
							});
							mediaElement.addEventListener('play', function () {
								album.videoStateChange(1);
							});
							mediaElement.addEventListener('ended', function () {
								album.videoStateChange(0);
							});

						}
					});

					//fire this play or pause
					onReady();
				}
            }
        };

        /* Plays Video
         ----------------------------*/
        album.playVideo = function(){
            var playerId = slide_id_pre+current_slide_number,
                current = videos[playerId],
                type;
            if(A13FRAMEWORK_slider_debug){ console.log('play video', playerId, 'no type yet'); }

            //if no such player
            if(typeof current === 'undefined'){
                return;
            }
            type = current.video_type;
            if(A13FRAMEWORK_slider_debug){ console.log('play video', playerId, type); }

            //helper function
            var play = function(){
                if(type === 'youtube'){
					//API can be ready but player can be not ready yet
					if(typeof current.player.playVideo === 'function'){
						current.player.playVideo();
					}
				}
                else if(type === 'vimeo'){ current.player.api('play'); }
                else if(type === 'html5'){ current.player.play(); }
            };

            //player not initialized yet
            if(typeof current.player === 'undefined'){
                //helper function
                var init = function(){
                    album.initPlayer(playerId, function(){ play(); } );
                };

                if(type === 'youtube'){ album.YT_ready( function(){ init(); }); }
                else if(type === 'vimeo'){ init(); }
                else if(type === 'html5'){ init(); }
            }
            else{
                play();
            }

			//show video, so user can see it is loading
			all_slides.eq(current_slide_number).find('.video-poster').fadeOut(minorHideTime);
        };

        /* Stops playing video
         ----------------------------*/
        album.pauseVideo = function(playerId){
            if(typeof playerId === 'undefined'){
                playerId = slide_id_pre+current_slide_number;
            }
            var current = videos[playerId],
//                player = '',
                type;

            //if no such player
            if(typeof current === 'undefined'){
                return;
            }

            type = current.video_type;

            if(A13FRAMEWORK_slider_debug){ console.log('pause video', playerId, type); }

            //helper function
            var pause = function(){
				if(type === 'youtube' && typeof current.player !== 'undefined' && typeof current.player.pauseVideo !== 'undefined'){
					//pause only when video was playing, cause pausing when video is not started breaks mobile players
					if(current.player.getPlayerState() === 1){
						current.player.pauseVideo();
					}
				}
                else if(type === 'vimeo' && typeof current.player !== 'undefined' && typeof current.player.api !== 'undefined'){ current.player.api('pause'); }
                else if(type === 'html5' && typeof current.player !== 'undefined' && typeof current.player.pause !== 'undefined'){ current.player.pause(); }
            };

            //player not initialized yet
            if(typeof current.player === 'undefined'){
                //helper function
                var init = function(){
                    album.initPlayer(playerId, function(){ pause(); } );
                };

                if(type === 'youtube'){ album.YT_ready( function(){ init(); }); }
                else if(type === 'vimeo'){ init(); }
                else if(type === 'html5'){ init(); }
            }
            else{
                pause();
            }
        };

        /* Video events handling
         ----------------------------*/
        album.videoStateChange = function(event, playerId){
            /*
            * VIMEO & HTML5 VIDEO change returns number
            * Youtube change returns event object
            * */
            var state = event;

            if(typeof state === 'object'){
                state = event.data;
            }

            if(A13FRAMEWORK_slider_debug){ console.log('player state: ' + state, typeof event, playerId); }

			var actual_slide = all_slides.eq(current_slide_number),
				slide_caption = actual_slide.find('div.slide-caption');

            //if playing
            if(state === 1){
                //stops slide show things on video playback
                album.stopMovingToNextSlide();
                is_video_playing = true;

				//take care of thumbnails
				if(thumb_links){
					TweenMax.to(tray, 0.3, {autoAlpha : 0});
				}

				//slide-caption
				if(slide_caption.length){
					TweenMax.to(slide_caption, 0.5, {autoAlpha : 0, y:'-100', display:'none'});
				}

				//show video
				actual_slide.find('.video-poster').fadeOut(minorHideTime);

				//fire event that we are about to start video
				$body.trigger('a13SliderVideoStarts');

                //protection for auto playing vimeo video after YT player initialization
                //it may play when it is not visible
                //only vimeo video return playerId on state change
                if(typeof playerId !== 'undefined' && playerId !== slide_id_pre+current_slide_number){
                    videos[playerId].player.api('pause');
                }
            }
			//if paused or ended
            else if(state === 0 || state === 2){
                is_video_playing = false;

				//show thumbs again
				if(thumb_links){
					TweenMax.to(tray, 0.3, {autoAlpha : 1});
				}

            	//if video ended and slide show is not paused
                if(state === 0 && is_slider_playing){
                    album.nextSlide();
                }

				//slide-caption
				if(slide_caption.length){
					TweenMax.fromTo(slide_caption, 0.5, {autoAlpha : 0, display:'block'}, {autoAlpha : 1, y:'0'});
				}
            }
        };

        /* Resize Images
          ----------------------------*/
		album.resizeNow = function(image){
			//all images or only one?
			var is_big_resize = typeof image === 'undefined',
				elem = is_big_resize? all_slides.children('a').children('img') : $(image);

            //  Resize each image
            elem.each(function(){
                var this_image = $(this),
                    image_height  	= this_image.data('origHeight'),
                    image_width  	= this_image.data('origWidth'),
                    space_width    	= $el.width(),
                    space_height   	= $el.height(),
                    image_ratio 	= (image_height/image_width).toFixed(4),
                    space_ratio 	= (space_height/space_width).toFixed(4),
					resize_width	= 0,
					resize_height	= 0,
					new_css,

                    fit_always      = fit_variant === 0,
                    fit_landscape   = fit_variant === 1,
                    fit_portrait    = fit_variant === 2,
                    fit_when_needed = fit_variant === 3,
                    fit_cover 		= fit_variant === 4,
					// Size & Position
					//Cover: Image will always cover all available area
					//Always: Image will never exceed browser width or height (Ignores min. dimensions)
					//Landscape: Landscape images will not exceed browser width
					//Portrait: Portrait images will not exceed browser height
					//When Needed: Best for small images that shouldn't be stretched

                    resizeWidth = function(){
                        resize_width = space_width;
                        resize_height = space_width * image_ratio;
                    },

                    resizeHeight = function(){
						resize_height = space_height;
						resize_width = space_height / image_ratio;
                    };

                /*-----Resize Image-----*/
                if (fit_when_needed){
					//reset
					resize_width = image_width;
					resize_height = image_height;

                    if( image_height > space_height || image_width > space_width){
                        if (space_ratio > image_ratio){
                            resizeWidth();
                        } else {
                            resizeHeight();
                        }
                    }
                }
                else if (fit_always){
                    if (space_ratio > image_ratio){
                        resizeWidth();
                    } else {
                        resizeHeight();
                    }
                }
                else if (fit_cover){
                    if (space_ratio > image_ratio){
                        resizeHeight();
                    } else {
                        resizeWidth();
                    }
                }
                else{	// Normal Resize
                    if (space_ratio > image_ratio){
                        // If landscapes are set to fit
                        if(fit_landscape && image_ratio < 1){
                            resizeWidth();
                        }
                        else{
                            resizeHeight();
                        }
                    } else {
                        // If portraits are set to fit
                        if(fit_portrait && image_ratio >= 1){
                            resizeHeight();
                        }else{
                            resizeWidth();
                        }
                    }
                }
                /*-----End Image Resize-----*/

				new_css = {
					width : resize_width,
					height : resize_height,
					// Horizontally Center
					left : (space_width - resize_width)/2,
					// Vertically Center
					top : (space_height - resize_height)/2
				};

				//animate current image back to proper place if needed
				if(is_big_resize && this_image.closest('li').attr('id') === slide_id_pre+current_slide_number){
					TweenMax.to(this_image, 0.5, new_css);
				}
				//resize other images
				else{
					this_image.css(new_css);

				}
            });

		};

		/* Filling next and
		 ----------------------------*/
		album.fillSurroundingSlides = function(number){
			//if slide was not filled yet
			album.fillSlide(getNextSlideNumber(number));
			album.fillSlide(getPreviousSlideNumber(number));
		};

        /* Filling empty slides when need
         ----------------------------*/
        album.fillSlide = function(slide_to_fill_number, bonus_class, is_first_slide){
            var target_slide = all_slides.eq(slide_to_fill_number),
				slide_options = slides[slide_to_fill_number],
                slide_type  = slide_options.type,
                addClass    = (typeof bonus_class !== 'undefined'),
                first       = (typeof is_first_slide !== 'undefined'),
                imageLink, item;

            //if slide is empty
            if (!target_slide.html()){
                if(slide_type === 'image') {
					imageLink = (slide_options.url) ? "href='" + slide_options.url + "'" : "";	// If link exists, build it
					item = $('<img src="" />');

					//add classes to li
					target_slide.addClass('image-loading' + (addClass ? ' ' + bonus_class : ''));
					TweenMax.set(target_slide, hidden);

					item
						.appendTo(target_slide).wrap('<a class="slide"' + imageLink + '></a>')
						.load(function () {
							album._origDim($(this));
							album.resizeNow(this);
							target_slide.removeClass('image-loading');
							item.hide().fadeIn(minorShowTime);
							//start slider if we have first slide prepared
							if (first) {
								album.launch();
							}
							//check if there shouldn't be called ken burns effect for this slide
							//useful when changing slides with goTo
							else if (slide_to_fill_number === current_slide_number) {
								album.kenBurnsEffect();
							}
						})
						.attr('src', slide_options.image).attr('alt', slide_options.alt_attr);

					//photo bg color
					target_slide.css('background-color', slide_options.bg_color);
				}
                else if(slide_type === 'video'){
					//cover for video
					$('<div class="video-poster" style="background-image: url('+slide_options.image+');">').appendTo(target_slide);
					//when image is loaded hide loading animation
					$('<img src="" />')
						.load(function(){
							//var cover = $('<div class="video-poster" style="background-image0: url('+$(this).attr('src')+');">').appendTo(target_slide);
							target_slide.removeClass('image-loading');
							//cover.hide().fadeOut(minorShowTime);
						})
						.attr('src', slide_options.image);

                    target_slide.addClass('image-loading' + (addClass? ' '+bonus_class : ''));
					TweenMax.set(target_slide, hidden);

					if(slide_options.video_type === 'html5'){
						target_slide.append($(slide_options.video_url).html());
					}
					else{
						target_slide.append('<iframe src="'+slide_options.video_url+'" allowfullscreen />');
					}

                    if(slide_options.video_type === 'youtube'){
                        //cause youTube iframe API breaks on firefox when using iframes
                        //we will grab parameters and then switch iframe with div with same id
                        var frame = target_slide.find('iframe'),
                            vid_id = frame.attr('src'),
                            width = frame.width(),
                            height = frame.height(),
                            temp;

                        //search for video id
                        temp = /embed\/([a-zA-Z0-9\-_]+)\??/ig.exec(vid_id);
                        if(temp !== null && temp.length === 2){
                            vid_id = temp[1];
                        }

                        //insert empty div & remove old iframe
                        $('<div/>',{
                            'data-vid_id': vid_id,
                            'data-width': width,
                            'data-height': height
                        }).insertBefore(frame);
                        frame.remove();
                    }

                    if(first){
                        album.launch();

                        //if first slide is video with autoplay enabled
                        if(slide_type === 'video'){
                            if(getField('autoplay')){
                                album.stopMovingToNextSlide();
								album.playVideo();
                            }
                            else{
                                album.pauseVideo();//need for YT video if it is first slide
                            }
                        }

                    }
                }

				var socials	= options.original_items.eq(slide_to_fill_number).find('.a2a_kit');

				//add texts to slide?
				if(options.texts){
					var text_html,
						title       = $.trim(slide_options.title),
						desc        = $.trim(slide_options.desc),
						sc_classes  = 'slide-caption';

					sc_classes += (title_color.length? ' with-color' : '');
					sc_classes += (desc.length || socials.length? ' with-description' : '');

					//title color
					if(title.length && title_color.length){
						title = '<span style="background-color:'+title_color+'">'+title+'</span>';
					}

					//add caption
					if (title.length || desc.length || socials.length){
						text_html =
							'<div class="'+sc_classes+'">' +
								(title.length ? '<h2 class="title">'+title+'</h2>' : '') +
								((desc.length || socials.length) ? '<div class="description"'+(title_color.length? ' style="background-color:'+title_color+'"' : '')+'>'+desc+'</div>' : '') +
								'<div class="texts-opener">+</div>' +
							'</div>';

						target_slide.append(text_html);
						target_slide.find('div.description').append( socials );

						//prepare new slide description
						if(!first){
							TweenMax.set(target_slide.find('div.slide-caption'),{autoAlpha:0});
						}
					}
				}
				else{
					if(socials.length){
						target_slide
							//prepare description HTML
							.append('<div class="slide-caption"><div class="description"></div><div class="texts-opener">+</div></div>')
							//add socials
							.find('div.description').append( socials );
					}
				}

                if(first){ TweenMax.set(target_slide, {x : '0%', visibility:'visible'}); } //remove initial "hide" for first slide
            }
        };


        /* Change Slide
		----------------------------*/
		album.changeSlide = function(move_to_previous_slide, from_drag){
            if(typeof move_to_previous_slide === 'undefined'){ move_to_previous_slide = false; }
            if(typeof from_drag === 'undefined'){ from_drag = false; }

			if(is_slider_playing){
            	album.stopMovingToNextSlide();
			}

            // Find active slide
			var	slide_to_hide = all_slides.filter('.activeslide'),
				pre_prev_slide = all_slides.filter('.prevslide');

            if(slide_to_hide){
                //pause playing video
                album.pauseVideo(slide_to_hide.attr('id'));
            }

			// Get the slide number of new slide
			current_slide_number = move_to_previous_slide? getPreviousSlideNumber() : getNextSlideNumber();

            //clean old prev slide
			pre_prev_slide.removeClass('prevslide');

			//finish instantly old slides
			if(TweenMax.isTweening( pre_prev_slide )){
				TweenMax.getTweensOf(pre_prev_slide)[0].totalProgress(1);
			}

			// Remove active class & update previous slide
            slide_to_hide.removeClass('activeslide').addClass('prevslide');

            var afterChangeCallBack = function(){ hideSlides(slide_to_hide); },
                slide_to_show = all_slides.eq(current_slide_number);

			album.fillSurroundingSlides(current_slide_number);

			// Call function for before slide transition
			album.beforeAnimation();

			slide_to_show.addClass('activeslide');

			//change slide from drag event
			if(from_drag){
				album.afterAnimation();
				afterChangeCallBack();
			}
			//normal slide change
			else{
				slide_to_show.css({visibility:'hidden'});

				switch(transition_type){
					case 0:	// No transition
						TweenMax.set(slide_to_show, {x : '0%', visibility:'visible'});
						afterChangeCallBack();
						album.afterAnimation();
						break;
					case 1:	// Fade
					case 3: //KenBurns
						TweenMax.fromTo(slide_to_show, transition_speed, { autoAlpha : 0, x : '0%'}, { autoAlpha : 1, onComplete : album.afterAnimation} );
						TweenMax.to(slide_to_hide, transition_speed, {autoAlpha : 0});
						break;
					case 2:	// Carousel
						var slider_width =  $el.width();//need for proper drag interactions
						TweenMax.fromTo(slide_to_show, transition_speed, { autoAlpha : 1, xPercent : '0%', x : (move_to_previous_slide? -slider_width : slider_width) }, {x : 0, ease: Power2.easeInOut, onComplete : album.afterAnimation} );
						TweenMax.fromTo(slide_to_hide, transition_speed, {x : 0}, {x : (move_to_previous_slide? slider_width : -slider_width), ease: Power2.easeInOut, onComplete : afterChangeCallBack});
						break;
				}
			}
		};

        album.prevSlide = function(ev){
			if(typeof ev !== 'undefined'){
				ev.preventDefault();
			}
            if (slides_num > 1){
                album.changeSlide(true);
            }
        };

        album.nextSlide = function(ev){
			if(typeof ev !== 'undefined'){
				ev.preventDefault();
			}
            if (slides_num > 1){
                album.changeSlide();
            }
        };


        album.playToggle = function(ev){
			if(typeof ev !== 'undefined'){
				ev.preventDefault();
			}
			//no need to work when there is one slide
            if (slides_num < 2){ return; }

			//pause it
            if (is_slider_playing){
                album.indicatePlayerState('pause');
				album.stopMovingToNextSlide();
				album.kenBurnsEffectPause();
                is_slider_playing = false;
            }
			//play it
            else{
                album.indicatePlayerState('play');
                album.startMovingToNextSlide();
				album.kenBurnsEffect();
                is_slider_playing = true;
            }
        };


        album.indicatePlayerState = function(state){
			var big_play  = $('#big-play'),
				play_svg  = big_play.find('.svg-big-play'),
				pause_svg = big_play.find('.svg-big-pause');

            if (state === 'play'){
                play_button.addClass(state).removeClass('pause');
                big_play.addClass(state).removeClass('pause');
            }
            else if (state === 'pause'){
                play_button.addClass(state).removeClass('play');
                big_play.addClass(state).removeClass('play');
            }

            //no big play above videos to not confuse anyone
            if(getField('type') === 'video'){
                return;
            }

			TweenMax.set(big_play,{autoAlpha: 1, display: 'block'});
			TweenMax.to(big_play, 1.4, {autoAlpha : 0, display:'none'} );

			//reset both
			TweenMax.set([pause_svg, play_svg], {drawSVG:"0%"});

			//animate
			TweenMax.to((state === 'play' ? play_svg : pause_svg), 0.7, {drawSVG: true});
        };


        album.stopMovingToNextSlide = function(){
			album.stopProgressBar();
            clearTimeout(slideshow_interval_id);
        };

        album.startMovingToNextSlide = function(){
			slideshow_interval_id = setTimeout(album.nextSlide, slider_interval_time);
			album.progressBar();
        };


        /* Go to specific slide
		----------------------------*/
        album.goTo = function(targetSlide){
			// If target outside range
			if(targetSlide < 0){
				targetSlide = 0;
			}
            else if(targetSlide > slides_num-1){
				targetSlide = slides_num - 1;
			}

			if (current_slide_number === targetSlide){
				return;
			}

            album.fillSlide(targetSlide);
            clean_after_goTo_function = 1;
			// If ahead of current position
			if(current_slide_number < targetSlide){
				// Adjust for new next slide
				current_slide_number = targetSlide-1; //need to go step back
                album.nextSlide();
			}
			//Otherwise it's before current position
            else if(current_slide_number > targetSlide){
				// Adjust for new prev slide
				current_slide_number = targetSlide+1; //need to go step forward
                album.prevSlide();
			}

			if (thumb_links){
				thumbs.filter('.current-slide').removeClass('current-thumb');
				thumbs.eq(targetSlide).addClass('current-thumb');
			}
		};


		/* Save Original Dimensions of images
		----------------------------*/
		album._origDim = function(targetSlide){
			targetSlide.data('origWidth', targetSlide.width()).data('origHeight', targetSlide.height());
		};

		album.kenBurnsEffect = function(){
			//Ken burns aka Zooming effect?
			if(transition_type === 3){
				if(getField('type') === 'image'){

					var this_img = all_slides.eq(current_slide_number).find('a.slide').children();//img

					var	getFromRange = function(from,to){
							if(from > to ){
								//switch to correct order
								var temp = to;
								to = from;
								from = temp;
							}
							return Math.floor(Math.random()*(to-from+1)) + from;
						},

						rand = Math.random(),
						time = 2*transition_speed + slider_interval_time/1000,
						scale = parseInt(options.ken_burns_scale, 10)/100,
						start_transition_time = 0.5,
						w = parseInt(this_img.width(), 10),
						h = parseInt(this_img.height(), 10),
						top = parseInt(this_img.css('top'), 10)*0.2,
						left = parseInt(this_img.css('left'), 10)*0.2,
						zoom_w = w * scale,
						zoom_h = h * scale,
						zoom_top = (top - (zoom_h - h)/ 2),
						zoom_left = (left - (zoom_w - w)/ 2),
						start_vars, end_vars,
						start_shift_left = getFromRange(-left,left),
						start_shift_top = getFromRange(-top,top),
						end_shift_left = getFromRange(-zoom_left, zoom_left),
						end_shift_top = getFromRange(-zoom_top, zoom_top);

					/** @namespace Linear.easeNone */
					start_vars = {
						scale : 1,
						x : start_shift_left,
						y : start_shift_top,
						ease : Linear.easeNone
					};

					end_vars = {
						scale : scale,
						x : end_shift_left,
						y : end_shift_top,
						ease: Linear.easeNone
					};

					this_img[0].animation = typeof this_img[0].animation === 'undefined' ? new TimelineLite : this_img[0].animation;


					//smooth effect if slider is playing now
					if (is_slider_playing){
						this_img[0].animation
							.pause()
							.clear()
							.fromTo(
							this_img,
							time,
							rand > 0.5 ? start_vars : end_vars,
							rand > 0.5 ? end_vars : start_vars
						)
							.play(0);
					}
					//soft start
					else{
						this_img[0].animation
							.pause()
							.clear()
							.to(
							this_img,
							start_transition_time,
							rand > 0.5 ? start_vars : end_vars
						)
							.to(
							this_img,
							time - start_transition_time,
							rand > 0.5 ? end_vars : start_vars
						)
							.play(0);
					}

				}
			}
		};

		album.kenBurnsEffectPause = function(){
			//Ken burns aka Zooming effect?
			if(transition_type === 3 && getField('type') === 'image'){
				var this_img = all_slides.eq(current_slide_number).find('a.slide').children();//img

				if(typeof this_img[0].animation !== 'undefined'){
					if(this_img[0].animation.isActive()){
						this_img[0].animation.pause().reverse();
					}
				}
			}
		};

		album.afterAnimation = function(){
			// Update previous slide
			if (clean_after_goTo_function){
				clean_after_goTo_function = false;
				all_slides.filter('.prevslide').removeClass('prevslide');
				all_slides.eq(getPreviousSlideNumber()).addClass('prevslide');
			}

			//show description of new slide
			var new_slide_desc = all_slides.eq(current_slide_number).find('div.slide-caption');
			if(new_slide_desc.length){
				TweenMax.fromTo(new_slide_desc, 1, {autoAlpha : 0, y:'-100'}, {autoAlpha : 1, y:'0'});
			}

            if(getField('type') === 'video'){
            	//if current slide is video with auto-play option
				if( getField('autoplay') ){
					//play video
					album.playVideo();
					//nothing to do more
					return;
				}
                //or just initialize API
				else{
                    album.initPlayer(slide_id_pre+current_slide_number);

				}
            }

            if (is_slider_playing){
				album.startMovingToNextSlide();
            }
		};

        album.beforeAnimation = function(){
			if(getField('type') === 'image' && is_slider_playing){
				album.kenBurnsEffect();
			}

			//change slide number in counter
			slide_count_num.text(current_slide_number +1);

			//hide description of slide
			var	old_slide_desc = all_slides.filter('.prevslide').find('div.slide-caption');
			if(old_slide_desc.length){
				TweenMax.to(old_slide_desc, 1, {autoAlpha : 0, y:'100'});
			}

			// Highlight current thumbnail and adjust row position
			if (thumb_links){
				var thumb_list_w = thumb_list.width(),
					position     = 0,
					current_thumb, temp, slidePx;

				//change current thumb class
				thumbs.filter('.current-thumb').removeClass('current-thumb');
				current_thumb = thumbs.eq(current_slide_number).addClass('current-thumb');

				if(!thumbs_busy){
					// If thumb can be out of view
					if (thumb_list_w > tray_width ){
						position = current_thumb.offset().left - tray.offset().left;

						if (current_slide_number === 0){
							animateThumbs(0);
						}
						//thumb out off view on the right
						else if (position >= thumb_interval){
							temp = current_thumb.nextAll().andSelf().length * thumb_width;
							//if there is less slides than width of tray
							if(temp <= thumb_interval ){
								slidePx = -(current_thumb.position().left  - (tray_width - temp));
							}
							else{
								slidePx = -current_thumb.position().left;
							}

							animateThumbs(slidePx);
						}
						//thumb out off view on the left
						else if(position < 0){
							animateThumbs(-current_thumb.position().left);
						}
					}
				}
			}
		};

		album.progressBar = function(stop){
			//don't do anything if progress bar is disabled
			if (!p_bar_enabled){
				return;
			}

			stop = (typeof stop === 'undefined')? false : stop;

			var circle = play_button.find('circle.progress-bar'),
				time = slider_interval_time/1000;

			if(stop){
				TweenMax.to(circle, transition_speed, {drawSVG:"0%"});
			}
			else{
				TweenMax.to(circle, time, {drawSVG: true});
			}
        };

		album.stopProgressBar = function(){
			album.progressBar(1);
		};

		album.textsToggle = function(ev){
			var toggle = $(this),
				elements = toggle.parent().children().not(toggle);
			if(toggle.hasClass('open')){
				toggle.removeClass('open').text('+');
				elements.fadeOut(400, function () {
					elements.css({ display : '', opacity: ''} );//clean after animation
				});
			}
			else{
				toggle.addClass('open').text('-');
				elements.fadeIn();
			}

			if(typeof ev !== 'undefined'){
				ev.stopPropagation();
				ev.preventDefault();
			}
		};

        // Make it go!
        album.prepareEnv();
	};

    $.fn.a13slider = function(options){
        return this.each(function(){
            $.a13slider(options);
        });
    };
})(jQuery);