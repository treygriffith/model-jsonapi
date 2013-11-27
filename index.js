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
      return this;
    }
    return this._plural || this.modelName.toLowerCase() + 's';
  },
  all: function (fn) {
    var self = this;
    var url = this.url('');
    this.request
      .get(url)
      .set(this._headers)
      .end(function(res){
        if (res.error) return fn(error(res), null, res);
        var col = new Collection;
        if(res.body && res.body[self.plural()]) {
          for (var i = 0, len = res.body[self.plural()].length; i < len; ++i) {
            col.push(new self(res.body[i]));
          }
        }
        fn(null, col, res);
      });
  },
  get: function (id, fn) {
    var self = this;
    var url = this.url(id);
    this.request
      .get(url)
      .set(this._headers)
      .end(function(res){
        if (res.error) return fn(error(res), null, res);
        var body = res.body && res.body[self.plural()] ? res.body[self.plural()][0] : undefined;
        var model = new self(body);
        fn(null, model, res);
      });
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
    payload[this.model.plural()] = [self.toJSON()];

    this.request
      .post(url)
      .set(this.model._headers)
      .send(payload)
      .end(function(res){
        if (res.error) return fn(error(res), res);
        if (res.body && res.body[self.model.plural()] && res.body[self.model.plural()].length)
          self.primary(res.body[self.model.plural()][0][key]);
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
    payload[this.model.plural()] = [self.toJSON()];

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