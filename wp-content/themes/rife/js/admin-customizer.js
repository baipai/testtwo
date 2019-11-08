/*global wp */
( function( $ ){
	"use strict";

	var apollo13framework_font_icons_selector = function(){
			var selector = $('#a13-fa-icons');

			if(selector.length){
				var inputs_selector = 'input.a13-fa-icon, input.a13_fa_icon',
					$body = $(document.body),
					icons = selector.children(),
					current_input,

					show_selector = function(){
						current_input = $(this);
						// Reposition the popup window
						selector.css({
							top: (current_input.offset().top + current_input.outerHeight()) + 'px',
							left: current_input.offset().left + 'px'
						}).show();

						$body.off('click.iconSelector');
						$body.on('click.iconSelector', hide_check);
					},

					hide_selector = function(){
						current_input = null;
						selector.hide();
						$body.off('click.iconSelector');
					},

					hide_check = function(e){
						if(typeof e.target !== 'undefined'){
							var check = $(e.target);
							if(check.is(current_input) || check.is(selector) || check.parents('#a13-fa-icons').length){
								//current_input.focus();
							}
							else{
								hide_selector();
							}
						}
					},

					fill_input = function(){
						var hidden = current_input.parents('li.customize-control').eq(0).find('input[type="hidden"]'),
							prefix = current_input.hasClass('a13-full-class')? 'fa fa-' : '',
							val = prefix + $(this).attr('title');
						hidden.val(val);
						current_input.val(val).change(); //no focus, cause it creates risk that it will not refresh
					};

				selector.prependTo('#customize-controls');

				$body
					.on('focus', inputs_selector, {}, show_selector);

				$('span.a13-font-icon').on('click', fill_input);
			}
	},

		cusotmizer_notices = function(){
			var G = ApolloParams,
				frame, header,
				message = G.notices.header_color_variants.msg,

				show_message = function (msg) {
					//don't add message if it already exists
					if($('#a13-header_color_variants').length){
						return;
					}

					var $message = $('<div class="a13-customizer-info" id="a13-header_color_variants"><div class="core">' + msg + '</div><a class="close-forever">I understand, do not show this notice again</a><span class="x fa fa-times"></span></div>');
					$(document.body).append($message);

					$message.one('click', 'span.x', hide_message);
					$message.one('click', 'a.close-forever', hide_forever);
				},

				hide_message = function () {
					var to_hide = $(this);

					//called on massage div
					if(to_hide.is('.a13-customizer-info')){
						to_hide.hide();
					}
					//clicked X
					else{
						to_hide.parent().hide();
					}
				},

				hide_forever = function(){
					hide_message.call(this);

					$.ajax({
						type: "POST",
						url: G.ajaxurl,
						data: {
							action : 'apollo13framework_disable_ajax_notice', //called in backend
							notice_id : 'header_color_variants'
						},
						success: function(reply) {
							//console.log(reply);
						},
						dataType: 'html'
					});
				},

				customizer_walk = function () {
					var notice_enabled = parseInt(G.notices.header_color_variants.enabled, 10);
					//if notice is enabled to be displayed
					if(notice_enabled === 1){
						//if we are in proper panel
						if(wp.customize.panel('section_header_settings').expanded()){
							//show message when using header color variants
							if(header.hasClass('a13-dark-variant') || header.hasClass('a13-light-variant')){
								show_message(message);
							}
						}
						//hide message in other panels
						else{
							hide_message.call($('#a13-header_color_variants'));
						}
					}
				};

			//when customizer API is ready
			wp.customize.bind( 'ready', function() {
				//bind event for sync time
				wp.customize.previewer.bind('synced', function () {
					//get reference to frame
					frame   = $('#customize-preview').children('iframe').last().contents();

					if(frame.length){
						//reference to header
						header = frame.find('#header');

						//while we walk in customizer
						wp.customize.state.unbind('change', customizer_walk);
						wp.customize.state.bind('change', customizer_walk);
					}
				});
			});
		};

	//fire on DOM Ready
	$(document).ready(function(){
		apollo13framework_font_icons_selector();
		cusotmizer_notices();
	});
} )( jQuery );

