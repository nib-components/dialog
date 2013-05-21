
/**
 * Module dependencies.
 */

var Overlay = require('overlay');
var template = require('./template');
var utils = require('utils');

/**
 * Active dialog.
 */

var active;

/**
 * Expose `Dialog`.
 */

module.exports = Dialog;

/**
 * Initialize a new `Dialog`.
 *
 * @param {Object} options
 * @api public
 */

function Dialog(options) {
  var self = this;

  // Allows -> new Dialog('Content String');
  if( !_.isObject(options) ) {
    var content = options;
    options = { content: content };
  }

  this.options = options = _.defaults(options || {}, {
    hiddenClass: 'is-closed',
    show: true,
    closable: true,
    overlay: true,
    parent: document.body,
    fixed: true,
    hideOthers: true
  });

  this.render();

  // Hide any other active dialogs
  if (active && !active.hiding && options.hideOthers) {
    active.hide();
  }

  // And set this as the current active dialog
  active = this;

  this.overlay = new Overlay({
    parent: this.options.parent,
    closable: this.options.closable,
    fixed: this.options.fixed
  });

  this.overlay.on('hide', this.hide, this);
  this.on('hide', this.overlay.hide, this.overlay);

  // Immediately show the dialog
  if(this.options.show) {
    this.show();
  }
}

/**
 * Allow the dialog to trigger events
 */
_.extend(Dialog.prototype, Backbone.Events);

/**
 * Render with the given `options`.
 *
 * @param {Object} options
 * @api public
 */

Dialog.prototype.render = function(){
  this.el = $(template);
  if(this.options.width) {
    this.el.css({'max-width': Number(this.options.width) });
  }
  this.el.toggleClass('is-closable', this.options.closable);
  this.el.on('click', '.js-close', _.bind(this.hide, this));
  return this;
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
  if(this.hiding === false) return false;
  var self = this;
  var loading;
  var el = this.el;
  this.hiding = false;

  // Load content from a url
  if(this.options.url) {
    loading = $.ajax({
      url: this.options.url,
      cache: false
    });
    loading.fail(function(){
      self.trigger('error');
    });
  }
  else {
    loading = new $.Deferred();
    loading.resolve(this.options.content);
  }

  if(this.options.overlay) {
    this.overlay.show().loading(true);
  }

  if( this.options.closable ) {
    $(document).on('keydown.dialog', function(e){
      if (27 != e.which) return;
      self.hide();
    });
  }

  // When the content is ready
  loading.done(function(content){

    if(self.options.overlay) {
      self.overlay.loading(false).show();
    }

    el.find('.js-content').empty().html(content);
    el.appendTo(self.options.parent);
    setTimeout(function(){
      el.removeClass(self.options.hiddenClass);
      el.css({
        'margin-left': self.el.outerWidth() * -0.5,
        'left': '50%',
        'top': $(window).scrollTop() + 40
      });
    }, 0);
    self.trigger('show');
  });

  return this;
};

Dialog.prototype.loading = function(bool) {
  this.el.toggleClass(this.options.hiddenClass, bool);
  this.overlay.loading(bool);
};

/**
 * Emits "hide" event.
 *
 * @return {Dialog} for chaining
 * @api public
 */

Dialog.prototype.hide = function(ms){
  if(this.hiding) return;
  var self = this;

  if(ms) {
    setTimeout(function(){
      self.hide();
    }, ms);
    return this;
  }

  $(document).off('keydown.dialog');
  this.hiding = true;

  utils.afterTransition(this.el, function(){
    self.el.remove();
  });

  this.el.addClass(this.options.hiddenClass);
  this.trigger('hide');
  this.off();
  return this;
};