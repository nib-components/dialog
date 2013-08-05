var Overlay = require('overlay');
var template = require('./template');
var Emitter = require('emitter');
var domify = require('domify');
var xhr = require('xhr');
var events = require('event');
var delegate = require('delegate');
var afterTransition = require('after-transition');

/**
 * Active dialog. There can only be one.
 */
var active;

/**
 * Cross-browser scrollTop
 * @return {Number}
 */
var scrollTop = function() {
  return document.body.scrollTop || document.querySelector('html').scrollTop;
};

/**
 * Default options
 * @type {Object}
 */
Dialog.defaults = {
  hiddenClass: 'is-closed',
  show: true,
  closable: true,
  overlay: true,
  parent: document.body,
  fixed: true,
  hideOthers: true,
  top: null,
  width: null,
  classes: null
};

/**
 * Initialize a new `Dialog`.
 *
 * @param {Object} options
 * @api public
 */
function Dialog(options) {
  this.hiding = true;
  this.entered = false;
  this.onKeyDown = this.onKeyDown.bind(this);
  this.options = this.normalizeOptions(options);
  this.overlay = this.createOverlay();
  this.render();
}

/**
 * Allow the dialog to trigger events
 */
Emitter(Dialog.prototype);

/**
 * Backwards compatibility
 * @type {Function}
 */
Dialog.prototype.trigger = Dialog.prototype.emit;

/**
 * The method used to do AJAX requests
 * @type {Function}
 */
Dialog.prototype.xhr = xhr;

/**
 * Delegate events on the dialog element
 * @return {void}
 * @api private
 */
Dialog.prototype.delegateEvents = function() {
  delegate.bind(this.el, '.js-close', 'click', this.hide.bind(this));
};

/**
 * Normalize the options to return a consistent object we can use
 * @param  {String|Object} options
 * @return {Object}
 */
Dialog.prototype.normalizeOptions = function(options) {
  if( typeof options === "string" ) {
    var _options = { content: options };
    options = _options;
  }
  options = options || {};
  for(var key in Dialog.defaults) {
    if(options[key] == null) {
      options[key] = Dialog.defaults[key];
    }
  }
  return options;
};

/**
 * Create an overlay for this dialog that responds
 * to events on the dialog
 * @return {Overlay}
 */
Dialog.prototype.createOverlay = function() {
  var overlay = new Overlay({
    parent: this.options.parent,
    closable: this.options.closable,
    fixed: this.options.fixed
  });
  overlay.on('hide', this.hide.bind(this));
  this.on('hide', function(){
    overlay.hide();
  });
  this.on('loading', function(){
    overlay.show().loading(true);
  });
  this.on('show', function(){
    overlay.loading(false).show();
  });
  this.on('destroy', function(){
    overlay.hide();
  });
  return overlay;
};

/**
 * Callback for when a keydown event fires on the document
 * @return {void}
 */
Dialog.prototype.onKeyDown = function(e) {
  if (27 != e.which || this.options.closable === false) return;
  this.hide();
};

/**
 * Render with the given `options`.
 *
 * @param {Object} options
 * @api public
 */
Dialog.prototype.render = function(){
  this.el = domify(template);
  if(this.options.width) {
    this.el.style.width = this.options.width;
  }
  if(this.options.classes) {
    this.addClass(this.options.classes);
  }
  if(this.options.closable) {
    this.addClass('is-closable');
  }
  if(this.options.show) {
    this.show();
  }
  this.delegateEvents();
  return this;
};

/**
 * Add a class or classes
 * @param  {String} classes
 * @return {Dialog}
 */
Dialog.prototype.addClass = function(classes) {
  this.el.classList.add.apply(this.el.classList, classes.split(' '));
  return this;
};

/**
 * Remove a class or classes
 * @param  {String} classes
 * @return {Dialog}
 */
Dialog.prototype.removeClass = function(classes) {
  this.el.classList.remove.apply(this.el.classList, classes.split(' '));
  return this;
};

/**
 * Set the content of the dialog
 * @param  {String} content
 * @return {Dialog}
 */
Dialog.prototype.setContent = function(content) {
  var el = this.el.querySelector('.js-content');
  if(el) {
    el.innerHTML = content;
  }
  else {
    this.el.innerHTML = content;
  }
  return this;
};

/**
 * Get the content from the dialog
 * @return {String}
 */
Dialog.prototype.getContent = function() {
  var el = this.el.querySelector('.js-content');
  if(!el) return false;
  return el.innerHTML;
};

/**
 * Position the dialog on the page
 * @return {Dialog}
 */
Dialog.prototype.reposition = function() {
  this.el.style.top = this.options.top || (scrollTop() + 40 + "px");
  this.el.style.marginLeft = (this.el.clientWidth * -0.5) + 'px';
  this.el.style.left = "50%";
};

/**
 * Show some content within the dialog
 * @param  {String} content
 * @return {void}
 */
Dialog.prototype.showContent = function(content) {
  setTimeout(function(){
    this.enterDocument();
    this.setContent(content);
    afterTransition.once(this.el, this.emit.bind(this, 'show finished'));
    this.removeClass(this.options.hiddenClass);
    this.reposition();
    this.emit('show');
  }.bind(this), 0);
};

/**
 * Show the dialog.
 *
 * Emits "show" event.
 *
 * @return {Dialog} for chaining
 * @api public
 */
Dialog.prototype.show = function(){
  var self = this;
  if(this.hiding === false) {
    return false;
  }
  this.hiding = false;

  // Get the content and show it
  if(this.options.url) {
    this.loading(true);
    this.xhr(this.options.url + "?_=" + Date.now(), function(res){
      self.loading(false);
      self.showContent(res.responseText);
    }, function(res){
      self.emit('error', res);
    });
  }
  else {
    this.showContent(this.options.content);
  }

  // Hide any other active dialogs
  if (active && this.options.hideOthers) {
    active.hide();
  }

  // And set this as the current active dialog
  active = this;

  return this;
};

/**
 * Toggle the loading state
 * @param  {Boolean} bool
 * @return {void}
 */
Dialog.prototype.loading = function(bool) {
  if(bool) {
    this.emit('loading');
    this.removeClass(this.options.hiddenClass);
  }
  else {
    this.emit('ready');
    this.addClass(this.options.hiddenClass);
  }
};

/**
 * Emits "hide" event.
 *
 * @return {Dialog} for chaining
 * @api public
 */
Dialog.prototype.hide = function(ms){
  if(this.hiding) {
    return;
  }
  var self = this;
  if(ms) {
    setTimeout(function(){
      self.hide();
    }, ms);
    return this;
  }
  this.hiding = true;

  afterTransition.once(this.el, function(){
    this.leaveDocument();
    this.emit('hide finished');
  }.bind(this));

  this.addClass(this.options.hiddenClass);
  this.emit('hide');
  return this;
};

/**
 * Completely remove the dialog and all references to it
 * @return {void}
 */
Dialog.prototype.destroy = function(){
  this.emit('destroy');
  this.hide();
  this.off();
  this.leaveDocument();
};

/**
 * Remove the element from the DOM
 * @return {void}
 */
Dialog.prototype.leaveDocument = function() {
  if(this.entered === false) return false;
  this.entered = false;
  this.el.parentNode.removeChild(this.el);
  events.unbind(document, 'keydown', this.onKeyDown);
  this.emit('leave');
};

/**
 * Add the element to the DOM
 * @return {void}
 */
Dialog.prototype.enterDocument = function() {
  if(this.entered) return false;
  this.entered = true;
  this.options.parent.appendChild(this.el);
  events.bind(document, 'keydown', this.onKeyDown);
  this.emit('enter');
};

/**
 * Expose `Dialog`.
 */
module.exports = Dialog;
