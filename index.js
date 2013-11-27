/**
 * Export Plugin
 */

module.exports = jsonApi;

function jsonApi(Model) {

  for(var key in statics) Model[key] = statics[key];

  for(key in proto) Model.prototype[key] = proto[key];

  return Model;
}

var statics = {
  plural: function (name) {
    if(name) {
      this._plural = name;
    }
    return this._plural || this.modelName.toLowerCase() + 's';
  }
};

var proto = {
  save: function (fn) {
    if (!this.isNew()) return this.update(fn);
    var self = this;
    var url = this.model.url();
    var key = this.model.primaryKey;
    fn = fn || noop;
    if (!this.isValid()) return fn(new Error('validation failed'));
    this.model.emit('saving', this);
    this.emit('saving');

    var payload = {};
    payload[this.plural()] = self.toJSON();

    this.request
      .post(url)
      .set(this.model._headers)
      .send(payload)
      .end(function(res){
        if (res.error) return fn(error(res), res);
        if (res.body && res.body[self.plural()]) self.primary(res.body[self.plural()][key]);
        self.dirty = {};
        self.model.emit('save', self, res);
        self.emit('save');
        fn(null, res);
      });
  },

  update: function (fn) {
    var self = this;
    var url = this.url();
    fn = fn || noop;
    if (!this.isValid()) return fn(new Error('validation failed'));
    this.model.emit('saving', this);
    this.emit('saving');

    var payload = {};
    payload[this.plural()] = self.toJSON();

    this.request
      .put(url)
      .set(this.model._headers)
      .send(payload)
      .end(function(res){
        if (res.error) return fn(error(res), res);
        self.dirty = {};
        self.model.emit('save', self, res);
        self.emit('save');
        fn(null, res);
      });
  }
};