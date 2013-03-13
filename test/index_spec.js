var Dialog = component('dialog');

describe('Dialog', function(){

  beforeEach(function(){
    this.dialog = new Dialog();
  });

  afterEach(function(){
    this.dialog.hide();
  });

  it('should show', function(){
    this.dialog.show();
    expect($('body').find(this.dialog.el).length).to.equal(1);
  });

});