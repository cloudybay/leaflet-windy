import { Windy } from './windy.js'

L.WindyLayer = (L.Layer ? L.Layer : L.Class).extend({

    options: {
    },

    _map: null,
    _canvasLayer: null,
    _windy: null,

    initialize: function(options) {
        if (!options.key_of_vector_u || !options.key_of_vector_v) {
            console.error("Miss options key_of_vector_u and key_of_vector_v")
        }
        L.setOptions(this, options)
    },

    onAdd: function(map) {
        let options = {};
        if (typeof this.options.opacity !== 'undefined') {
            options.opacity = this.options.opacity;
        }
        if (typeof this.options.pane !== 'undefined') {
            options.pane = this.options.pane;
        }
        if (typeof this.options.zIndex !== 'undefined') {
            options.zIndex = this.options.zIndex;
        }
        if (typeof this.options.className !== 'undefined') {
            options.className = this.options.className;
        }
        if (typeof this.options.canvas_scale !== 'undefined') {
            options.canvas_scale = this.options.canvas_scale;
        }
        this._canvasLayer = L.windCanvas(options).delegate(this)
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
        let options = Object.assign({}, this.options)
        let zoom = this._map.getZoom()
        if (zoom == 16) {
            options.velocityScale = 0.0015
            options.trailAge = 0.96
            options.particleAge = 120
        }
        else if (zoom == 17) {
            options.velocityScale = 0.001
            options.trailAge = 0.97
            options.particleAge = 105
        }
        else if (zoom == 18) {
            options.velocityScale = 0.00075
            options.trailAge = 0.98
            options.particleAge = 90
        }
        else if (zoom == 19) {
            options.velocityScale = 0.0005
            options.trailAge = 0.98
            options.particleAge = 90
        }
        else if (zoom == 20) {
            options.velocityScale = 0.001
            options.trailAge = 0.97
            options.particleAge = 90
            options.particleMultiplier = this.options.particleMultiplier * 0.8
        }
        else if (zoom == 21) {
            options.velocityScale = 0.002
            options.trailAge = 0.96
            options.particleAge = 60
            options.particleMultiplier = this.options.particleMultiplier * 0.6
        }
        else if (zoom == 22) {
            options.velocityScale = 0.004
            options.trailAge = 0.95
            options.particleAge = 30
            options.particleMultiplier = this.options.particleMultiplier * 0.4
        }
        else if (zoom == 23) {
            options.velocityScale = 0.008
            options.trailAge = 0.95
            options.particleAge = 20
            options.particleMultiplier = this.options.particleMultiplier * 0.2
        }
        else if (zoom == 24) {
            options.velocityScale = 0.016
            options.trailAge = 0.94
            options.particleAge = 15
            options.particleMultiplier = this.options.particleMultiplier * 0.1
        }

        let [bounds, width, height, extent] = this._buildParams(params.size, params.bounds);
        if (!this._windy) {
            this._windy = new Windy(
                params.canvas,
                bounds, width, height, extent,
                options
            );
        }
        else {
            this._windy.setOptions(options)
            this._windy.setCanvas(params.canvas, bounds, width, height, extent);
        }

        if (this.options.data) {
            this._windy.setData(this.options.data, params.no_worker);
        }
        this._windy.start();
        return this;
    },

    _buildParams: function(size, bounds) {
        return[
            [
                [0, 0],
                [size.x, size.y]
            ],
            size.x,
            size.y,
            [
                [bounds._southWest.lng, bounds._southWest.lat],
                [bounds._northEast.lng, bounds._northEast.lat]
            ]
        ];
    },

    _destroyWind: function() {
        if (this._transform_animate) {
            cancelAnimationFrame(this._transform_animate);
            this._transform_animate = null;
        }
        if (this._windy) {
            this._windy.release();
            this._windy = null;
        }
        this._canvasLayer.clear();
        this._map.removeLayer(this._canvasLayer);
        this._canvasLayer = null;
    }
});

L.windyLayer = function(options) {
    return new L.WindyLayer(options);
};
