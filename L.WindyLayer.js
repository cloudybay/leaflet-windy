
L.WindyLayer = (L.Layer ? L.Layer : L.Class).extend({

    options: {
    },

    _map: null,
    _canvasLayer: null,
    _windy: null,

    initialize: function(options) {
        L.setOptions(this, options)
    },

    onAdd: function(map) {
        this._canvasLayer = L.canvasLayer().delegate(this)
        this._canvasLayer.addTo(map)
        this._map = map
    },

    onRemove: function(map) {
        this._destroyWind()
    },

    is_active: function() {
        return this._windy
    },

    data: function() {
        return this.options.data
    },

    transformData: function(transform_options) {
        var self = this
        if (transform_options.data && transform_options.data.length > 0) {
            if (self._transform_animate) {
                cancelAnimationFrame(self._transform_animate)
            }
            self._transform_animate = null;

            if (self._windy && transform_options.speed) {
                var interpolated_data = transform_options.data,
                    interpolated_speed = transform_options.speed;
                self.transform_speed = self.options.transform_speed || 2000;
                self.transform_idx = 0;

                (function transform_animate() {
                    if (self.transform_idx >= 0 && self.transform_idx < interpolated_data.length) {
                        let data = interpolated_data[self.transform_idx]
                        self.setData(data)
                        if (self.transform_idx < interpolated_data.length-1) {
                            self.transform_idx ++
                            self._transform_animate = setTimeout(
                                transform_animate,
                                self.transform_speed * interpolated_speed
                            )
                            return;
                        }
                    }
                    interpolated_data = []
                }())
            }
            else {
                self.setData(transform_options.data[transform_options.data.length-1])
            }
        }
        return self
    },

    setData: function(new_data) {
        if (this._windy) {
            this._windy.setData(new_data)
        }
        this.options.data = new_data
        return this
    },

    onDrawLayer: function(params) {
        if (this._windy) {
            this._windy = this._windy.release()
        }

        this._windy = this._createWind(params.canvas, params.size, params.bounds)

        if (this.options.data) {
            this._windy.setData(this.options.data);
        }
        this._windy.start()
        return this
    },

    _createWind: function(canvas, size, bounds) {
        return new Windy(
            canvas,
            [
                [0, 0],
                [size.x, size.y]
            ],
            size.x,
            size.y,
            [
                [bounds._southWest.lng, bounds._southWest.lat],
                [bounds._northEast.lng, bounds._northEast.lat]
            ],
            this.options
        )
    },

    _destroyWind: function() {
        if (this._transform_animate) {
            cancelAnimationFrame(this._transform_animate)
            this._transform_animate = null
        }
        if (this._windy) {
            this._windy = this._windy.release()
        }
        this._canvasLayer.clear()
        this._map.removeLayer(this._canvasLayer)
        this._canvasLayer = null
    }
});

L.windyLayer = function(options) {
    return new L.WindyLayer(options);
};
