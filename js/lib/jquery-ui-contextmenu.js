/*! jQuery UI context menu plugin - v1.2.3 - 2013-10-19 |  https://github.com/mar10/jquery-ui-contextmenu |  Copyright (c) 2013 Martin Wendt; Licensed MIT */
(function(e,t,n,i){"use strict";function s(e){return e&&e.match(/^#/)?e.substring(1):e||""}var o="onselectstart"in n.createElement("div");e.widget("moogle.contextmenu",{version:"1.2.2",options:{delegate:null,hide:{effect:"fadeOut",duration:"fast"},ignoreParentSelect:!0,menu:null,position:null,preventSelect:!1,show:{effect:"slideDown",duration:"fast"},taphold:!1,beforeOpen:e.noop,blur:e.noop,close:e.noop,create:e.noop,createMenu:e.noop,focus:e.noop,open:e.noop,select:e.noop},_create:function(){var t,i,s=this.options;this.$headStyle=null,this.$menu=null,this.menuIsTemp=!1,this.currentTarget=null,s.preventSelect&&(i=(e(this.element).is(n)?e("body"):this.element).uniqueId().attr("id"),this.$headStyle=e("<style class='moogle-contextmenu-style'>").prop("type","text/css").html("#"+i+" "+s.delegate+" { "+"-webkit-user-select: none; "+"-khtml-user-select: none; "+"-moz-user-select: none; "+"-ms-user-select: none; "+"user-select: none; "+"}").appendTo("head"),o&&this.element.delegate(s.delegate,"selectstart"+this.eventNamespace,function(e){e.preventDefault()})),this._createUiMenu(s.menu),t="contextmenu"+this.eventNamespace,s.taphold&&(t+=" taphold"+this.eventNamespace),this.element.delegate(s.delegate,t,e.proxy(this._openMenu,this))},_destroy:function(){this.element.undelegate(this.eventNamespace),this._createUiMenu(null),this.$headStyle&&(this.$headStyle.remove(),this.$headStyle=null)},_createUiMenu:function(t){this.isOpen()&&this._closeMenu(!0),this.menuIsTemp?this.$menu.remove():this.$menu&&this.$menu.menu("destroy").hide(),this.$menu=null,this.menuIsTemp=!1,t&&(e.isArray(t)?(this.$menu=e.moogle.contextmenu.createMenuMarkup(t),this.menuIsTemp=!0):this.$menu="string"==typeof t?e(t):t,this.$menu.hide().menu({blur:e.proxy(this.options.blur,this),create:e.proxy(this.options.createMenu,this),focus:e.proxy(this.options.focus,this),select:e.proxy(function(t,n){var i,o=n.item.has(">a[aria-haspopup='true']").length>0,u=n.item.find(">a"),r=u.data("actionHandler");n.cmd=s(u.attr("href")),n.target=e(this.currentTarget),o&&this.options.ignoreParentSelect||(i=this._trigger.call(this,"select",t,n),r&&(i=r.call(this,t,n)),i!==!1&&this._closeMenu.call(this),t.preventDefault())},this)}))},_openMenu:function(t){var s=this.options,o=s.position,u=this,r={menu:this.$menu,target:e(t.target)};return this.currentTarget=t.target,t.preventDefault(),this._trigger("beforeOpen",t,r)===!1?(this.currentTarget=null,!1):(r.menu=this.$menu,e(n).bind("keydown"+this.eventNamespace,function(t){t.which===e.ui.keyCode.ESCAPE&&u._closeMenu()}).bind("mousedown"+this.eventNamespace+" touchstart"+this.eventNamespace,function(t){e(t.target).closest(".ui-menu-item").length||u._closeMenu()}),e.isFunction(o)&&(o=o(t,r)),o=e.extend({my:"left top",at:"left bottom",of:t.pageX===i?t.target:t,collision:"fit"},o),this.$menu.show().css({position:"absolute",left:0,top:0}).position(o).hide(),this._show(this.$menu,this.options.show,function(){u._trigger.call(u,"open",t,r)}),i)},_closeMenu:function(t){var i=this,s=t?!1:this.options.hide;e(n).unbind("mousedown"+this.eventNamespace).unbind("touchstart"+this.eventNamespace).unbind("keydown"+this.eventNamespace),this._hide(this.$menu,s,function(){i._trigger("close"),i.currentTarget=null})},_setOption:function(t,n){switch(t){case"menu":this.replaceMenu(n)}e.Widget.prototype._setOption.apply(this,arguments)},_getMenuEntry:function(e,t){var n=this.$menu.find("li a[href=#"+s(e)+"]");return t?n.closest("li"):n},close:function(){this.isOpen()&&this._closeMenu()},enableEntry:function(e,t){this._getMenuEntry(e,!0).toggleClass("ui-state-disabled",t===!1)},getMenu:function(){return this.$menu},isOpen:function(){return!!this.$menu&&!!this.currentTarget},open:function(e){var t=jQuery.Event("contextmenu",{target:e.get(0)});return this.element.trigger(t)},replaceMenu:function(e){this._createUiMenu(e)},setEntry:function(t,n){var i,s=this._getMenuEntry(t,!1);"string"==typeof n?s.children("span").length?s.contents().filter(function(){return 3===this.nodeType}).first().replaceWith(n):s.text(n):(i=s.closest("li").empty(),n.cmd=n.cmd||t,e.moogle.contextmenu.createEntryMarkup(n,i))},showEntry:function(e,t){this._getMenuEntry(e,!0).toggle(t!==!1)}}),e.extend(e.moogle.contextmenu,{createEntryMarkup:function(t,n){var i=null;return/[^\-\u2014\u2013\s]/.test(t.title)?(i=e("<a>",{text:""+t.title,href:"#"+s(t.cmd)}).appendTo(n),e.isFunction(t.action)&&i.data("actionHandler",t.action),t.uiIcon&&i.append(e("<span class='ui-icon'>").addClass(t.uiIcon)),t.disabled&&n.addClass("ui-state-disabled"),e.isPlainObject(t.data)&&i.data(t.data)):n.text(t.title),i},createMenuMarkup:function(t,n){var i,s,o,u;for(null==n&&(n=e("<ul class='ui-helper-hidden'>").appendTo("body")),i=0;t.length>i;i++)s=t[i],u=e("<li>").appendTo(n),e.moogle.contextmenu.createEntryMarkup(s,u),e.isArray(s.children)&&(o=e("<ul>").appendTo(u),e.moogle.contextmenu.createMenuMarkup(s.children,o));return n}})})(jQuery,window,document);