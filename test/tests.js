var Dialog = require('dialog');
var chai = require('chai');
chai.should();

function emitKeypress(element, which) {
  var evt = document.createEvent("KeyboardEvent");
  evt.initKeyboardEvent("keydown", true, true, null, false, false, false, false, 0, 0);
  evt.which = which;
  element.dispatchEvent(evt);
}

describe('Dialog', function(){
  var dialog;

  beforeEach(function(){
    dialog = new Dialog({
      content: 'foo'
    });
  });

  afterEach(function(){
    dialog.destroy();
  });

  describe('normalizing options', function(){
    it('should set the defaults', function(){
      dialog.normalizeOptions({}).show.should.be.true;
    });
    it('should only use defaults if needed', function(){
      dialog.normalizeOptions({ show: false }).show.should.be.false;
    });
    it('should accept a string', function(){
      dialog.normalizeOptions('foo').content.should.equal('foo');
    });
    it('should make the options optional', function(){
      dialog.normalizeOptions().show.should.be.true;
    });
  });

  describe('delegating events', function(){
    it('should close when the button is clicked', function(done){
      dialog.on('hide', function(){
        dialog.hiding.should.be.true;
        done();
      });
      dialog.el.querySelector('.js-close').click();
    });
  });

  describe('the overlay', function(){
    var overlay;
    beforeEach(function(){
      overlay = dialog.createOverlay();
    });
    it('should hide when the dialog is closed', function(done) {
      overlay.hide = function(){
        chai.assert(true);
        done();
      };
      dialog.hide();
    });
    it('should be loading when the dialog is loading', function(done){
      overlay.on('loading', function(){
        chai.assert(true);
        done();
      });
      dialog.loading(true);
    });
    it('should stop loading when the dialog is shown', function(done){
      overlay.on('ready', function(){
        chai.assert(true);
        done();
      });
      dialog.emit('show');
    });
    it('should hide the dialog when it is hidden', function(){
      dialog.hiding.should.be.false;
      overlay.hide();
      dialog.hiding.should.be.true;
    });
  });

  describe('destroying the dialog', function(){
    it('should be removed from the DOM', function(){
      dialog.destroy();
      dialog.entered.should.be.false;
    });
    it('should unbind all events', function(){
      var fired = false;
      dialog.on('foo', function(){
        fired = true;
      });
      dialog.destroy();
      dialog.emit('foo');
      fired.should.be.false;
    });
  });

  describe('entering and leaving the DOM', function(){
    it('should not try to enter the DOM if it is already there', function(){
      dialog.enterDocument().should.be.false;
    });
    it('should not try to leave the DOM multiple times', function(){
      dialog.leaveDocument();
      dialog.leaveDocument().should.be.false;
    });
  });

  describe('showing the dialog', function(){
    var d;
    beforeEach(function(){
      d = new Dialog({
        show: false
      });
    });
    afterEach(function(){
      d.destroy();
    });
    it('should be in the document', function(){
      d.show();
      d.el.parentNode.should.equal(document.body);
    });
    it('should set the content', function(){
      d.show();
      d.setContent('foo');
      d.el.querySelector('.js-content').innerHTML.should.equal('foo');
    });
    it('should not have a closed class', function(done){
      d.el.classList.contains('is-closed').should.be.true;
      d.on('show', function(){
        d.el.classList.contains('is-closed').should.be.false;
        done();
      });
      d.show();
    });
  });

  describe('hiding the dialog', function(){
    beforeEach(function(){
      dialog.hide();
    });
    it('should not be in the document', function(done){
      var d = new Dialog();
      d.on('hide finished', function(){
        chai.assert(dialog.el.parentNode === null);
        done();
      });
      d.hide();
    });
    it('should have a closed class', function(done){
      var d = new Dialog();
      d.on('hide', function(){
        d.el.classList.contains('is-closed').should.be.true;
        done();
      });
      d.hide();
    });
  });

  describe('fetching content from a url', function(){
    var d;
    beforeEach(function(){
      d = new Dialog({
        show: false,
        url: '/foo'
      });
    });
    afterEach(function(){
      d.destroy();
    });
    it('should have a url', function(){
      d.options.url.should.equal('/foo');
    });
    it('should fetch content via AJAX', function(done){
      d.on('show', function(){
        d.getContent().should.equal('foo');
        done();
      });
      d.xhr = function(url, callback, errback) {
        callback({ responseText: 'foo' });
        done();
      };
      d.show();
    });
    it('should emit an error when there is a problem with the AJAX request', function(done){
      d.on('error', done);
      d.xhr = function(url, callback, errback) {
        errback();
      };
      d.show();
    });
  });

});