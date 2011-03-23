/**
 * @author		Angelo Dini
 * @copyright	http://www.divio.ch under the BSD Licence
 * @requires	Classy, jQuery
 *
 * check if classy.js exists */
 if(window['Class'] === undefined) log('classy.js is required!');

/*##################################################|*/
/* #CUSTOM APP# */
jQuery(document).ready(function ($) {
	/**
	 * Toolbar
	 * @version: 0.0.2
	 * @description: Implements and controls toolbar
	 */
	CMS.Toolbar = Class.$extend({

		options: {
			// not integrated yet
			debug: false,
			items: [],
			csrf_token: '',
			// type definitions used in registerItem()
			types: [
				{ 'anchor': '_registerAnchor' },
				{ 'html': '_reigsterHtml' },
				{ 'switcher': '_reigsterSwitcher' },
				{ 'button': '_reigsterButton' },
				{ 'list': '_reigsterList' }
			]
		},

		initialize: function (container, options) {
			// save reference to this class
			var classy = this;
			// check if only one element is given
			if($(container).length > 2) { log('Toolbar Error: one element expected, multiple elements given.'); return false; }
			// merge passed argument options with internal options
			this.options = $.extend(this.options, options);
			
			// set initial variables
			this.wrapper = $(container);
			this.toolbar = this.wrapper.find('#cms_toolbar-toolbar');
			this.toolbar.left = this.toolbar.find('.cms_toolbar-left');
			this.toolbar.right = this.toolbar.find('.cms_toolbar-right');
			
			// bind event to toggle button so toolbar can be shown/hidden
			this.toggle = this.wrapper.find('#cms_toolbar-toggle');
			this.toggle.bind('click', function (e) {
				e.preventDefault();
				classy.toggleToolbar();
			});
			
			// initial setups
			this._setup();
		},
		
		/* set some basic settings */
		_setup: function () {
			// save reference to this class
			var classy = this;
			
			// scheck if toolbar should be shown or hidden
			($.cookie('CMS_toolbar-collapsed') == 'false') ? this.toolbar.data('collapsed', true) : this.toolbar.data('collapsed', false);
			// follow up script to set the current state
			this.toggleToolbar();
			
			// set toolbar to visible
			this.wrapper.show();
			// some browsers have problem showing it directly (loading css...)
			setTimeout(function () { classy.wrapper.show(); }, 50);
			
			// start register items if any given
			if(this.options.items.length) this.registerItems(this.options.items);
		},
		
		toggleToolbar: function () {
			(this.toolbar.data('collapsed')) ? this._showToolbar() : this._hideToolbar();
		},
		
		/* always use toggleToolbar to set the current state */
		_showToolbar: function () {
			var classy = this;
			// add toolbar padding
			var padding = parseInt($(document.body).css('margin-top'));
				$(document.body).css('margin-top', (padding+43)); // 43 = height of toolbar
			// show toolbar
			this.toolbar.show();
			// change data information
			this.toolbar.data('collapsed', false);
			// add class to trigger
			this.toggle.addClass('cms_toolbar-collapsed');
			// save as cookie
			$.cookie('CMS_toolbar-collapsed', false, { path:'/', expires:7 });
		},
		
		_hideToolbar: function () {
			// remove toolbar padding
			var padding = parseInt($(document.body).css('margin-top'));
				$(document.body).css('margin-top', (padding-this.toolbar.height()-1)); // substract 1 cause of the border
			// hide toolbar
			this.toolbar.hide();
			// change data information
			this.toolbar.data('collapsed', true);
			// remove class from trigger
			this.toggle.removeClass('cms_toolbar-collapsed');
			// save as cookie
			$.cookie('CMS_toolbar-collapsed', true, { path:'/', expires:7 });
		},

		registerItem: function (obj) {
			// error handling
			if(!obj.order) obj.dir = 0;
			
			// check for internal types
			// jonas wants some refactoring here
			switch(obj.type) {
				case 'anchor':
					this._registerAnchor(obj);
					break;
				case 'html':
					this._registerHtml(obj);
					break;
				case 'switcher':
					this._registerSwitcher(obj);
					break;
				case 'button':
					this._registerButton(obj);
					break;
				case 'list':
					this._registerList(obj);
					break;
				default:
					this.registerType(obj);
			}
		},
		
		registerItems: function (items) {
			// make sure an array is passed
			if(typeof(items) != 'object') return false;
			// save reference to this class
			var classy = this;
			// loopp through all items and pass them to single function
			$(items).each(function (index, value) {
				classy.registerItem(value);
			});
		},

		removeItem: function (index) {
			// function to remove an item
			if(index) $($('.cms_toolbar-item:visible')[index]).remove();
		},
		
		/* the following private methods are reserved for registring each itemtype */
		_registerAnchor: function (obj) {
			// take a copy of the template, append it, remove it, copy html... because jquery is stupid
			var template = this._processTemplate('#cms_toolbar-item_anchor', obj);
			this._injectItem(template, obj.dir, obj.order);
		},
		
		_registerHtml: function (obj) {
			// here we dont need processTemplate cause we create the template
			var template = (obj.html) ? $(obj.html) : $(obj.htmlElement);
			// add order, show item
			template.data('order', obj.order).css('display', 'block');
			// add class if neccessary
			if(obj.class) template.addClass(obj.class);
			// add events
			template.find('.cms_toolbar-btn').bind('click', function (e) {
				e.preventDefault();
				(obj.redirect) ? window.location = obj.redirect : $(this).parentsUntil('form').parent().submit();
			});
			// append item
			this._injectItem(template, obj.dir, obj.order);
		},
		
		_registerSwitcher: function (obj) {
			// save reference to this class
			var classy = this;
			// take a copy of the template, append it, remove it, copy html... because jquery is stupid
			var template = this._processTemplate('#cms_toolbar-item_switcher', obj);
			// should btn be shown?
			var btn = template.find('.cms_toolbar-item_switcher-link span');
			
			// initial setup
			if(obj.state == true) {
				btn.data('state', true).css('backgroundPosition', '0px -198px');
			} else {
				btn.data('state', false).css('backgroundPosition', '-40px -198px');
			}
			
			// add events
			template.find('.cms_toolbar-item_switcher-link').bind('click', function (e) {
				e.preventDefault();
				
				// animate toggle effect and trigger handler
				if(btn.data('state') == true) {
					btn.stop().animate({'backgroundPosition': '-40px -198px'}, function () {
						// disable link
						var url = CMS.Helpers.removeUrl(window.location.href, obj.addParameter);
						window.location = CMS.Helpers.insertUrl(url, obj.removeParameter, "")
					});
				} else {
					btn.stop().animate({'backgroundPosition': '0px -198px'}, function () {
						// enable link
						window.location = CMS.Helpers.insertUrl(location.href, obj.addParameter, "");
					});
				}
			});
			// append item
			this._injectItem(template, obj.dir, obj.order);
		},
		
		_registerButton: function (obj) {
			// take a copy of the template, append it, remove it, copy html... because jquery is stupid
			var template = this._processTemplate('#cms_toolbar-item_button', obj);
			// append item
			this._injectItem(template, obj.dir, obj.order);
		},
		
		_registerList: function (obj) {
			// take a copy of the template, append it, remove it, copy html... because jquery is stupid
			var template = this._processTemplate('#cms_toolbar-item_list', obj);
			
			// item injection logic
			var list = template.find('.cms_toolbar-item_list').html().trim();
			var tmp = '';
			// lets loop through the items
			$(obj.items).each(function (index, value) {
				// add icon if available
				var icon = (value.icon) ? 'cms_toolbar_icon ' : '';
				// replace attributes
				tmp += list.replace('[list_title]', value.title).replace('[list_url]', value.url).replace('<span>', '<span class="'+icon+value.icon+'">');
			});
			// add items
			template.find('.cms_toolbar-item_list').html($(tmp));
			
			// add events
			var container = template.find('.cms_toolbar-item_list'); 
			var btn = template.find('.cms_toolbar-btn');
				btn.data('collapsed', true).bind('click', function (e) {
					e.preventDefault();
					($(this).data('collapsed')) ? show_list() : hide_list();
			});
			
			function show_list() {
				// add event to body to hide the list needs a timout for late trigger
				setTimeout(function () {
					$(window).bind('click', hide_list);
				}, 100);
				
				// show element and save data
				container.show();
				btn.addClass('cms_toolbar-btn-active').data('collapsed', false);
			}
			function hide_list() {
				// remove the body event
				$(window).unbind('click');
				
				// show element and save data
				container.hide();
				btn.removeClass('cms_toolbar-btn-active').data('collapsed', true);
			}
			
			// append item
			this._injectItem(template, obj.dir, obj.order);
		},
		
		registerType: function (ob) {
			log('can haz new type?');
			/* you should be able to register a new type, either through
				the current concept or through json matches as defined
				in the options (see types - not implemented yet) */
		},
		
		/* this private method processes each template and replaces the placeholders with the passed values */
		_processTemplate: function (class, obj) {
			// lets find the template and clone it
			var template = this.wrapper.find(class).clone();
				template = $('<div>').append(template).clone().remove().html();
			// replace placeholders
			if(obj.title) template = template.replace('[title]', obj.title);
			if(obj.url) template = template.replace('[url]', obj.url);
			if(!obj.icon && obj.type == 'button') template = template.replace('&nbsp;', '').replace('&nbsp;', '');
			template = template.replace('[token]', this.options.csrf_token);
			template = (obj.action) ? template.replace('[action]', obj.action) : template.replace('[action]', '');
			template = (obj.hidden) ? template.replace('[hidden]', obj.hidden) : template.replace('[hidden]', '');
			// back to jquery object
			template = $(template);
			if(obj.class) template.addClass(obj.class);
			if(obj.icon) template.find('.cms_toolbar-btn_right').addClass(obj.icon);
			// add events
			template.find('.cms_toolbar-btn').bind('click', function (e) {
				e.preventDefault();
				(obj.redirect) ? window.location = obj.redirect : $(this).parentsUntil('form').parent().submit();
			});
			// save order remove id and show element
			template.data('order', obj.order)
					.attr('id', '')
					.css('display', 'block');
			
			return template;
		},
		
		/* handles item injections and places them in the correct order */
		_injectItem: function (el, dir, order) {
			// save some vars
			var left = this.toolbar.left;
			var right = this.toolbar.right;
			
			if(dir == 'left') {
				var leftContent = left.find('> *');
					if(!leftContent.length) { left.append(el); return false; }
				
				// first insert it at start position
				el.insertBefore($(leftContent[0]));
				
				// and what happens if there is already an element?
				leftContent.each(function (index, item) {
					// sava data from element
					var current = $(item).data('order');
					// inject data when current is lower, repeat till element fits position
					if(order >= current || order == current) el.insertAfter($(item));
				});
			}
			
			if(dir == 'right') {
				var rightContent = right.find('> *');
					if(!rightContent.length) { right.append(el); return false; }
				
				// first insert it at start position
				el.insertBefore($(rightContent[0]));
				
				rightContent.each(function (index, item) {
					// save data from element
					var current = $(item).data('order');
					// inject data when current is lower, repeat till element fits position
					if(order >= current || order == current) el.insertAfter($(item));
				});
			}
		}
		
	});
});